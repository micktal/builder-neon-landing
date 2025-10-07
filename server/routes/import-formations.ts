import type { RequestHandler } from "express";
import fs from "fs";
import path from "path";

const ALL_SECTORS = [
  "Industrie",
  "Santé",
  "Retail/Luxe",
  "Transport",
  "BTP",
  "Tertiaire",
  "Public",
  "Éducation",
];

function parseCsv(text: string): any[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  // Expect semicolon-separated; header guides positions
  const header = lines[0].split(";").map((h) => h.trim());
  // We only rely on index positions and aggregate extra columns as keywords
  const rows = lines.slice(1).map((line) => line.split(";").map((c) => c.trim()));
  const items: any[] = [];
  for (const cols of rows) {
    if (cols.length < 8) continue;
    const title = cols[0];
    const domain = cols[1];
    const format0 = cols[2];
    const duration = cols[3];
    const audience0 = cols[4];
    const sector0 = cols[5];
    const objectives = cols[6];
    const kw = cols.slice(7).filter(Boolean);

    const sectors = sector0 === "Tous secteurs" ? [...ALL_SECTORS] : [sector0];
    const audiences = audience0 ? [audience0] : [];
    const format = format0 ? [format0] : [];
    const keywords = kw;

    items.push({
      name: title,
      data: { title, domain, format, duration, audiences, sectors, objectives, keywords },
      published: true,
    });
  }
  return items;
}

async function upsertFormation(privKey: string, payload: any) {
  // Try find by name
  const q = new URL("https://builder.io/api/v3/content/formations");
  q.searchParams.set("limit", "1");
  q.searchParams.set("query.name", payload.name);
  q.searchParams.set("fields", "id");
  const find = await fetch(q.toString(), { headers: { Authorization: `Bearer ${privKey}` } });
  const found = find.ok ? await find.json() : null;
  const existing = Array.isArray(found?.results) && found.results[0];
  if (existing?.id || existing?._id) {
    const id = existing.id || existing._id;
    const resp = await fetch(`https://builder.io/api/v3/content/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${privKey}` },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Update failed: ${t}`);
    }
    return await resp.json();
  } else {
    const resp = await fetch("https://builder.io/api/v3/content/formations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${privKey}` },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Create failed: ${t}`);
    }
    return await resp.json();
  }
}

export const importFormations: RequestHandler = async (req, res) => {
  try {
    const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    if (!PRIVATE_KEY) return res.status(500).json({ error: "Missing BUILDER_PRIVATE_KEY" });

    // Accept JSON { csv: string } or load from file server/data/formations.csv
    let csv = "";
    if (typeof req.body?.csv === "string" && req.body.csv.trim().length > 0) {
      csv = req.body.csv as string;
    } else {
      const file = path.join(process.cwd(), "server", "data", "formations.csv");
      if (!fs.existsSync(file)) return res.status(400).json({ error: "No CSV provided" });
      csv = fs.readFileSync(file, "utf8");
    }

    const items = parseCsv(csv);
    if (!items.length) return res.status(400).json({ error: "CSV vide ou invalide" });

    const results: any[] = [];
    for (const payload of items) {
      const r = await upsertFormation(PRIVATE_KEY, payload);
      results.push({ id: r?.id || r?._id || null, name: payload.name });
    }

    return res.json({ ok: true, count: results.length, items: results });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Import failed" });
  }
};
