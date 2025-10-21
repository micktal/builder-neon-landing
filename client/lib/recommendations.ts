import type { ReactNode } from "react";

export interface ProspectContact {
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
}

export interface ProspectLike {
  company_name: string;
  sector?: string;
  region?: string;
  size_band?: string;
  preferred_format?: string;
  training_history?: string;
  stage?: string;
  notes?: string;
  contacts?: ProspectContact[];
}

export interface FormationLike {
  title?: string;
  domain?: string;
  format?: string | string[];
  duration?: string;
  sectors?: string[];
  audiences?: string[];
  keywords?: string[];
}

export interface TemplateLike {
  template_name: string;
  use_case?: string;
  domain_filter?: string[];
  sector_filter?: string[];
  format_filter?: string[];
  audience_filter?: string[];
  email_subject?: string;
  email_body?: string;
  speech_text?: string;
}

export interface SellerProfile {
  name?: string;
  email?: string;
  phone?: string;
  signature?: ReactNode;
}

export interface ScriptRecommendation {
  template: TemplateLike;
  formation?: FormationLike;
  score: number;
  reasons: string[];
  placeholders: Record<string, string>;
  subjectPreview: string;
  emailBodyPreview: string;
  speechPreview: string;
}

interface ScoreResult<T> {
  item: T;
  score: number;
  reasons: string[];
}

interface ComputeContext {
  prospect: ProspectLike;
  formations: FormationLike[];
  templates: TemplateLike[];
  seller?: SellerProfile;
  contact?: ProspectContact | null;
  top?: number;
}

const STAGE_SYNONYMS: Record<string, string[]> = {
  decouverte: ["decouverte", "ouverture", "prise de contact", "initial"],
  relance: ["relance", "follow-up", "suivi"],
  suivi: ["suivi", "follow-up"],
  proposition: ["proposition", "offre"],
  audit: ["audit", "diagnostic"],
  crosssell: ["cross-sell", "cross", "upsell", "crossell"],
};

const DEFAULT_SUBJECT = "Proposition FPSG — {{company_name}}";

function normalizeToken(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function stringArray(value?: string | string[] | null): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v || ""))
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (!value) return [];
  return String(value)
    .split(/[;,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function hasIntersection(a: string[], b: string[]) {
  if (!a.length || !b.length) return false;
  const set = new Set(b.map((v) => normalizeToken(v)));
  return a.some((v) => set.has(normalizeToken(v)));
}

function includesToken(list: string[], needle?: string | null) {
  if (!needle) return false;
  const target = normalizeToken(needle);
  return list.map(normalizeToken).includes(target);
}

function decodeTrainingHistory(text?: string) {
  return normalizeToken(text || "");
}

function computeFormationScore(
  prospect: ProspectLike,
  formation: FormationLike,
): ScoreResult<FormationLike> {
  let score = 0;
  const reasons: string[] = [];

  const formationSectors = stringArray(formation.sectors);
  const formationFormats = stringArray(formation.format);
  const formationKeywords = stringArray(formation.keywords);
  const prospectSector = normalizeToken(prospect.sector);
  const preferredFormat = normalizeToken(prospect.preferred_format);
  const trainingHistory = decodeTrainingHistory(prospect.training_history);

  if (prospectSector && formationSectors.map(normalizeToken).includes(prospectSector)) {
    score += 40;
    reasons.push(`Formation alignée avec le secteur ${prospect.sector}`);
  }

  if (preferredFormat && formationFormats.map(normalizeToken).includes(preferredFormat)) {
    score += 20;
    reasons.push(`Format ${prospect.preferred_format} correspondant à la préférence prospect`);
  }

  const formationDomain = normalizeToken(formation.domain);
  if (formationDomain && trainingHistory.includes(formationDomain)) {
    score += 12;
    reasons.push("Historique du prospect lié à cette thématique");
  }

  if (
    formationKeywords.length > 0 &&
    trainingHistory &&
    formationKeywords.some((kw) => trainingHistory.includes(normalizeToken(kw)))
  ) {
    score += 8;
    reasons.push("Mots-clés formation présents dans les notes / historique");
  }

  if (!score && formationSectors.length === 0) {
    score += 5;
    reasons.push("Formation polyvalente utile en découverte");
  }

  return { item: formation, score, reasons };
}

function stageMatches(useCase?: string, stage?: string) {
  if (!useCase || !stage) return false;
  const useTokens = STAGE_SYNONYMS[normalizeToken(useCase)] || [normalizeToken(useCase)];
  const stageToken = normalizeToken(stage);
  if (useTokens.includes(stageToken)) return true;
  const stageVariants = STAGE_SYNONYMS[stageToken] || [stageToken];
  return stageVariants.some((variant) => useTokens.includes(variant));
}

function computeTemplateScore(
  prospect: ProspectLike,
  template: TemplateLike,
  formationMatches: ScoreResult<FormationLike>[],
  contact?: ProspectContact | null,
): { formation?: FormationLike; score: number; reasons: string[] } {
  const templateSectors = stringArray(template.sector_filter);
  const templateDomains = stringArray(template.domain_filter);
  const templateFormats = stringArray(template.format_filter);
  const templateAudiences = stringArray(template.audience_filter);
  const stage = prospect.stage;
  const contactRole = normalizeToken(contact?.role);
  const sectorToken = normalizeToken(prospect.sector);
  const preferredFormat = normalizeToken(prospect.preferred_format);

  let bestScore = 0;
  let bestReasons: string[] = [];
  let bestFormation: FormationLike | undefined;

  const candidates = formationMatches.length ? formationMatches : [{ item: undefined, score: 0, reasons: [] } as ScoreResult<FormationLike>];

  for (const candidate of candidates) {
    const formation = candidate.item;
    const reasons: string[] = [];
    let score = 0;

    if (stageMatches(template.use_case, stage)) {
      score += 18;
      reasons.push(`Use case adapté au stade ${stage}`);
    }

    if (sectorToken && includesToken(templateSectors, prospect.sector)) {
      score += 35;
      reasons.push(`Script prévu pour le secteur ${prospect.sector}`);
    }

    if (contactRole && templateAudiences.length) {
      if (templateAudiences.map(normalizeToken).includes(contactRole)) {
        score += 10;
        reasons.push("Audience du script conforme au contact ciblé");
      }
    }

    const formationDomain = normalizeToken(formation?.domain);
    if (templateDomains.length && formationDomain) {
      if (includesToken(templateDomains, formation?.domain)) {
        score += 22;
        reasons.push("Domaine formation aligné avec le script");
      }
    } else if (templateDomains.length && sectorToken) {
      if (templateDomains.map(normalizeToken).includes(sectorToken)) {
        score += 15;
        reasons.push("Domaine script correspondant au secteur prospect");
      }
    }

    const formationFormats = stringArray(formation?.format);
    if (templateFormats.length) {
      if (
        preferredFormat && templateFormats.map(normalizeToken).includes(preferredFormat)
      ) {
        score += 14;
        reasons.push("Format script cohérent avec la préférence prospect");
      } else if (
        formationFormats.length &&
        hasIntersection(templateFormats.map(normalizeToken), formationFormats.map(normalizeToken))
      ) {
        score += 14;
        reasons.push("Format du script aligné avec la formation proposée");
      }
    }

    if (candidate.score) {
      score += Math.round(candidate.score * 0.5);
      if (candidate.reasons.length) {
        reasons.push(...candidate.reasons.map((r) => `Formation : ${r}`));
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestReasons = reasons;
      bestFormation = formation;
    }
  }

  return { formation: bestFormation, score: bestScore, reasons: bestReasons };
}

function buildPlaceholders(
  prospect: ProspectLike,
  formation?: FormationLike,
  contact?: ProspectContact | null,
  seller?: SellerProfile,
) {
  const formatList = stringArray(formation?.format);
  const resolvedFormat = formatList.length
    ? formatList.join(", ")
    : prospect.preferred_format || "";
  return {
    company_name: prospect.company_name || "",
    sector: prospect.sector || "",
    region: prospect.region || "",
    contact_name: contact?.name || "",
    contact_role: contact?.role || "",
    formation_title: formation?.title || "",
    duration: formation?.duration || "",
    format: resolvedFormat,
    domain: formation?.domain || "",
    your_name: seller?.name || "",
    your_email: seller?.email || "",
    your_phone: seller?.phone || "",
  };
}

function applyPlaceholders(text: string | undefined, vars: Record<string, string>) {
  return Object.entries(vars).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{${key}}}`, value || "");
  }, String(text ?? ""));
}

export function computeScriptRecommendations({
  prospect,
  formations,
  templates,
  seller,
  contact,
  top = 3,
}: ComputeContext): ScriptRecommendation[] {
  if (!prospect || !templates?.length) return [];
  const contact0 = contact ?? (Array.isArray(prospect.contacts) ? prospect.contacts[0] ?? null : null);

  const formationScores = formations.map((formation) =>
    computeFormationScore(prospect, formation),
  );

  const templateScores = templates
    .map((template) => {
      const { formation, score, reasons } = computeTemplateScore(
        prospect,
        template,
        formationScores,
        contact0 ?? undefined,
      );
      return { template, formation, score, reasons };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, top);

  return templateScores.map(({ template, formation, score, reasons }) => {
    const vars = buildPlaceholders(prospect, formation, contact0, seller);
    const subjectBase = template.email_subject || DEFAULT_SUBJECT;
    return {
      template,
      formation,
      score,
      reasons,
      placeholders: vars,
      subjectPreview: applyPlaceholders(subjectBase, vars),
      emailBodyPreview: applyPlaceholders(template.email_body || "", vars),
      speechPreview: applyPlaceholders(template.speech_text || "", vars),
    };
  });
}
