import type { RequestHandler } from "express";

const PUBLIC_KEY = process.env.VITE_BUILDER_PUBLIC_KEY || process.env.BUILDER_PUBLIC_KEY; // try both
const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;

const ALL_SECTORS = [
  "Industrie",
  "Santé",
  "Retail/Luxe",
  "Transport",
  "BTP",
  "Tertiaire",
  "Public",
  "��ducation",
];

const formationsSeed = [
  {
    title: "Comprendre et gérer les situations de tension",
    domain: "E-learning",
    format: ["E-learning"],
    duration: "30 min",
    audiences: ["Tous publics", "Managers"],
    sectors: ["Tertiaire", "Retail/Luxe", "Santé"],
    objectives:
      "Identifier les signaux de tension, comprendre la montée émotionnelle, adopter une posture apaisante, agir avec assertivité.",
    keywords: ["tension", "émotions", "assertivité", "désescalade"],
  },
  {
    title: "Communication assertive et écoute active",
    domain: "E-learning",
    format: ["E-learning"],
    duration: "25–30 min",
    audiences: ["Tous publics", "Managers"],
    sectors: ALL_SECTORS,
    objectives:
      "Améliorer son écoute, formuler des messages clairs et respectueux, poser ses limites sans agressivité.",
    keywords: ["assertivité", "communication", "écoute"],
  },
  {
    title: "Accueil et posture professionnelle",
    domain: "E-learning",
    format: ["E-learning"],
    duration: "30–35 min",
    audiences: ["Accueil", "Front office", "Agents"],
    sectors: ["Tertiaire", "Retail/Luxe"],
    objectives:
      "Adopter une posture professionnelle, soigner la première impression, gérer les situations délicates, incarner les valeurs de son entreprise.",
    keywords: ["accueil", "posture", "professionnalisme"],
  },
  {
    title: "Management bienveillant et performance d’équipe",
    domain: "E-learning",
    format: ["E-learning"],
    duration: "40 min",
    audiences: ["Managers", "RH/HSE"],
    sectors: ALL_SECTORS,
    objectives:
      "Développer un management équilibré, alliant exigence et bienveillance, savoir donner du feedback constructif et gérer les émotions d’équipe.",
    keywords: ["management", "feedback", "bienveillance"],
  },
  {
    title: "Prévenir les incivilités et agressions verbales",
    domain: "E-learning",
    format: ["E-learning"],
    duration: "30 min",
    audiences: ["Accueil", "Agents", "Managers"],
    sectors: ["Retail/Luxe", "Santé", "Transport", "Tertiaire"],
    objectives:
      "Identifier les signes d’agressivité, adopter la bonne distance, désamorcer avec calme, protéger son intégrité.",
    keywords: ["incivilités", "agressions", "désescalade"],
  },
  {
    title: "Sensibilisation à la culture sûreté",
    domain: "E-learning",
    format: ["E-learning"],
    duration: "25–30 min",
    audiences: ["Tous publics"],
    sectors: ["Industrie", "Transport", "Public"],
    objectives:
      "Comprendre les risques de malveillance, repérer les comportements suspects, appliquer les réflexes de vigilance quotidienne.",
    keywords: ["sûreté", "vigilance", "sensibilisation"],
  },
  {
    title: "Gestion du stress et régulation émotionnelle",
    domain: "E-learning",
    format: ["E-learning"],
    duration: "35–40 min",
    audiences: ["Tous publics", "Managers"],
    sectors: ALL_SECTORS,
    objectives:
      "Identifier ses réactions face au stress, pratiquer des exercices simples de régulation, préserver sa concentration et sa sérénité au travail.",
    keywords: ["stress", "émotions", "concentration"],
  },
  {
    title: "Sensibilisation aux risques psychosociaux (RPS)",
    domain: "E-learning",
    format: ["E-learning"],
    duration: "30 min",
    audiences: ["Managers", "RH/HSE"],
    sectors: ["Tertiaire", "Santé", "Public"],
    objectives:
      "Comprendre les facteurs de risques, repérer les signaux faibles, favoriser un climat de travail sain.",
    keywords: ["RPS", "bien-être", "santé mentale"],
  },
  {
    title: "Leadership et exemplarité",
    domain: "E-learning",
    format: ["E-learning"],
    duration: "30 min",
    audiences: ["Managers", "Encadrants"],
    sectors: ALL_SECTORS,
    objectives:
      "Développer son impact managérial, incarner les valeurs FPSG, influencer positivement sans imposer.",
    keywords: ["leadership", "exemplarité", "influence"],
  },
  {
    title: "Sensibilisation à la diversité et au respect au travail",
    domain: "E-learning",
    format: ["E-learning"],
    duration: "25–30 min",
    audiences: ["Tous publics", "Managers"],
    sectors: ALL_SECTORS,
    objectives:
      "Comprendre les biais, favoriser l’inclusion, adopter un comportement respectueux au quotidien.",
    keywords: ["diversité", "inclusion", "respect"],
  },
];

export const seedFormations: RequestHandler = async (_req, res) => {
  try {
    if (!PRIVATE_KEY) return res.status(500).json({ error: "Missing BUILDER_PRIVATE_KEY" });

    const created: any[] = [];
    for (const f of formationsSeed) {
      const resp = await fetch("https://builder.io/api/v3/content/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${PRIVATE_KEY}` },
        body: JSON.stringify({
          name: f.title,
          data: f,
          published: true,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(JSON.stringify(json));
      created.push({ id: json?.id ?? json?._id ?? null, title: f.title });
    }

    return res.json({ ok: true, count: created.length, items: created });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Seed failed" });
  }
};
