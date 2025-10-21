import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, FileText, Mail } from "lucide-react";
import type { ScriptRecommendation } from "@/lib/recommendations";

export interface ProspectSummary {
  id?: string;
  company_name: string;
  sector?: string;
  region?: string;
  size_band?: string;
  contacts?: { name?: string; email?: string; role?: string }[];
}

export interface ContextualScriptItem {
  prospect: ProspectSummary;
  recommendation: ScriptRecommendation;
}

interface ContextualScriptListProps {
  items: ContextualScriptItem[];
  onCopy: (label: string, text: string) => Promise<void> | void;
  onPersonalize: (item: ContextualScriptItem) => void;
}

function formatContact(prospect: ProspectSummary) {
  const c0 = prospect.contacts?.[0];
  if (!c0?.name && !c0?.email) return "Contact non renseigné";
  return [c0?.name, c0?.role].filter(Boolean).join(" · ") || c0?.email || "Contact";
}

export default function ContextualScriptList({
  items,
  onCopy,
  onPersonalize,
}: ContextualScriptListProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <h3 className="text-[18px] font-semibold text-slate-900">
          Scripts contextualisés
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Ajoutez des prospects (secteur, région, format) et des templates pour
          obtenir des scripts prêts à l’emploi sur ce tableau de bord.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[18px] font-semibold text-slate-900">
            Scripts contextualisés
          </h3>
          <p className="text-sm text-slate-600">
            Recommandations calculées automatiquement selon le prospect, la
            formation et le script disponibles.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {items.length} opportunité{items.length > 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const { prospect, recommendation } = item;
          const contact = formatContact(prospect);
          const emailText = `Subject: ${recommendation.subjectPreview}\n\n${recommendation.emailBodyPreview}`;
          return (
            <article
              key={`${prospect.company_name}-${recommendation.template.template_name}`}
              className="rounded-xl border border-gray-200 bg-white/60 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {prospect.company_name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {recommendation.template.use_case || "Prospection"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-600 flex flex-wrap gap-2">
                    {prospect.sector && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 border border-blue-200">
                        {prospect.sector}
                      </span>
                    )}
                    {prospect.region && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">
                        {prospect.region}
                      </span>
                    )}
                    {prospect.size_band && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 border border-slate-200">
                        {prospect.size_band}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{contact}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase tracking-wide">
                    Script proposé
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    {recommendation.template.template_name}
                  </div>
                  {recommendation.formation && (
                    <div className="mt-1 text-xs text-slate-600">
                      {recommendation.formation.title || "Formation associée"}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm text-slate-700">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Sujet recommandé
                  </div>
                  <div className="mt-1 rounded-md bg-slate-50 px-3 py-2">
                    {recommendation.subjectPreview || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Script oral
                  </div>
                  <div className="mt-1 rounded-md bg-slate-50 px-3 py-2 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {recommendation.speechPreview || "—"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => onCopy("E-mail recommandé", emailText)}>
                  <Mail className="mr-2 h-4 w-4" /> Copier l’e-mail
                </Button>
                {recommendation.speechPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCopy("Script oral", recommendation.speechPreview)}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Copier le script
                  </Button>
                )}
                <Button size="sm" onClick={() => onPersonalize(item)}>
                  Personnaliser
                </Button>
                {prospect.id && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/prospects/${prospect.id}`}>Ouvrir la fiche</Link>
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
