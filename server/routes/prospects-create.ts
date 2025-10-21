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
        .filter((c: any) => Object.values(c).some((value) => value && String(value).trim().length > 0));
    }

    const resp = await fetch("https://builder.io/api/v3/content/prospects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BUILDER_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        data: body,
        published: "published",
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(500).json({ error: "Builder error", detail: txt });
    }
    const json = await resp.json();
    return res.json({ ok: true, id: json?.id ?? json?._id ?? null });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
};
