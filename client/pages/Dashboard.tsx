import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Building2,
  GraduationCap,
  FileText,
  Upload,
  HelpCircle,
  Mail,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import ComposeEmailModal from "@/components/shared/ComposeEmailModal";
import ContextualScriptList, {
  type ContextualScriptItem,
} from "@/components/dashboard/ContextualScriptList";
import { computeScriptRecommendations } from "@/lib/recommendations";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const TRAINING_STORAGE_KEY = "fpsg_internal_training_progress";
const TRAINING_MODULE_COUNT = 5;
const FALLBACK_TEMPLATE_CARDS = [
  {
    title: "Prise de contact retail",
    useCase: "Prospection à froid",
    email:
      'Subject: Formation "{{formation_title}}" — prise de contact\n\nBonjour {{contact_name}},\n\nJe me permets de vous contacter au sujet de la formation "{{formation_title}}" pour vos équipes {{audience}} (secteur {{sector}}).\nNous accompagnons de nombreuses organisations sur les sujets de sûreté, sécurité et prévention.\n\nSouhaitez-vous que nous échangions 15 minutes cette semaine ?\n\nCordialement,\n{{your_name}}\nFPSG (Fiducial)\n{{your_email}}',
    speech:
      "Bonjour {{contact_name}}, je suis {{your_name}} de FPSG. Nous accompagnons {{sector}} sur des formations en sûreté, sécurité, gestion de conflit et prévention.\nSelon vos enjeux, nous pouvons proposer du présentiel, distanciel ou blended. Est-ce pertinent que je vous présente \"{{formation_title}}\" pour {{audience}} ?",
  },
  {
    title: "Relance rendez-vous",
    useCase: "Relance",
    email:
      "Subject: Relance — {{formation_title}}\n\nBonjour {{contact_name}},\nSuite à mon précédent message, je me permets une relance rapide...\n\nCordialement,\n{{your_name}}",
    speech:
      "Bonjour {{contact_name}}, je me permets une relance rapide concernant notre échange...",
  },
  {
    title: "Suite à incident",
    useCase: "Réactivité",
    email:
      "Subject: Suite à l'incident — accompagnement FPSG\n\nBonjour {{contact_name}}, nous pouvons former vos équipes sur {{formation_title}}...",
    speech:
      "Bonjour {{contact_name}}, suite à l'incident récent, nous proposons un module dédié...",
  },
] as const;

type ProspectRecord = ContextualScriptItem["prospect"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prospects, setProspects] = useState<ProspectRecord[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedScript, setSelectedScript] =
    useState<ContextualScriptItem | null>(null);
  const [trainingStats, setTrainingStats] = useState({
    done: 0,
    total: TRAINING_MODULE_COUNT,
    pct: 0,
  });

  const refreshTrainingProgress = () => {
    try {
      const raw =
        typeof window === "undefined"
          ? null
          : window.localStorage.getItem(TRAINING_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const done = Array.isArray(parsed)
        ? parsed.filter((item) => item?.completed).length
        : Object.values(parsed || {}).filter((value: any) => value?.completed)
            .length;
      const total = TRAINING_MODULE_COUNT;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      setTrainingStats({ done, total, pct });
    } catch {
      setTrainingStats({ done: 0, total: TRAINING_MODULE_COUNT, pct: 0 });
    }
  };

  useEffect(() => {
    refreshTrainingProgress();
    if (typeof window === "undefined") return;
    const handler = (event: StorageEvent) => {
      if (!event.key || event.key === TRAINING_STORAGE_KEY) {
        refreshTrainingProgress();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const [counts, setCounts] = useState<{
    prospects?: number;
    formations?: number;
    templates?: number;
  }>({});

  useEffect(() => {
    (async () => {
      try {
        const key = (import.meta as any).env?.VITE_BUILDER_PUBLIC_KEY as
          | string
          | undefined;
        if (!key) return;
        const base = "https://cdn.builder.io/api/v3/content";
        const models = ["prospects", "formations", "templates"] as const;
        const results = await Promise.all(
          models.map(async (m) => {
            const url = `${base}/${m}?apiKey=${key}&limit=1&fields=none&cachebust=${Date.now()}`;
            const r = await fetch(url);
            const j = await r.json();
            return [m, (j?.count ?? j?.total ?? 0) as number] as const;
          }),
        );
        setCounts(Object.fromEntries(results));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, fRes, tRes] = await Promise.all([
          fetch("/api/prospects?limit=200")
            .then((r) => r.json())
            .catch(() => ({ items: [] })),
          fetch("/api/formations?limit=200")
            .then((r) => r.json())
            .catch(() => ({ items: [] })),
          fetch("/api/templates?limit=200")
            .then((r) => r.json())
            .catch(() => ({ items: [] })),
        ]);
        const mappedProspects: ProspectRecord[] = Array.isArray(pRes?.items)
          ? pRes.items.map((item: any) => ({ id: item.id, ...(item.data || {}) }))
          : [];
        const mappedFormations = Array.isArray(fRes?.items)
          ? fRes.items.map((item: any) => ({ id: item.id, ...(item.data || {}) }))
          : [];
        const mappedTemplates = Array.isArray(tRes?.items)
          ? tRes.items.map((item: any) => ({ id: item.id, ...(item.data || {}) }))
          : [];
        setProspects(mappedProspects);
        setFormations(mappedFormations);
        setTemplates(mappedTemplates);
      } catch (error) {
        console.error("Failed to load contextual data", error);
      }
    })();
  }, []);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copié dans le presse-papiers` });
    } catch {
      toast({
        title: "Impossible de copier",
        description: "Vérifiez les permissions du navigateur",
      });
    }
  };

  const contextualScripts = useMemo<ContextualScriptItem[]>(() => {
    if (!prospects.length || !templates.length) return [];
    const sorted = [...prospects].sort(
      (a, b) => (b.priority_score || 0) - (a.priority_score || 0),
    );
    const entries: ContextualScriptItem[] = [];
    for (const prospect of sorted) {
      const contact = Array.isArray(prospect.contacts)
        ? prospect.contacts[0] || undefined
        : undefined;
      const recs = computeScriptRecommendations({
        prospect,
        formations,
        templates,
        contact,
      });
      if (recs.length) {
        entries.push({ prospect, recommendation: recs[0] });
      }
      if (entries.length >= 5) break;
    }
    return entries;
  }, [prospects, formations, templates]);

  const templateHighlights = useMemo(() => contextualScripts.slice(0, 3), [
    contextualScripts,
  ]);

  const templateCards = useMemo(
    () =>
      templateHighlights.length
        ? templateHighlights.map((item) => ({
            title: item.recommendation.template.template_name,
            useCase: item.recommendation.template.use_case || "Prospection",
            email: `Subject: ${item.recommendation.subjectPreview}\n\n${item.recommendation.emailBodyPreview}`,
            speech: item.recommendation.speechPreview || "",
          }))
        : [...FALLBACK_TEMPLATE_CARDS],
    [templateHighlights],
  );

  const handlePersonalize = (item: ContextualScriptItem) => {
    setSelectedScript(item);
    setComposeOpen(true);
  };

  const composeContext = selectedScript
    ? {
        prospect: selectedScript.prospect,
        formation: selectedScript.recommendation.formation
          ? {
              title: selectedScript.recommendation.formation.title,
              duration: selectedScript.recommendation.formation.duration,
              format: selectedScript.recommendation.formation.format,
              domain: selectedScript.recommendation.formation.domain,
            }
          : undefined,
      }
    : undefined;

  const composePreset = selectedScript
    ? {
        templateName: selectedScript.recommendation.template.template_name,
        subject: selectedScript.recommendation.subjectPreview,
        body: selectedScript.recommendation.emailBodyPreview,
      }
    : undefined;

  return (
    <div className="container max-w-[1200px] px-4 sm:px-6 py-6 sm:py-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="h-9 w-9 rounded-md bg-primary/90 ring-1 ring-primary/30 flex items-center justify-center text-primary-foreground font-bold"
          >
            F
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-slate-900">
            FPSG Prospection Assistant
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate("/nouvelle-recherche")}
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Search className="h-4 w-4" /> Nouvelle recherche
          </button>
          <Dialog>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring">
                <Upload className="h-4 w-4" /> Importer CSV
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import CSV</DialogTitle>
                <DialogDescription>
                  À venir : import des formations, prospects et templates (CSV).
                  Vous pourrez déposer un fichier ici.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <Link
            to="/aide"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 underline-offset-4 hover:underline"
          >
            <HelpCircle className="h-4 w-4" /> Aide
          </Link>
        </div>
      </div>

      {/* Hero banner */}
      <section className="mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 className="text-[22px] sm:text-[24px] font-semibold text-slate-900">
            Bienvenue
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            Préparez vos rendez-vous, trouvez des prospects, générez vos e-mails
            et speechs en 1 clic.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Chip label="Prospects" value={counts.prospects} />
            <Chip label="Formations" value={counts.formations} />
            <Chip label="Templates" value={counts.templates} />
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate("/nouvelle-recherche")}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Search className="h-4 w-4" /> Commencer une nouvelle recherche
            </button>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={<Search className="h-5 w-5" />}
            iconLabel="Recherche"
            title="Nouvelle recherche"
            description="Assistant guidé : domaine → public/secteur → format → objectif."
            ctaLabel="Ouvrir"
            onClick={() => navigate("/nouvelle-recherche")}
          />
          <FeatureCard
            icon={<Building2 className="h-5 w-5" />}
            iconLabel="Prospects"
            title="Prospects"
            description="Liste d’entreprises, contacts, notes, scoring, suivi."
            count={counts.prospects}
            ctaLabel="Voir la liste"
            onClick={() => navigate("/prospects")}
          />
          <FeatureCard
            icon={<GraduationCap className="h-5 w-5" />}
            iconLabel="Formations"
            title="Formations"
            description="Offres FPSG par domaine, format, public, secteur."
            count={counts.formations}
            ctaLabel="Voir la liste"
            onClick={() => navigate("/formations")}
          />
          <FeatureCard
            icon={<FileText className="h-5 w-5" />}
            iconLabel="Templates"
            title="Templates"
            description="E-mails & speechs prêts à l’emploi avec placeholders."
            count={counts.templates}
            ctaLabel="Voir la liste"
            onClick={() => navigate("/templates")}
          />
        </div>
      </section>

      {/* Quick shortcuts */}
      <section className="mb-8">
        <h2 className="text-[20px] sm:text-[22px] font-semibold text-slate-900 mb-3">
          Raccourcis rapides
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/prospects/new"
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Créer un nouveau prospect
          </Link>
          <Link
            to="/templates/new"
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Ajouter un template
          </Link>
        </div>
      </section>

      {/* Contextual scripts & onboarding */}
      <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContextualScriptList
            items={contextualScripts}
            onCopy={copy}
            onPersonalize={handlePersonalize}
          />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Parcours e-learning interne
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">
                      Validez les modules clés pour la prospection FPSG (plateforme,
                      scripts, objections).
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {trainingStats.done}/{trainingStats.total}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2">
                  <Progress value={trainingStats.pct} />
                  <div className="text-xs text-slate-500">
                    {trainingStats.pct}% complété · {trainingStats.done} module
                    {trainingStats.done > 1 ? "s" : ""} validé
                    {trainingStats.done > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/espace-formation-interne"
                    className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    Ouvrir l’e-learning
                  </Link>
                  <Link
                    to="/analytics"
                    className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    Voir les analytics
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">
              Modules à prioriser
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Guide de révision rapide avant vos rendez-vous.
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-700">
              <li>
                <Link
                  to="/espace-formation-interne#prise_contact"
                  className="underline-offset-4 hover:underline"
                >
                  Réussir la prise de contact
                </Link>
                <span className="ml-1 text-slate-400">(scripts + objections)</span>
              </li>
              <li>
                <Link
                  to="/espace-formation-interne#templates"
                  className="underline-offset-4 hover:underline"
                >
                  Templates d’e-mails et scripts
                </Link>
              </li>
              <li>
                <Link
                  to="/espace-formation-interne#plateforme"
                  className="underline-offset-4 hover:underline"
                >
                  Découverte de la plateforme
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Activity feed and Featured templates */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-[20px] sm:text-[22px] font-semibold text-slate-900 mb-3">
            Dernières activités
          </h2>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y">
            {[
              { t: "Prospect créé : ACME Santé", s: "06/10 10:24", tag: "Prospect" },
              {
                t: "Template mis à jour : Relance RDV",
                s: "05/10 15:02",
                tag: "Template",
              },
              {
                t: "Formation ajoutée : Gestion de conflit",
                s: "04/10 11:37",
                tag: "Formation",
              },
              {
                t: "Prospect édité : LUMEN Retail",
                s: "03/10 16:05",
                tag: "Prospect",
              },
              {
                t: "Prospect qualifié : Novabank",
                s: "02/10 09:18",
                tag: "Prospect",
              },
            ].map((a, i) => (
              <ActivityItem key={i} title={a.t} subtitle={a.s} tag={a.tag} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-[20px] sm:text-[22px] font-semibold text-slate-900 mb-3">
            Templates mis en avant
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {templateCards.map((card, index) => (
              <TemplateCard
                key={`${card.title}-${index}`}
                title={card.title}
                useCase={card.useCase}
                onCopyEmail={() => copy("E-mail", card.email)}
                onCopySpeech={card.speech ? () => copy("Speech", card.speech) : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      <ComposeEmailModal
        open={composeOpen}
        onClose={() => {
          setComposeOpen(false);
          setSelectedScript(null);
        }}
        context={composeContext}
        defaultUseCase={selectedScript?.recommendation.template.use_case}
        preset={composePreset}
      />
    </div>
  );
}

function Chip({ label, value }: { label: string; value?: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-slate-700">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
      {label} : <strong className="font-semibold">{value ?? "—"}</strong>
    </span>
  );
}

function FeatureCard({
  icon,
  iconLabel,
  title,
  description,
  count,
  ctaLabel,
  onClick,
}: {
  icon: React.ReactNode;
  iconLabel: string;
  title: string;
  description: string;
  count?: number;
  ctaLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:bg-gray-50 hover:border-gray-300">
      <div className="flex items-start gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          </TooltipTrigger>
          <TooltipContent>{iconLabel}</TooltipContent>
        </Tooltip>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <span className="text-xs text-slate-500">{count ?? "—"}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
          <div className="mt-3">
            <button
              onClick={onClick}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({
  title,
  subtitle,
  tag,
}: {
  title: string;
  subtitle: string;
  tag: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
      <span className="inline-flex items-center rounded-full bg-gray-100 text-slate-700 border border-gray-200 px-2.5 py-1 text-xs">
        {tag}
      </span>
    </div>
  );
}

function TemplateCard({
  title,
  useCase,
  onCopyEmail,
  onCopySpeech,
}: {
  title: string;
  useCase: string;
  onCopyEmail: () => void;
  onCopySpeech?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 inline-flex items-center rounded-full bg-gray-100 text-slate-700 border border-gray-200 px-2 py-0.5 text-[11px]">
            {useCase}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={onCopyEmail}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Mail className="h-4 w-4" /> Copier e-mail
        </button>
        {onCopySpeech && (
          <button
            onClick={onCopySpeech}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <MessageSquare className="h-4 w-4" /> Copier speech
          </button>
        )}
      </div>
    </div>
  );
}
