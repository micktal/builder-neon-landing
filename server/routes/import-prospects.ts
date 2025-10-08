import type { RequestHandler } from "express";
import fs from "fs";
import path from "path";

function parseCsvSemicolon(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ";") {
        cur.push(field.trim());
        field = "";
      } else if (ch === "\n") {
        cur.push(field.trim());
        rows.push(cur);
        cur = [];
        field = "";
      } else if (ch === "\r") {
        /* ignore */
      } else {
        field += ch;
      }
    }
  }
  if (field.length || cur.length) {
    cur.push(field.trim());
    rows.push(cur);
  }
  return rows.filter((r) => r.length && r.some((c) => c.length));
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseContacts(
  cell?: string,
): { name?: string; email?: string; role?: string; phone?: string }[] {
  const raw = (cell || "").trim();
  if (!raw) return [];
  // Remove wrapping quotes if present and unescape doubled quotes
  const unwrapped =
    raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
  const normalized = unwrapped.replace(/""/g, '"');
  const json = safeParseJson(normalized);
  if (Array.isArray(json)) {
    return json.map((c: any) => ({
      name: c?.name || c?.contact_name || "",
      email: c?.email || "",
      role: c?.role || "",
      phone: c?.phone || "",
    }));
  }
  return [];
}

async function upsertProspect(privKey: string, data: any) {
  const q = new URL("https://builder.io/api/v3/content/prospects");
  q.searchParams.set("limit", "1");
  q.searchParams.set("fields", "id");
  if (data.company_name)
    q.searchParams.set("query.data.company_name", data.company_name);
  if (data.region) q.searchParams.set("query.data.region", data.region);
  const find = await fetch(q.toString(), {
    headers: { Authorization: `Bearer ${privKey}`, Accept: "application/json" },
  });
  const findTxt = await find.text();
  const found = find.ok ? safeParseJson(findTxt) : null;
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
      body: JSON.stringify({ data, published: "published" }),
    });
    const txt = await resp.text();
    if (!resp.ok) throw new Error(`Update failed: ${txt}`);
    const json = safeParseJson(txt) ?? { ok: true };
    return { ...(json || {}), id: json?.id || json?._id, action: "updated" };
  } else {
    const resp = await fetch("https://builder.io/api/v3/content/prospects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${privKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify({ data, published: "published" }),
    });
    const txt = await resp.text();
    if (!resp.ok) throw new Error(`Create failed: ${txt}`);
    const json = safeParseJson(txt) ?? { ok: true };
    return { ...(json || {}), id: json?.id || json?._id, action: "created" };
  }
}

export const importProspects: RequestHandler = async (req, res) => {
  try {
    const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    if (!PRIVATE_KEY)
      return res.status(500).json({ error: "Missing BUILDER_PRIVATE_KEY" });

    if (req.method === "GET") {
      const host = `${req.protocol}://${req.get("host")}`;
      return res.json({
        ok: true,
        model: "prospects",
        required_headers: [
          "company_name",
          "sector",
          "region",
          "size_band",
          "preferred_format",
          "priority_score",
          "contacts",
          "stage",
          "notes",
          "createdAt",
        ],
        upsert_key: ["company_name", "region"],
        example_curl: `curl -X POST ${host}/api/import/prospects -H "Content-Type: text/plain; charset=utf-8" --data-binary @prospects.csv`,
      });
    }

    let csv = "";
    const ctype = String(req.headers["content-type"] || "");
    if (
      typeof (req as any).body === "string" &&
      /text\/(plain|csv)|octet-stream/.test(ctype)
    ) {
      csv = (req as any).body as string;
    } else if (
      typeof (req as any).body?.csv === "string" &&
      (req as any).body.csv.trim()
    ) {
      csv = (req as any).body.csv as string;
    } else {
      const file = path.join(process.cwd(), "server", "data", "prospects.csv");
      if (!fs.existsSync(file))
        return res.status(400).json({ error: "No CSV provided" });
      csv = fs.readFileSync(file, "utf8");
    }

    const rows = parseCsvSemicolon(csv);
    if (!rows.length)
      return res.status(400).json({ error: "CSV vide ou invalide" });

    const header = rows[0].map((h) => h.trim());
    const required = [
      "company_name",
      "sector",
      "region",
      "size_band",
      "preferred_format",
      "priority_score",
      "contacts",
      "stage",
      "notes",
      "createdAt",
    ];
    const missing = required.filter((h) => !header.includes(h));
    if (missing.length)
      return res
        .status(400)
        .json({ error: `En-têtes manquants: ${missing.join(", ")}` });

    const idx = (name: string) => header.findIndex((h) => h === name);
    const iCompany = idx("company_name");
    const iSector = idx("sector");
    const iRegion = idx("region");
    const iSize = idx("size_band");
    const iFmt = idx("preferred_format");
    const iScore = idx("priority_score");
    const iContacts = idx("contacts");
    const iStage = idx("stage");
    const iNotes = idx("notes");
    const iCreated = idx("createdAt");

    const items = rows
      .slice(1)
      .map((cols) => {
        const company_name = cols[iCompany];
        if (!company_name) return null;
        const contacts = parseContacts(cols[iContacts]);
        const priority_score = Number(cols[iScore]);
        const createdAt =
          cols[iCreated] && !isNaN(Date.parse(cols[iCreated]))
            ? new Date(cols[iCreated]).toISOString()
            : new Date().toISOString();
        const data: any = {
          company_name,
          sector: cols[iSector] || "",
          region: cols[iRegion] || "",
          size_band: cols[iSize] || "",
          preferred_format: cols[iFmt] || "",
          priority_score: isFinite(priority_score) ? priority_score : 0,
          contacts,
          stage: cols[iStage] || "Nouveau",
          notes: cols[iNotes] || "",
          createdAt,
        };
        return data;
      })
      .filter(Boolean) as any[];

    if (!items.length)
      return res.status(400).json({ error: "CSV vide ou invalide" });

    const results: any[] = [];
    let created = 0,
      updated = 0;
    for (const data of items) {
      const r = await upsertProspect(PRIVATE_KEY, data);
      if (r?.action === "created") created++;
      else if (r?.action === "updated") updated++;
      results.push({
        id: r?.id || r?._id || null,
        company_name: data.company_name,
        action: r?.action,
      });
    }

    return res.json({
      ok: true,
      created,
      updated,
      errors_count: 0,
      items: results,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Import failed" });
  }
};
