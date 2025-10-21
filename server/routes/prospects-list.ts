import type { RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";

const LOCAL_PROSPECTS_FILE = path.join(
  process.cwd(),
  "server",
  "data",
  "prospects-local.json",
);

async function loadLocalProspects() {
  try {
    const raw = await fs.readFile(LOCAL_PROSPECTS_FILE, "utf8");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      id: item?.id,
      data: item?.data,
      source: item?.source || "local",
    })) as any[];
  } catch {
    return [];
  }
}

export const listProspects: RequestHandler = async (req, res) => {
  try {
    const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    const limit = Math.min(parseInt(String(req.query.limit || 200), 10) || 200, 500);
    const warnings: string[] = [];

    let remoteItems: any[] = [];
    if (PRIVATE_KEY) {
      try {
        const url = new URL(`https://builder.io/api/v3/content/prospects`);
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("fields", "data,id");

        const resp = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${PRIVATE_KEY}`, Accept: "application/json" },
        });
        const txt = await resp.text();
        if (!resp.ok) {
          warnings.push("Builder CMS indisponible : " + txt.slice(0, 200));
        } else {
          const json = (() => {
            try {
              return JSON.parse(txt);
            } catch {
              return null;
            }
          })();
          const results = Array.isArray(json?.results)
            ? json.results
            : Array.isArray(json)
              ? json
              : [];
          remoteItems = results
            .map((r: any) => ({ id: r?.id || r?._id, data: r?.data ?? r, source: "builder" }))
            .filter((x: any) => x.id);
        }
      } catch (err: any) {
        warnings.push(err?.message || "Erreur Builder CMS");
      }
    } else {
      warnings.push("BUILDER_PRIVATE_KEY manquante : utilisation du stockage local");
    }

    const localItems = await loadLocalProspects();
    const merged = [...remoteItems, ...localItems];

    return res.json({
      items: merged,
      total: merged.length,
      warnings: warnings.length ? warnings : undefined,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
};
