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
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { cur.push(field.trim()); field = ""; }
      else if (ch === '\n') { cur.push(field.trim()); rows.push(cur); cur = []; field = ""; }
      else if (ch === '\r') { /* ignore */ }
      else { field += ch; }
    }
  }
  if (field.length || cur.length) { cur.push(field.trim()); rows.push(cur); }
  return rows.filter(r => r.length && r.some(c => c.length));
}

function toArray(v?: string): string[] { return (v || "").split(';').map(s => s.trim()).filter(Boolean); }

function safeParseJson(text: string) { try { return JSON.parse(text); } catch { return null; } }

async function upsertTemplate(privKey: string, payload: any) {
  const q = new URL("https://builder.io/api/v3/content/templates");
  q.searchParams.set("limit", "1");
  q.searchParams.set("query.name", payload.name);
  q.searchParams.set("fields", "id");
  const find = await fetch(q.toString(), { headers: { Authorization: `Bearer ${privKey}`, Accept: "application/json" } });
  const findText = await find.text();
  const found = find.ok ? safeParseJson(findText) : null;
  const existing = Array.isArray(found?.results) && found.results[0];
  if (existing?.id || existing?._id) {
    const id = existing.id || existing._id;
    const resp = await fetch(`https://builder.io/api/v3/content/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${privKey}`, Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const txt = await resp.text();
    if (!resp.ok) throw new Error(txt);
    return safeParseJson(txt) ?? { ok: true };
  } else {
    const resp = await fetch("https://builder.io/api/v3/content/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${privKey}`, Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const txt = await resp.text();
    if (!resp.ok) throw new Error(txt);
    return safeParseJson(txt) ?? { ok: true };
  }
}

export const importTemplates: RequestHandler = async (req, res) => {
  try {
    const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    if (!PRIVATE_KEY) return res.status(500).json({ error: "Missing BUILDER_PRIVATE_KEY" });

    let csv = typeof req.body?.csv === 'string' && req.body.csv.trim() ? req.body.csv : "";
    if (!csv) {
      const file = path.join(process.cwd(), "server", "data", "templates.csv");
      if (!fs.existsSync(file)) return res.status(400).json({ error: "No CSV provided" });
      csv = fs.readFileSync(file, "utf8");
    }

    const rows = parseCsv(csv);
    if (!rows.length) return res.status(400).json({ error: "CSV vide ou invalide" });
    const header = rows[0];
    const idx = (name: string) => header.findIndex(h => h.trim() === name);
    const iName = idx('template_name');
    const iUse = idx('use_case');
    const iDom = idx('domain_filter');
    const iSec = idx('sector_filter');
    const iFmt = idx('format_filter');
    const iAud = idx('audience_filter');
    const iSub = idx('email_subject');
    const iBody = idx('email_body');
    const iSpeech = idx('speech_text');

    const items = rows.slice(1).map(cols => {
      const name = cols[iName];
      if (!name) return null;
      const data = {
        template_name: name,
        use_case: cols[iUse],
        domain_filter: toArray(cols[iDom]),
        sector_filter: toArray(cols[iSec]),
        format_filter: toArray(cols[iFmt]),
        audience_filter: toArray(cols[iAud]),
        email_subject: cols[iSub],
        email_body: decodeURIComponent(cols[iBody] || ''),
        speech_text: cols[iSpeech] || '',
      };
      return { name, data, published: true };
    }).filter(Boolean) as any[];

    if (!items.length) return res.status(400).json({ error: 'CSV vide ou invalide' });

    const results: any[] = [];
    for (const payload of items) {
      const r = await upsertTemplate(PRIVATE_KEY, payload);
      results.push({ id: r?.id || r?._id || null, name: payload.name });
    }

    return res.json({ ok: true, count: results.length, items: results });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Import failed' });
  }
};
