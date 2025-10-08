import { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle2 } from "lucide-react";

type ModuleKey = "plateforme" | "prise_contact" | "argumentaire" | "consultative" | "templates";

const MODULES: { key: ModuleKey; title: string; desc: string; sections: { title: string; content: string }[] }[] = [
  {
    key: "plateforme",
    title: "Découverte de la plateforme",
    desc: "Maîtriser la navigation: recherche, fiches formations, IA, PDF.",
    sections: [
      { title: "Navigation et recherche", content: "Depuis ‘Nouvelle recherche’, filtrez par domaine, publics, secteurs, région et format. Utilisez le stepper pour préparer un cadrage rapide et ‘Voir les résultats’ pour afficher formations, prospects et templates pertinents." },
      { title: "Fiche formation", content: "Chaque fiche regroupe objectifs, formats, audiences, secteurs, plaquette PDF et lien teaser. Utilisez ‘Générer proposition PDF’ pour créer un support client propre." },
      { title: "Assistant IA", content: "Analyse prospect, suggestion de templates, rédaction d’e-mails et résumés d’échanges. Restez concis et fournissez le contexte (secteur, enjeu, objection)." },
      { title: "Carte prospects", content: "Vue ‘Carte’ dans Prospects pour repérer les zones chaudes. Couleur par score ou par secteur, zoom pour labels, clic pour ouvrir la fiche." },
    ]
  },
  {
    key: "prise_contact",
    title: "Réussir la prise de contact",
    desc: "Préparer, écrire, appeler, traiter les objections et relancer.",
    sections: [
      { title: "Préparation", content: "Vérifiez secteur, région, taille et historique. Identifiez un besoin ou un déclencheur (incident, audit, croissance, conformité)." },
      { title: "E-mail d’ouverture", content: "Structure: objet clair + contexte court + bénéfice concret + proposition simple (appel 15 min) + signature. Restez spécifique au secteur du prospect." },
      { title: "Appel court", content: "Ouverture + cadrage (enjeux/contraintes) + proposition d’étape suivante. Exemple: ‘Nous aidons vos équipes à réduire les incidents en magasin via des ateliers concrets. 15 min pour cadrer ?’" },
      { title: "Objections", content: "Pas de temps → formats courts; Déjà formés → mise à niveau ciblée; Budget → impact mesurable (absentéisme, sinistralit��, qualité). Conclure par une micro-prochaine étape." },
      { title: "Relance", content: "Sous 3–5 jours: rappel du bénéfice + créneau proposé + pièce jointe utile (PDF)." },
    ]
  },
  {
    key: "argumentaire",
    title: "Argumentaire sécurité & prévention",
    desc: "Structurer un argumentaire orienté valeur et ROI.",
    sections: [
      { title: "Enjeux", content: "Réduction des accidents, conformité réglementaire, image employeur, continuité d’activité." },
      { title: "Preuves", content: "Avant/après, taux de complétion, audits internes, diminution des incidents déclarés, témoignages." },
      { title: "Adaptation secteur", content: "Retails, Industrie, Santé, Public: exemples et contraintes spécifiques (horaires, multi-sites, profils)." },
    ]
  },
  {
    key: "consultative",
    title: "Méthodes de vente consultative",
    desc: "Diagnostiquer, reformuler, proposer (3 temps).",
    sections: [
      { title: "Diagnostic", content: "Cartographiez les risques, profils à risque, historiques d’incidents, contraintes (planning, sites, formats)." },
      { title: "Reformulation", content: "Validez les enjeux dans les mots du client. Quantifiez l’impact attendu (sécurité, opérations, qualité)." },
      { title: "Proposition", content: "Objectifs pédagogiques + formats (présentiel/visio/elearning) + publics + calendrier + indicateurs de suivi." },
    ]
  },
  {
    key: "templates",
    title: "Templates d’e-mails et scripts",
    desc: "Modèles prêts à l’emploi à personnaliser.",
    sections: [
      { title: "E-mails", content: "Objet clair; 4–6 lignes max; appel à l’action concret. Utilisez ‘Générer proposition PDF’ comme pièce jointe utile." },
      { title: "Scripts téléphoniques", content: "Ouverture courte + cadrage + proposition d’étape. Préparez un plan B si indisponible." },
      { title: "Personnalisation", content: "Reliez un exemple à un fait concret (site, incident, audit, réglementation locale)." },
    ]
  },
];

type ProgressState = Partial<Record<ModuleKey, { completed: boolean; notes?: string }>>;
const LS_KEY = "fpsg_internal_training_progress";

export default function EspaceFormationInterne() {
  const { toast } = useToast();
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

      <p className="mt-2 text-sm text-slate-600">Mini e-learning interne: comprendre la plateforme et réussir la prise de contact.</p>

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

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Scripts partagés (tuteurs)</h2>
        <p className="text-sm text-slate-600">Créez un e-mail ou un script téléphonique et enregistrez-le pour l'équipe.</p>
        <TutorScriptForm onSaved={() => toast({ title: 'Script enregistré' })} />
      </section>
    </div>
  );
}

function toArray(input: string): string[] { return input.split(',').map(s => s.trim()).filter(Boolean); }

function TutorScriptForm({ onSaved }: { onSaved: () => void }) {
  const [template_name, setName] = useState("");
  const [useCase, setUseCase] = useState("Interne");
  const [email_subject, setSubject] = useState("");
  const [email_body, setBody] = useState("");
  const [speech_text, setSpeech] = useState("");
  const [domain, setDomain] = useState("");
  const [sectors, setSectors] = useState("");
  const [formats, setFormats] = useState("");
  const [audiences, setAudiences] = useState("");
  const [loading, setLoading] = useState(false);

  const canSave = template_name.trim().length > 2 && (email_body.trim().length > 0 || speech_text.trim().length > 0);

  const save = async () => {
    setLoading(true);
    try {
      const payload = {
        template_name,
        use_case: useCase,
        email_subject,
        email_body,
        speech_text,
        domain_filter: toArray(domain),
        sector_filter: toArray(sectors),
        format_filter: toArray(formats),
        audience_filter: toArray(audiences),
      };
      const resp = await fetch('/api/templates/create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const json = await resp.json();
      if (!resp.ok || json?.error) throw new Error(json?.error || 'Erreur enregistrement');
      onSaved();
      setName(""); setSubject(""); setBody(""); setSpeech(""); setDomain(""); setSectors(""); setFormats(""); setAudiences("");
    } catch (e:any) {
      alert(e?.message || 'Erreur');
    } finally { setLoading(false); }
  };

  return (
    <div className="mt-4 grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Nom du script</label>
          <Input value={template_name} onChange={(e)=>setName(e.target.value)} placeholder="Ex: Découverte – secteur Retail" />
        </div>
        <div>
          <label className="text-sm font-medium">Type / usage</label>
          <select value={useCase} onChange={(e)=>setUseCase(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="Interne">Interne</option>
            <option value="Telephone">Téléphone</option>
            <option value="Email">E-mail</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Sujet (e-mail)</label>
          <Input value={email_subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Proposition FPSG – ..." />
        </div>
        <div>
          <label className="text-sm font-medium">Domaines (séparés par virgules)</label>
          <Input value={domain} onChange={(e)=>setDomain(e.target.value)} placeholder="Sûreté, HSE, ..." />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Secteurs (séparés par virgules)</label>
          <Input value={sectors} onChange={(e)=>setSectors(e.target.value)} placeholder="Retail, Industrie, ..." />
        </div>
        <div>
          <label className="text-sm font-medium">Formats (séparés par virgules)</label>
          <Input value={formats} onChange={(e)=>setFormats(e.target.value)} placeholder="Présentiel, Distanciel, ..." />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Audiences (séparées par virgules)</label>
        <Input value={audiences} onChange={(e)=>setAudiences(e.target.value)} placeholder="Agents, Managers, RH/HSE, ..." />
      </div>

      <div>
        <label className="text-sm font-medium">Corps e-mail</label>
        <Textarea rows={6} value={email_body} onChange={(e)=>setBody(e.target.value)} placeholder="Texte d'e-mail..." />
      </div>
      <div>
        <label className="text-sm font-medium">Script téléphone</label>
        <Textarea rows={6} value={speech_text} onChange={(e)=>setSpeech(e.target.value)} placeholder="Script d'appel..." />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={loading} onClick={()=>{ setName(""); setSubject(""); setBody(""); setSpeech(""); }}>Effacer</Button>
        <Button onClick={save} disabled={!canSave || loading}>Enregistrer pour l’équipe</Button>
      </div>
    </div>
  );
}
