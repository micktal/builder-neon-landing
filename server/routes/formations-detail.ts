import type { RequestHandler } from "express";

export const getFormation: RequestHandler = async (req, res) => {
  try {
    const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    if (!PRIVATE_KEY) return res.status(500).json({ error: "Missing BUILDER_PRIVATE_KEY" });
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ error: "Missing id" });

    const url = new URL(`https://builder.io/api/v3/content/formations`);
    url.searchParams.set("limit", "1");
    url.searchParams.set("query.id", id);
    url.searchParams.set("fields", "data,id");

    const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${PRIVATE_KEY}` } });
    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(500).json({ error: "Builder error", detail: txt });
    }
    const json = await resp.json();
    const r = Array.isArray(json?.results) && json.results[0];
    if (!r) return res.status(404).json({ error: "Not found" });
    return res.json({ id: r?.id || r?._id, data: r?.data ?? r });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
};
