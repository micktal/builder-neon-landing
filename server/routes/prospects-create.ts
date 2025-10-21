import type { RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const LOCAL_PROSPECTS_FILE = path.join(
  process.cwd(),
  "server",
  "data",
  "prospects-local.json",
);

async function saveProspectLocally(data: any) {
  await fs.mkdir(path.dirname(LOCAL_PROSPECTS_FILE), { recursive: true });
  let existing: any[] = [];
  try {
    const raw = await fs.readFile(LOCAL_PROSPECTS_FILE, "utf8");
    existing = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }
  const id = randomUUID();
  const payload = { ...(data || {}), _source: "local" };
  const record = {
    id,
    data: payload,
    createdAt: new Date().toISOString(),
    source: "local",
  };
  existing.push(record);
  await fs.writeFile(LOCAL_PROSPECTS_FILE, JSON.stringify(existing, null, 2), "utf8");
  return record;
}

export const createProspect: RequestHandler = async (req, res) => {
  try {
    const BUILDER_PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    const body = req.body ?? {};
    // Validate required
    if (typeof body.company_name === "string") {
      body.company_name = body.company_name.trim();
    }
    if (!body.company_name) {
      return res.status(400).json({ error: "Missing company name" });
    }

    if (!Array.isArray(body.contacts)) {
      body.contacts = [];
    } else {
      body.contacts = body.contacts
        .map((contact: any) => ({
          name: contact?.name || contact?.contact_name || "",
          role: contact?.role || "",
          email: contact?.email || "",
          phone: contact?.phone || "",
          linkedin: contact?.linkedin || "",
        }))
        .filter((c: any) =>
          Object.values(c).some((value) => value && String(value).trim().length > 0),
        );
    }

  let normalized: any = {
    ...body,
    priority_score: Number.isFinite(Number(body.priority_score))
      ? Number(body.priority_score)
      : 50,
    stage: body.stage || "Nouveau",
    createdAt: body.createdAt || new Date().toISOString(),
  };
  normalized._source = "builder";

  const builderPayload = {
    name: body.company_name,
    data: normalized,
    published: "published",
  };

  const resp = await fetch("https://builder.io/api/v3/content/prospects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${BUILDER_PRIVATE_KEY}`,
    },
    body: JSON.stringify(builderPayload),
  });

  const raw = await resp.text();
  let parsed: any = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!resp.ok || parsed?.error || parsed?.message) {
    let message = parsed?.error || parsed?.message || "";
    if (!message) {
      message = raw && !raw.startsWith("{") ? raw : "Builder error";
    }
    try {
      normalized = { ...normalized, _source: "local" };
      const fallback = await saveProspectLocally(normalized);
      return res.status(201).json({
        ok: true,
        id: fallback.id,
        data: normalized,
        source: fallback.source,
        warning: message,
        detail: parsed || raw,
      });
    } catch {
      return res
        .status(resp.status || 500)
        .json({ error: message, detail: parsed || raw });
    }
  }

  return res
    .status(201)
    .json({ ok: true, id: parsed?.id ?? parsed?._id ?? null, data: normalized, source: "builder" });
  } catch (e: any) {
    if (normalized) {
      try {
        normalized = { ...normalized, _source: "local" };
        const fallback = await saveProspectLocally(normalized);
        return res.status(201).json({
          ok: true,
          id: fallback.id,
          data: normalized,
          source: fallback.source,
          warning: e?.message || "Enregistré hors ligne",
        });
      } catch (err: any) {
        return res
          .status(500)
          .json({ error: e?.message || err?.message || "Unknown error" });
      }
    }
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
};
