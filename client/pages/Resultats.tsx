import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  Building2,
  FileText,
  ExternalLink,
  Mail,
  Download,
  Home,
  Search as SearchIcon,
  LayoutTemplate,
} from "lucide-react";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

import { fetchBuilderContent } from "@/services/builder";

// Demo datasets for a functional UI; replace with real content models when available.
const DEMO_FORMATIONS = [
  {
    title: "Gestion de conflit en magasin",
    domain: "Gestion de conflit",
    format: "Présentiel",
    duration: "1 jour (7h)",
    audiences: ["Agents", "Managers"],
    sectors: ["Retail/Luxe", "Tertiaire"],
    objectives:
      "Identifier les signaux de tension et adopter des techniques de désescalade.",
    pdf_brochure: "https://example.com/brochure-conflit.pdf",
    teaser_url: "https://example.com/teaser-conflit",
  },
  {
    title: "Prévention HSE — bases essentielles",
    domain: "Prévention HSE",
    format: "Distanciel",
    duration: "2 x 3h visio",
    audiences: ["RH/HSE", "Managers"],
    sectors: ["Industrie", "BTP"],
    objectives:
      "Sensibiliser aux risques HSE et mettre en place des plans d'action concrets.",
    pdf_brochure: "https://example.com/hse.pdf",
    teaser_url: "https://example.com/teaser-hse",
  },
  {
    title: "Secourisme — SST initial",
    domain: "Secourisme",
    format: "Présentiel",
    duration: "2 jours",
    audiences: ["Agents", "Logistique"],
    sectors: ["Industrie", "Transport"],
    objectives:
      "Maîtriser les gestes qui sauvent et la conduite à tenir en cas d'accident.",
    pdf_brochure: "https://example.com/sst.pdf",
    teaser_url: "https://example.com/teaser-sst",
  },
  {
    title: "Management de la sécurité",
    domain: "Management",
    format: "Blended",
    duration: "1 jour + e-learning",
    audiences: ["Managers"],
    sectors: ["Tertiaire", "Public"],
    objectives: "Structurer une démarche sécurité au sein des équipes.",
    pdf_brochure: "https://example.com/mgmt.pdf",
    teaser_url: "https://example.com/teaser-mgmt",
  },
] as const;

const DEMO_PROSPECTS = [
  {
    id: "p1",
    company_name: "ACME Santé",
    sector: "Santé",
    size_band: "500-1000",
    region: "IDF",
    contacts: [
      {
        name: "Claire Dupont",
        role: "DRH",
        email: "claire.dupont@example.com",
        phone: "+33 1 23 45 67 89",
      },
    ],
    training_history: "Sensibilisation HSE 2022",
    priority_score: 78,
    notes: "Projet d'ouverture d'un nouveau site Q4.",
  },
  {
    id: "p2",
    company_name: "NovaBank",
    sector: "Tertiaire",
    size_band: "1000+",
    region: "ARA",
    contacts: [
      {
        name: "Marc Leroy",
        role: "Sécurité",
        email: "marc.leroy@example.com",
        phone: "+33 4 11 22 33 44",
      },
    ],
    training_history: "Gestion de conflit agences 2023",
    priority_score: 65,
    notes: "Besoin récurrent suite incidents clients.",
  },
  {
    id: "p3",
    company_name: "Luxo Retail",
    sector: "Retail/Luxe",
    size_band: "200-500",
    region: "IDF",
    contacts: [
      {
        name: "Sarah Martin",
        role: "Retail Manager",
        email: "s.martin@example.com",
        phone: "+33 6 22 33 44 55",
      },
    ],
    training_history: "—",
    priority_score: 84,
    notes: "Taux de démarque élevé en 2024.",
  },
] as const;

const DEMO_TEMPLATES = [
  {
    template_name: "Découverte retail",
    use_case: "Découverte",
    domain_filter: ["Gestion de conflit", "Sûreté"],
    sector_filter: ["Retail/Luxe"],
    format_filter: ["Présentiel", "Blended"],
    audience_filter: ["Agents", "Managers"],
    email_subject: "Découverte — {{formation_title}}",
    email_body:
      "Bonjour {{contact_name}},\nNous aidons des enseignes retail sur {{formation_title}} ({{format}}).\nSeriez-vous disponible pour un échange ?\nCordialement, {{your_name}}",
    speech_text:
      "Bonjour {{contact_name}}, je suis {{your_name}} (FPSG). Sur des contextes retail, nous intervenons sur {{formation_title}}…",
  },
  {
    template_name: "Relance audit HSE",
    use_case: "Audit",
    domain_filter: ["Prévention HSE"],
    sector_filter: ["Industrie", "BTP"],
    format_filter: ["Distanciel", "Présentiel"],
    audience_filter: ["RH/HSE", "Managers"],
    email_subject: "Audit HSE — disponibilité",
    email_body:
      "Bonjour {{contact_name}},\nSuite à nos échanges, je vous propose un audit HSE.\nQuelles sont vos disponibilités ?\nCordialement, {{your_name}}",
    speech_text: "Nous proposons un audit HSE court pour cadrer vos priorités…",
  },
] as const;

export default function Resultats() {
  const q = useQuery();
  const nav = useNavigate();
  const { toast } = useToast();

  const domain = q.get("domain") || "";
  const audiences = (q.get("audiences") || "").split(",").filter(Boolean);
  const sectors = (q.get("sectors") || "").split(",").filter(Boolean);
  const region = q.get("region") || "";
  const format = q.get("format") || "";
  const useCase = q.get("useCase") || "";

  const summaryMini = [domain, format, useCase].filter(Boolean).join(" / ");

  const [fData, setFData] = useState<any[]>([]);
  const [pData, setPData] = useState<any[]>([]);
  const [tData, setTData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ items: f }, { items: p }, { items: t }] = await Promise.all([
        fetchBuilderContent<any>("formations", { limit: 200, cacheBust: true }),
        fetchBuilderContent<any>("prospects", { limit: 200, cacheBust: true }),
        fetchBuilderContent<any>("templates", { limit: 200, cacheBust: true }),
      ]);
      setFData(f);
      setPData(p);
      setTData(t);
    })();
  }, []);

  const formations = useMemo(() => {
    const src = fData.length ? fData : DEMO_FORMATIONS;
    return src.filter(
      (f: any) =>
        (!domain ||
          String(f.domain).toLowerCase().includes(domain.toLowerCase())) &&
        (!format ||
          String(Array.isArray(f.format) ? f.format.join(" ") : f.format)
            .toLowerCase()
            .includes(format.toLowerCase())) &&
        (sectors.length === 0 ||
          sectors.some((s) =>
            (Array.isArray(f.sectors) ? f.sectors : [])
              .map((x: string) => x.toLowerCase())
              .includes(s.toLowerCase()),
          )),
    );
  }, [domain, format, sectors, fData]);

  const prospects = useMemo(() => {
    const src = pData.length ? pData : (DEMO_PROSPECTS as any[]);
    return src.filter(
      (p: any) =>
        (sectors.length === 0 ||
          sectors.some(
            (s) => String(p.sector).toLowerCase() === s.toLowerCase(),
          )) &&
        (!region || String(p.region).toLowerCase() === region.toLowerCase()),
    );
  }, [sectors, region, pData]);

  const templates = useMemo(() => {
    const src = tData.length ? tData : (DEMO_TEMPLATES as any[]);
    return src.filter(
      (t: any) =>
        (!domain ||
          (Array.isArray(t.domain_filter) ? t.domain_filter : [])
            .map((x: string) => x.toLowerCase())
            .includes(domain.toLowerCase())) &&
        (!useCase ||
          String(t.use_case).toLowerCase().includes(useCase.toLowerCase())) &&
        (!format ||
          (Array.isArray(t.format_filter) ? t.format_filter : [])
            .map((x: string) => x.toLowerCase())
            .includes(format.toLowerCase())),
    );
  }, [domain, useCase, format, tData]);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copié` });
    } catch {
      toast({ title: "Échec de la copie" });
    }
  };

  const encode = (s: string) => encodeURIComponent(s ?? "");

  const emptyAll =
    formations.length === 0 && prospects.length === 0 && templates.length === 0;

  return (
    <div className="container max-w-[1200px] px-4 sm:px-6 pb-28 sm:pb-12">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="container max-w-[1200px] px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] sm:text-[24px] font-bold text-slate-900">
              Résultats de recherche
            </h1>
            <div className="text-xs sm:text-sm text-slate-600">
              {summaryMini || "Filtres"}
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <Link
              to="/nouvelle-recherche"
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Modifier la recherche
            </Link>
            <button
              onClick={() => toast({ title: "Export CSV à venir" })}
              className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm"
            >
              Exporter résultats CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary block */}
      <section className="mt-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Votre recherche
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <Chip label="Domaine" value={domain} />
            <Chip label="Audiences" value={audiences.join(", ")} />
            <Chip label="Secteurs" value={sectors.join(", ")} />
            <Chip label="Région" value={region} />
            <Chip label="Format" value={format} />
            <Chip label="Objectif" value={useCase} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:hidden">
            <Link
              to="/nouvelle-recherche"
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Modifier la recherche
            </Link>
            <button
              onClick={() => toast({ title: "Export CSV à venir" })}
              className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm"
            >
              Exporter résultats CSV
            </button>
          </div>
        </div>
      </section>

      {/* Empty state */}
      {emptyAll && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-center text-slate-700">
          Aucune donnée trouvée — ajoutez vos formations et prospects depuis le
          Dashboard.
          <div className="mt-3">
            <Link
              to="/dashboard"
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm"
            >
              Retour au Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Results */}
      {formations.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-slate-900">
              Formations correspondantes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {formations.map((f, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow transition"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {f.title}
                  </h3>
                  <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[11px]">
                    {f.domain}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {f.duration} • {f.format}
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  Publics: {f.audiences.join(", ")}
                </div>
                <div className="mt-1 text-sm text-slate-600 line-clamp-2">
                  {f.objectives}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={f.pdf_brochure}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <ExternalLink className="h-4 w-4" /> Voir plaquette PDF
                  </a>
                  <button
                    onClick={() => copy("Lien teaser", f.teaser_url)}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <LinkIcon /> Copier lien teaser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {prospects.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-slate-900">
              Prospects à contacter
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prospects.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow transition"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {p.company_name}
                </div>
                <div className="text-xs text-slate-600">
                  {p.sector} • {p.size_band} • {p.region}
                </div>
                <div className="mt-2 text-sm">
                  {p.contacts.length > 0 && (
                    <div className="text-slate-700">
                      {p.contacts[0].name} — {p.contacts[0].role} •{" "}
                      {p.contacts[0].email}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-slate-600 line-clamp-2">
                  {p.notes || p.training_history}
                </div>
                <div className="mt-3">
                  <div className="h-2 rounded bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${p.priority_score}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Priorité: {p.priority_score}/100
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.contacts[0]?.email && (
                    <button
                      onClick={() => copy("E-mail", p.contacts[0].email)}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <Mail className="h-4 w-4" /> Copier e-mail contact
                    </button>
                  )}
                  <Link
                    to={`/prospects?id=${p.id}`}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Ouvrir fiche
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {templates.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-slate-900">
              Messages et speechs recommandés
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow transition"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">
                    {t.template_name}
                  </div>
                  <span className="rounded-full bg-gray-100 text-slate-700 border border-gray-200 px-2 py-0.5 text-[11px]">
                    {t.use_case}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-2 text-sm text-slate-800 whitespace-pre-wrap">
                    {t.speech_text}
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-2 text-sm text-slate-800">
                    <div className="text-xs text-slate-600">
                      Subject: {t.email_subject}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap">
                      {t.email_body}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => copy("Speech", t.speech_text)}
                    className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Copier Speech
                  </button>
                  <button
                    onClick={() => copy("E-mail", t.email_body)}
                    className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Copier E-mail
                  </button>
                  <a
                    href={`mailto:?subject=${encode(t.email_subject)}&body=${encode(t.email_body)}`}
                    className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm"
                  >
                    Ouvrir dans Outlook
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Actions & shortcuts */}
      <section className="mt-10 mb-16 sm:mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm flex flex-wrap items-center gap-2">
          <Link
            to="/nouvelle-recherche"
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm"
          >
            Nouvelle recherche
          </Link>
          <Link
            to={`/prospects/new?sector=${encode(sectors[0] || "")}&region=${encode(region)}&domain=${encode(domain)}`}
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Créer un prospect à partir de ces filtres
          </Link>
          <button
            onClick={() => toast({ title: "Téléchargement à venir" })}
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Télécharger tous les speechs
          </button>
        </div>
      </section>

      {/* Mobile sticky nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1200px] grid grid-cols-3">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 py-2 text-sm hover:bg-gray-50"
          >
            <Home className="h-4 w-4" /> Dashboard
          </Link>
          <Link
            to="/nouvelle-recherche"
            className="flex items-center justify-center gap-2 py-2 text-sm hover:bg-gray-50"
          >
            <SearchIcon className="h-4 w-4" /> Recherche
          </Link>
          <Link
            to="/templates"
            className="flex items-center justify-center gap-2 py-2 text-sm hover:bg-gray-50"
          >
            <LayoutTemplate className="h-4 w-4" /> Templates
          </Link>
        </div>
      </nav>
    </div>
  );
}

function Chip({ label, value }: { label: string; value?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-slate-700">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {label}: <strong className="font-semibold">{value || "—"}</strong>
    </span>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
