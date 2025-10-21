import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import CommercialAIAssistant from "@/components/shared/CommercialAIAssistant";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Mail } from "lucide-react";
import { fetchBuilderItem } from "@/services/builder";
import GeneratePDFModal from "@/components/shared/GeneratePDFModal";
import ComposeEmailModal from "@/components/shared/ComposeEmailModal";
import RecommendedScripts from "@/components/prospects/RecommendedScripts";
import {
  computeScriptRecommendations,
  type ScriptRecommendation,
} from "@/lib/recommendations";

interface Contact {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
}
interface Prospect {
  company_name: string;
  entity_type?: string;
  sector?: string;
  size_band?: string;
  region?: string;
  sites_count?: number;
  contacts?: Contact[];
  training_history?: string;
  budget_hint?: string;
  priority_score?: number;
  preferred_format?: string;
  notes?: string;
}

interface Template {
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

interface Formation {
  title?: string;
  domain?: string;
  format?: string | string[];
  duration?: string;
  sectors?: string[];
  audiences?: string[];
  keywords?: string[];
}

export default function ProspectDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [openPDF, setOpenPDF] = useState(false);
  const [openCompose, setOpenCompose] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<ScriptRecommendation | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const p = await fetchBuilderItem<Prospect>("prospects", id);
      setProspect(p);
      const [tRes, fRes] = await Promise.all([
        fetch("/api/templates?limit=200").then((r) => r.json()).catch(() => ({ items: [] })),
        fetch("/api/formations?limit=200").then((r) => r.json()).catch(() => ({ items: [] })),
      ]);
      setTemplates(
        Array.isArray(tRes?.items) ? tRes.items.map((x: any) => x.data) : [],
      );
      setFormations(
        Array.isArray(fRes?.items) ? fRes.items.map((x: any) => x.data) : [],
      );
    })();
  }, [id]);

  if (!prospect) {
    return (
      <div className="container px-4 sm:px-6 py-8">
        <div className="text-sm text-slate-600">Chargement…</div>
      </div>
    );
  }

  const contacts = Array.isArray(prospect.contacts) ? prospect.contacts : [];
  const primaryContact = contacts[0] || null;

  const recommendations = useMemo(() => {
    if (!prospect) return [] as ScriptRecommendation[];
    return computeScriptRecommendations({
      prospect,
      formations,
      templates,
      contact: primaryContact,
    });
  }, [prospect, formations, templates, primaryContact]);

  const handleCopy = async (label: string, text: string) => {
    if (!text) {
      toast({ title: `${label} vide` });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copié` });
    } catch (error) {
      toast({ title: "Échec de la copie" });
    }
  };

  const handlePersonalize = (recommendation: ScriptRecommendation) => {
    setSelectedRecommendation(recommendation);
    setOpenCompose(true);
  };

  return (
    <div className="container max-w-[1200px] px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Link
            to="/prospects"
            className="inline-flex items-center gap-1 text-sm text-slate-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
          <h1 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900">
            {prospect.company_name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOpenPDF(true)}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Générer proposition PDF
          </button>
        </div>
      </div>

      <div className="text-sm text-slate-600">
        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px]">
          {prospect.sector || "Secteur ?"}
        </span>
        <span className="mx-2">·</span>
        <span>{prospect.region || "Région ?"}</span>
        <span className="mx-2">·</span>
        <span>{prospect.size_band || "Taille ?"}</span>
        {typeof prospect.priority_score === "number" && (
          <>
            <span className="mx-2">·</span>
            <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[11px]">
              Score {prospect.priority_score}
            </span>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-4">
          <RecommendedScripts
            recommendations={recommendations}
            onCopy={handleCopy}
            onPersonalize={handlePersonalize}
          />
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Contacts
            </h3>
            {contacts.length === 0 && (
              <div className="text-sm text-slate-600">Aucun contact</div>
            )}
            {contacts.length > 0 && (
              <ul className="space-y-2">
                {contacts.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {c.name || "—"} {c.role ? `(${c.role})` : ""}
                      </div>
                      <div className="text-slate-600">{c.phone || ""}</div>
                    </div>
                    {c.email && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`mailto:${c.email}`}
                            className="inline-flex items-center gap-1 text-blue-700 hover:underline text-sm"
                          >
                            <Mail className="h-4 w-4" /> {c.email}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Envoyer un e-mail</TooltipContent>
                      </Tooltip>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {prospect.notes && (
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Notes
              </h3>
              <div className="whitespace-pre-wrap text-sm text-slate-800">
                {prospect.notes}
              </div>
            </section>
          )}

          {(prospect.training_history || prospect.budget_hint) && (
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Historique & Budget
              </h3>
              {prospect.training_history && (
                <div className="text-sm text-slate-800">
                  <span className="text-slate-600">Formations suivies:</span>{" "}
                  {prospect.training_history}
                </div>
              )}
              {prospect.budget_hint && (
                <div className="text-sm text-slate-800">
                  <span className="text-slate-600">Budget:</span>{" "}
                  {prospect.budget_hint}
                </div>
              )}
            </section>
          )}
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Assistant IA
            </h3>
            <CommercialAIAssistant
              prospect={{
                company_name: prospect.company_name,
                sector: prospect.sector,
                region: prospect.region,
                notes: prospect.notes,
              }}
              templates={templates}
            />
          </section>
        </aside>
      </div>

      <GeneratePDFModal
        open={openPDF}
        onClose={() => setOpenPDF(false)}
        context="prospect"
        initialProspect={prospect}
        initialTemplates={templates}
      />
    </div>
  );
}
