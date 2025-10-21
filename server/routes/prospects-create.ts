import type { RequestHandler } from "express";

export const createProspect: RequestHandler = async (req, res) => {
  try {
    const BUILDER_PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
    if (!BUILDER_PRIVATE_KEY) {
      return res.status(500).json({ error: "Missing BUILDER_PRIVATE_KEY" });
    }
    const body = req.body ?? {};
    // Validate required
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

  const normalized = {
    ...body,
    priority_score: Number.isFinite(Number(body.priority_score))
      ? Number(body.priority_score)
      : 50,
    stage: body.stage || "Nouveau",
    createdAt: body.createdAt || new Date().toISOString(),
  };

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
    return res.status(resp.status || 500).json({ error: message, detail: parsed || raw });
  }

  return res
    .status(201)
    .json({ ok: true, id: parsed?.id ?? parsed?._id ?? null, data: normalized });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
};
