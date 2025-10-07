import type { RequestHandler } from "express";

export const aiCommercial: RequestHandler = async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    const { mode, prospect, formation, templates, prompt } = req.body || {};

    const systemPrompt = `Tu es un assistant commercial FPSG (Fiducial Prévention Sûreté Gestion). Ta mission : aider un commercial à adapter son discours en fonction du prospect, du secteur et des formations disponibles. Utilise un ton professionnel, bienveillant et structuré.`;

    const userPrompt = (() => {
      switch (mode) {
        case "analyze":
          return `Analyse le prospect suivant : ${JSON.stringify(prospect || {}, null, 2)}. Identifie ses besoins potentiels, son contexte, et propose un angle d'approche FPSG.`;
        case "suggest_template":
          return `Voici la liste des templates FPSG : ${(Array.isArray(templates)?templates:[]).map((t:any)=>t.template_name||t?.data?.template_name).filter(Boolean).join(", ")}. Propose les 3 plus pertinents pour le prospect : ${(prospect?.company_name)||"?"} (${prospect?.sector||"—"}, ${prospect?.region||"—"}). Justifie ton choix.`;
        case "write_email":
          return `Rédige un e-mail commercial concis pour ${(prospect?.company_name)||"un prospect"} (${prospect?.sector||"—"}), en lien avec la formation ${(formation?.title)||"FPSG adaptée à son besoin"}. Contexte additionnel : ${prompt||""}.`;
        case "summarize":
          return `Résume et reformule les notes d'entretien suivantes : ${prospect?.notes || "aucune note"}. Produis un compte rendu synthétique à coller dans le CRM.`;
        default:
          return String(prompt || "Aide-moi à formuler une proposition commerciale FPSG.");
      }
    })();

    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const txt = await resp.text();
    if (!resp.ok) {
      return res.status(500).json({ error: "OpenAI error", detail: txt });
    }
    let json: any = null;
    try { json = JSON.parse(txt); } catch {}
    const output = json?.choices?.[0]?.message?.content || txt;
    return res.json({ result: output });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "AI error" });
  }
};
