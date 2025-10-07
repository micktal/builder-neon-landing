import type { RequestHandler } from "express";

export const listFormations: RequestHandler = async (req, res) => {
  try {
    const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    if (!PRIVATE_KEY) return res.status(500).json({ error: "Missing BUILDER_PRIVATE_KEY" });

    const limit = Math.min(parseInt(String(req.query.limit || 200), 10) || 200, 500);
    const url = new URL(`https://builder.io/api/v3/content/formations`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("fields", "data,id");

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${PRIVATE_KEY}` },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(500).json({ error: "Builder error", detail: txt });
    }

    const json = await resp.json();
    const results = Array.isArray(json?.results) ? json.results : [];
    const items = results
      .map((r: any) => ({ id: r?.id || r?._id, data: r?.data ?? r }))
      .filter((x: any) => x.id);
    return res.json({ items, total: json?.count ?? json?.total });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
};
