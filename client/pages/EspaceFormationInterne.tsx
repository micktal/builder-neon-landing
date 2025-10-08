import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, CheckCircle2 } from "lucide-react";

type ModuleKey = "pitch" | "argumentaire" | "consultative" | "outils" | "templates";

const MODULES: { key: ModuleKey; title: string; desc: string; sections: { title: string; content: string }[] }[] = [
  {
    key: "pitch",
    title: "Pitch FPSG",
    desc: "Comprendre et maîtriser le positionnement FPSG pour l'expliquer en 60 secondes.",
    sections: [
      { title: "Positionnement", content: "FPSG accompagne les organisations dans la prévention des risques humains et matériels, avec une approche globale mêlant conformité, culture sécurité et efficacité opérationnelle." },
      { title: "Preuves & différenciation", content: "Expertise multisectorielle, référentiel de formations éprouvé, et accompagnement du diagnostic jusqu'au déploiement. Nous combinons présentiel, distanciel et accompagnement terrain." },
      { title: "Pitch 60s (exemple)", content: "Chez FPSG, nous aidons vos équipes à prévenir les risques et à sécuriser vos opérations. Grâce à des modules concrets, adaptés à votre secteur, nous accélérons la montée en compétence tout en respectant vos contraintes. L'objectif: des équipes plus confiantes, des incidents réduits, et une conformité maîtrisée." }
    ]
  },
  {
    key: "argumentaire",
    title: "Argumentaire sécurité & prévention",
    desc: "Savoir structurer un argumentaire orienté valeur, preuves et ROI.",
    sections: [
      { title: "Enjeux clés", content: "Réduction des accidents, conformité réglementaire, image employeur, continuité d'activité. Les enjeux diffèrent par secteur: distribution, industrie, services publics." },
      { title: "Objections courantes", content: "‘Pas de temps’, ‘Déjà formés’, ‘Pas de budget’. Réponses: formats courts et modulaires, mise à jour ciblée, impact mesurable (absentéisme, sinistralité, qualité)." },
      { title: "Preuves & ROI", content: "Témoignages clients, indicateurs avant/après, taux de complétion, amélioration des audits internes, diminution des incidents déclarés." }
    ]
  },
  {
    key: "consultative",
    title: "Méthodes de vente consultative",
    desc: "Diagnostiquer, reformuler, proposer: la méthode en 3 temps.",
    sections: [
      { title: "1) Diagnostic", content: "Cartographier les risques, comprendre l'organisation, prioriser: sites, métiers, profils à risque, historique d'incidents." },
      { title: "2) Reformulation", content: "Reprendre les enjeux avec les mots du client, valider l'impact attendu et les contraintes (planning, formats, sites)." },
      { title: "3) Proposition", content: "Assembler un parcours: objectifs pédagogiques, formats (présentiel/visio/elearning), public cible, calendrier, indicateurs de suivi." }
    ]
  },
  {
    key: "outils",
    title: "Outils digitaux (usage de la plateforme)",
    desc: "Savoir utiliser les fonctionnalités clés pour préparer et suivre une proposition.",
    sections: [
      { title: "Recherche & ciblage", content: "Utilisez ‘Nouvelle recherche’ pour filtrer par secteur, région et taille, puis priorisez via le score. Export et copier-coller des e-mails disponibles." },
      { title: "Fiches formation", content: "Chaque fiche contient objectifs, formats, audiences, secteurs. Générer la ‘Proposition PDF’ directement depuis la fiche pour un support propre client." },
      { title: "Assistant IA", content: "L'assistant IA propose analyses de prospects, templates d'approche et rédaction d'e-mails contextualisés." }
    ]
  },
  {
    key: "templates",
    title: "Templates d’e-mails et discours",
    desc: "S'appuyer sur des scripts et e-mails testés, à adapter selon le secteur.",
    sections: [
      { title: "E-mails ", content: "Utiliser les sujets clairs (‘Sécurité équipes — proposition adaptée à votre organisation’) et un corps concis: contexte, bénéfices, prochain pas." },
      { title: "Discours appels", content: "Structure: ouverture + cadrage (enjeux) + proposition courte + prise de rendez-vous. Préparer une alternative si indisponible." },
      { title: "Personnalisation", content: "Relier l'exemple à un fait concret du prospect (site, activité, incident passé, contrainte réglementaire locale)." }
    ]
  }
];

type ProgressState = Partial<Record<ModuleKey, { completed: boolean; notes?: string }>>;
const LS_KEY = "fpsg_internal_training_progress";

export default function EspaceFormationInterne() {
  const [progress, setProgress] = useState<ProgressState>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
  });
  const total = MODULES.length;
  const done = useMemo(() => Object.values(progress).filter(v => v?.completed).length, [progress]);
  const pct = Math.round((done / total) * 100);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(progress || {})); }, [progress]);

  const toggleComplete = (k: ModuleKey) => setProgress(p => ({ ...p, [k]: { ...(p[k]||{}), completed: !(p[k]?.completed) } }));
  const setNotes = (k: ModuleKey, v: string) => setProgress(p => ({ ...p, [k]: { ...(p[k]||{}), notes: v } }));
  const resetAll = () => setProgress({});

  return (
    <div className="container max-w-[1100px] px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900">Espace Formation Interne FPSG</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">Progression: {done}/{total} ({pct}%)</Badge>
          <Progress value={pct} className="w-[160px]" />
          <Button variant="outline" onClick={resetAll}>Réinitialiser</Button>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">Mini e-learning interne pour commerciaux: modules courts, concrets et orientés terrain.</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 space-y-2">
          {MODULES.map(m => (
            <Card key={m.key} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">{m.title}</div>
                <div className="text-xs text-slate-600 line-clamp-2">{m.desc}</div>
              </div>
              <Button variant={progress[m.key]?.completed ? "default" : "outline"} onClick={() => toggleComplete(m.key)} className="ml-2">
                {progress[m.key]?.completed ? <><CheckCircle2 className="h-4 w-4 mr-1"/> Terminé</> : "Marquer terminé"}
              </Button>
            </Card>
          ))}
        </aside>

        <main className="lg:col-span-2 space-y-6">
          {MODULES.map(m => (
            <section key={m.key} id={m.key} className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{m.title}</h2>
                <Button size="sm" variant={progress[m.key]?.completed ? "default" : "outline"} onClick={() => toggleComplete(m.key)}>
                  {progress[m.key]?.completed ? <><CheckCircle2 className="h-4 w-4 mr-1"/> Terminé</> : "Marquer terminé"}
                </Button>
              </div>
              <p className="mt-1 text-sm text-slate-600">{m.desc}</p>
              <div className="mt-4">
                <Accordion type="single" collapsible className="w-full">
                  {m.sections.map((s, i) => (
                    <AccordionItem key={i} value={`${m.key}-${i}`}>
                      <AccordionTrigger className="text-left">{s.title}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{s.content}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium">Mes notes</label>
                <Textarea value={progress[m.key]?.notes || ""} onChange={(e)=>setNotes(m.key, e.target.value)} rows={4} placeholder="Points clés, objections traitées, exemples secteurs…" />
              </div>
            </section>
          ))}
        </main>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800"><BookOpen className="h-4 w-4"/> Astuce: transformez une proposition récente en support d'entraînement (lecture + reformulation en 60s).
        </div>
      </div>
    </div>
  );
}
