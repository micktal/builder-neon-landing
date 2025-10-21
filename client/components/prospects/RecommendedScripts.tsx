import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, FileText, Sparkles } from "lucide-react";
import type { ScriptRecommendation } from "@/lib/recommendations";

interface RecommendedScriptsProps {
  recommendations: ScriptRecommendation[];
  onCopy: (label: string, text: string) => Promise<void> | void;
  onPersonalize: (recommendation: ScriptRecommendation) => void;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function formatFormationSummary(rec: ScriptRecommendation) {
  if (!rec.formation) return null;
  const { title, domain, duration } = rec.formation;
  const formatList = Array.isArray(rec.formation.format)
    ? (rec.formation.format as string[])
    : rec.formation.format
    ? [rec.formation.format]
    : [];
  const formatText = formatList.filter(Boolean).join(" · ");
  const parts = [title, domain, duration, formatText].filter(Boolean);
  if (!parts.length) return null;
  return parts.join(" • ");
}

function renderReasons(reasons: string[]) {
  return (
    <ul className="mt-3 space-y-1 text-xs text-slate-600">
      {reasons.map((reason, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="text-primary">•</span>
          <span>{reason}</span>
        </li>
      ))}
    </ul>
  );
}

function RecommendedScriptCard({
  recommendation,
  onCopy,
  onPersonalize,
}: {
  recommendation: ScriptRecommendation;
  onCopy: RecommendedScriptsProps["onCopy"];
  onPersonalize: RecommendedScriptsProps["onPersonalize"];
}) {
  const subject = recommendation.subjectPreview || "";
  const body = recommendation.emailBodyPreview || "";
  const speech = recommendation.speechPreview || "";
  const reasons = useMemo(() => recommendation.reasons ?? [], [recommendation.reasons]);
  const formationSummary = useMemo(
    () => formatFormationSummary(recommendation),
    [recommendation],
  );

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-slate-900">
              {recommendation.template.template_name}
            </h4>
          </div>
          {recommendation.template.use_case && (
            <div className="text-xs text-slate-600 mt-1">
              {recommendation.template.use_case}
            </div>
          )}
          {formationSummary && (
            <div className="mt-2 text-xs text-slate-500">
              {formationSummary}
            </div>
          )}
        </div>
        <Badge variant="secondary" className="text-xs font-semibold">
          Adéquation {clampScore(recommendation.score)} / 100
        </Badge>
      </div>

      {reasons.length > 0 && renderReasons(reasons)}

      <Separator className="my-4" />

      <div className="space-y-3 text-sm text-slate-800">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Sujet e-mail recommandé
          </div>
          <div className="mt-1 rounded-md bg-slate-50 px-3 py-2">
            {subject || "—"}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Corps e-mail
          </div>
          <div className="mt-1 rounded-md bg-slate-50 px-3 py-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
            {body || "—"}
          </div>
        </div>
        {speech && (
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Script oral
            </div>
            <div className="mt-1 rounded-md bg-slate-50 px-3 py-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {speech}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopy("E-mail recommandé", `Subject: ${subject}\n\n${body}`)}
          disabled={!subject && !body}
        >
          <Copy className="mr-2 h-4 w-4" /> Copier l’e-mail
        </Button>
        {speech && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy("Script oral", speech)}
          >
            <FileText className="mr-2 h-4 w-4" /> Copier script oral
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => onPersonalize(recommendation)}
        >
          Personnaliser
        </Button>
      </div>
    </article>
  );
}

export default function RecommendedScripts({
  recommendations,
  onCopy,
  onPersonalize,
}: RecommendedScriptsProps) {
  if (!recommendations.length) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Scripts recommandés
        </h3>
        <p className="text-sm text-slate-600">
          Pas encore de recommandation : complétez le secteur, la région et la
          formation souhaitée pour voir des scripts adaptés.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Scripts recommandés
      </h3>
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <RecommendedScriptCard
            key={rec.template.template_name}
            recommendation={rec}
            onCopy={onCopy}
            onPersonalize={onPersonalize}
          />
        ))}
      </div>
    </section>
  );
}
