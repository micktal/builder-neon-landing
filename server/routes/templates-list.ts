import type { RequestHandler } from "express";

import fs from "fs";
import path from "path";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; } }
      else { field += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cur.push(field.trim()); field = ""; }
      else if (ch === '\n') { cur.push(field.trim()); rows.push(cur); cur = []; field = ""; }
      else if (ch === '\r') { /* ignore */ }
      else { field += ch; }
    }
  }
  if (field.length || cur.length) { cur.push(field.trim()); rows.push(cur); }
  return rows.filter(r => r.length && r.some(c => c.length));
}

export const listTemplates: RequestHandler = async (req, res) => {
  try {
    const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    if (!PRIVATE_KEY) return res.status(500).json({ error: "Missing BUILDER_PRIVATE_KEY" });
    const limit = Math.min(parseInt(String(req.query.limit || 200), 10) || 200, 500);
    const url = new URL(`https://builder.io/api/v3/content/templates`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("fields", "data,id");

    const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${PRIVATE_KEY}`, Accept: "application/json" } });
    const txt = await resp.text();
    if (!resp.ok) {
      return res.status(500).json({ error: "Builder error", detail: txt });
    }
    const json = (() => { try { return JSON.parse(txt); } catch { return null; } })();
    let results = Array.isArray(json?.results) ? json.results : Array.isArray(json) ? json : [];

    // Fallback: if no results, try to import from CSV once
    if (!results.length) {
      const file = path.join(process.cwd(), "server", "data", "templates.csv");
      if (fs.existsSync(file)) {
        await fetch(`${req.protocol}://${req.get("host")}/api/import/templates`).catch(() => {});
        const resp2 = await fetch(url.toString(), { headers: { Authorization: `Bearer ${PRIVATE_KEY}`, Accept: "application/json" } });
        const txt2 = await resp2.text();
        try { const j2 = JSON.parse(txt2); results = Array.isArray(j2?.results) ? j2.results : Array.isArray(j2) ? j2 : []; } catch { /* ignore */ }
      }
    }

    let items = results.map((r: any) => ({ id: r?.id || r?._id, data: r?.data ?? r })).filter((x: any) => x.id);

    // Local CSV fallback to display templates even if CMS is empty/unavailable
    if (!items.length) {
      const file = path.join(process.cwd(), "server", "data", "templates.csv");
      if (fs.existsSync(file)) {
        const csv = fs.readFileSync(file, "utf8");
        const rows = parseCsv(csv);
        if (rows.length > 1) {
          const header = rows[0];
          const idx = (n: string) => header.findIndex(h => h.trim() === n);
          const iName = idx('template_name');
          const iUse = idx('use_case');
          const iDom = idx('domain_filter');
          const iSec = idx('sector_filter');
          const iFmt = idx('format_filter');
          const iAud = idx('audience_filter');
          const iSub = idx('email_subject');
          const iBody = idx('email_body');
          const iSpeech = idx('speech_text');
          const toArray = (v?: string) => (v || '').split(';').map(s => s.trim()).filter(Boolean);
          items = rows.slice(1).map(cols => ({
            id: `csv-${iName >= 0 ? cols[iName] : Math.random().toString(36).slice(2)}`,
            data: {
              template_name: iName >= 0 ? cols[iName] : '',
              use_case: iUse >= 0 ? cols[iUse] : '',
              domain_filter: toArray(iDom >= 0 ? cols[iDom] : ''),
              sector_filter: toArray(iSec >= 0 ? cols[iSec] : ''),
              format_filter: toArray(iFmt >= 0 ? cols[iFmt] : ''),
              audience_filter: toArray(iAud >= 0 ? cols[iAud] : ''),
              email_subject: iSub >= 0 ? cols[iSub] : '',
              email_body: iBody >= 0 ? decodeURIComponent(cols[iBody] || '') : '',
              speech_text: iSpeech >= 0 ? cols[iSpeech] : '',
            },
          })).filter(x => x.data.template_name);
        }
      }
    }

    return res.json({ items, total: json?.count ?? json?.total });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
};
