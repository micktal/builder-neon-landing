import type { RequestHandler } from "express";

const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

let tokenStore: { access_token: string; refresh_token?: string; expiry_date?: number; token_type?: string } | null = null;

function baseUrl(req: any) { return `${req.protocol}://${req.get("host")}`; }

export const gcalAuthUrl: RequestHandler = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl(req)}/api/gcal/callback`;
    if (!clientId) return res.status(500).json({ error: "Missing GOOGLE_CLIENT_ID" });
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("scope", OAUTH_SCOPES);
    url.searchParams.set("include_granted_scopes", "true");
    return res.json({ url: url.toString() });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Auth URL error" });
  }
};

export const gcalCallback: RequestHandler = async (req, res) => {
  try {
    const code = String(req.query.code || "");
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl(req)}/api/gcal/callback`;
    if (!clientId || !clientSecret) return res.status(500).send("Missing GOOGLE_CLIENT_ID/SECRET");

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });
    const tokenJson = await tokenResp.json();
    if (!tokenResp.ok) return res.status(500).send(`<pre>${escapeHtml(JSON.stringify(tokenJson, null, 2))}</pre>`);
    tokenStore = {
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      expiry_date: Date.now() + (tokenJson.expires_in || 3600) * 1000,
      token_type: tokenJson.token_type,
    };
    const html = `<!DOCTYPE html><html><body><script>window.opener && window.opener.postMessage({ type: 'gcal_connected' }, '*'); window.close();</script>Connecté. Vous pouvez fermer cette fenêtre.</body></html>`;
    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  } catch (e: any) {
    return res.status(500).send(e?.message || "Callback error");
  }
};

async function ensureAccessToken(req: any): Promise<string> {
  if (tokenStore && tokenStore.access_token && tokenStore.expiry_date && Date.now() < tokenStore.expiry_date - 60_000) return tokenStore.access_token;
  if (tokenStore?.refresh_token) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: String(clientId),
        client_secret: String(clientSecret),
        grant_type: "refresh_token",
        refresh_token: String(tokenStore.refresh_token),
      }).toString(),
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json?.error || "Failed to refresh token");
    tokenStore.access_token = json.access_token;
    tokenStore.expiry_date = Date.now() + (json.expires_in || 3600) * 1000;
    return tokenStore.access_token;
  }
  throw new Error("Not connected to Google Calendar");
}

export const gcalStatus: RequestHandler = async (_req, res) => {
  return res.json({ connected: !!tokenStore });
};

export const gcalFreeBusy: RequestHandler = async (req, res) => {
  try {
    const accessToken = await ensureAccessToken(req);
    const { timeMin, timeMax } = req.body || {};
    const body = { timeMin, timeMax, items: [{ id: "primary" }] };
    const resp = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(body),
    });
    const json = await resp.json();
    if (!resp.ok) return res.status(500).json(json);
    return res.json(json);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "FreeBusy error" });
  }
};

export const gcalCreateEvent: RequestHandler = async (req, res) => {
  try {
    const accessToken = await ensureAccessToken(req);
    const { summary, description, start, end, attendeeEmail, location } = req.body || {};
    const body = {
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
      location,
    };
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("sendUpdates", "all");
    const resp = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(body),
    });
    const json = await resp.json();
    if (!resp.ok) return res.status(500).json(json);
    return res.json(json);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Create event error" });
  }
};

function escapeHtml(s: string) { return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c] as string)); }
