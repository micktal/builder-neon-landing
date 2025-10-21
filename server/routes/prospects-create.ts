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

  const builderPayload = {
    name: body.company_name,
    data: body,
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
    const message =
      parsed?.error ||
      parsed?.message ||
      (raw && raw.startsWith("{"))
        ? raw
        : raw || "Builder error";
    return res.status(resp.status || 500).json({ error: message });
  }

  return res.json({ ok: true, id: parsed?.id ?? parsed?._id ?? null });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
};
