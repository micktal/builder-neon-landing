import type { RequestHandler } from "express";

import fs from "fs";
import path from "path";

export const listFormations: RequestHandler = async (req, res) => {
  try {
    const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    if (!PRIVATE_KEY) return res.status(500).json({ error: "Missing BUILDER_PRIVATE_KEY" });

    const limit = Math.min(parseInt(String(req.query.limit || 200), 10) || 200, 500);
    const url = new URL(`https://builder.io/api/v3/content/formations`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("fields", "data,id");

    const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${PRIVATE_KEY}`, Accept: "application/json" } });
    const txt = await resp.text();
    const ok = resp.ok;

    let items: any[] = [];
    if (ok) {
      const json = (() => { try { return JSON.parse(txt); } catch { return null; } })();
      const results = Array.isArray(json?.results) ? json.results : Array.isArray(json) ? json : [];
      items = results.map((r: any) => ({ id: r?.id || r?._id, data: r?.data ?? r })).filter((x: any) => x.id);
    }

    // Fallback: local CSV if CMS empty or request failed
    if (!ok || !items.length) {
      const file = path.join(process.cwd(), "server", "data", "formations.csv");
      if (fs.existsSync(file)) {
        const csv = fs.readFileSync(file, "utf8");
        const lines = csv.split(/\r?\n/).filter(l => l.trim());
        if (lines.length > 1) {
          const header = lines[0].split(";").map(h => h.trim());
          const idx = (n: string) => header.findIndex(h => h === n);
          const iTitle = idx('title');
          const iDomain = idx('domain');
          const iFormat = idx('format');
          const iDuration = idx('duration');
          const iAud = idx('audiences');
          const iSec = idx('sectors');
          const iObj = idx('objectives');
          const iKw = idx('keywords');
          const toArr = (v?: string) => (v || '').split(';').map(s => s.trim()).filter(Boolean);
          items = lines.slice(1).map(line => {
            const cols = line.split(';');
            return {
              id: `csv-${cols[iTitle]}`,
              data: {
                title: cols[iTitle],
                domain: cols[iDomain],
                format: toArr(cols[iFormat]),
                duration: cols[iDuration],
                audiences: toArr(cols[iAud]),
                sectors: toArr(cols[iSec]),
                objectives: cols[iObj],
                keywords: toArr(cols[iKw]),
              }
            };
          }).filter(x => x.data.title);
        }
      }
    }

    return res.json({ items, total: items.length });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
};
