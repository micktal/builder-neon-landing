import type { RequestHandler } from "express";

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function upsertTemplate(privKey: string, payload: any) {
  const q = new URL("https://builder.io/api/v3/content/templates");
  q.searchParams.set("limit", "1");
  q.searchParams.set("query.name", payload.name);
  q.searchParams.set("fields", "id");
  const find = await fetch(q.toString(), {
    headers: { Authorization: `Bearer ${privKey}`, Accept: "application/json" },
  });
  const findText = await find.text();
  const found = find.ok ? safeParseJson(findText) : null;
  const existing = Array.isArray(found?.results) && found.results[0];
  if (existing?.id || existing?._id) {
    const id = existing.id || existing._id;
    const resp = await fetch(`https://builder.io/api/v3/content/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${privKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const txt = await resp.text();
    if (!resp.ok) throw new Error(txt);
    return safeParseJson(txt) ?? { ok: true };
  } else {
    const resp = await fetch("https://builder.io/api/v3/content/templates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${privKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const txt = await resp.text();
    if (!resp.ok) throw new Error(txt);
    return safeParseJson(txt) ?? { ok: true };
  }
}

export const createTemplate: RequestHandler = async (req, res) => {
  try {
    const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    if (!PRIVATE_KEY)
      return res.status(500).json({ error: "Missing BUILDER_PRIVATE_KEY" });

    const {
      template_name,
      use_case = "Interne",
      domain_filter = [],
      sector_filter = [],
      format_filter = [],
      audience_filter = [],
      email_subject = "",
      email_body = "",
      speech_text = "",
    } = req.body || {};

    if (!template_name || (!email_body && !speech_text)) {
      return res
        .status(400)
        .json({
          error: "template_name et au moins email_body ou speech_text requis",
        });
    }

    const payload = {
      name: template_name,
      published: true,
      data: {
        template_name,
        use_case,
        domain_filter: Array.isArray(domain_filter) ? domain_filter : [],
        sector_filter: Array.isArray(sector_filter) ? sector_filter : [],
        format_filter: Array.isArray(format_filter) ? format_filter : [],
        audience_filter: Array.isArray(audience_filter) ? audience_filter : [],
        email_subject: String(email_subject || ""),
        email_body: String(email_body || ""),
        speech_text: String(speech_text || ""),
      },
    };

    const result = await upsertTemplate(PRIVATE_KEY, payload);
    return res.json({ ok: true, id: result?.id || result?._id || null });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Create template failed" });
  }
};
