import { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

type ModuleKey = never;

const MODULES: { key: ModuleKey; title: string; desc: string; sections: { title: string; content: string }[] }[] = [];

type ProgressState = Partial<Record<any, { completed: boolean; notes?: string }>>;
const LS_KEY = "fpsg_internal_training_progress";

export default function EspaceFormationInterne() {
  const { toast } = useToast();
  const [progress, setProgress] = useState<ProgressState>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
  });
  const total = MODULES.length;
  const done = useMemo(() => Object.values(progress).filter(v => v?.completed).length, [progress]);
  const pct = total ? Math.round((done / total) * 100) : 0;

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(progress || {})); }, [progress]);

  const resetAll = () => setProgress({});

  return (
    <div className="container max-w-[1100px] px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900">Espace Formation Interne FPSG</h1>
        {total > 0 ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Progression: {done}/{total} ({pct}%)</Badge>
            <Progress value={pct} className="w-[160px]" />
            <Button variant="outline" onClick={resetAll}>Réinitialiser</Button>
          </div>
        ) : null}
      </div>

      <p className="mt-2 text-sm text-slate-600">Mini e-learning interne pour commerciaux.</p>

      {total === 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="text-sm text-slate-700">Aucun module de formation listé pour le moment.</div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800"><BookOpen className="h-4 w-4"/> Astuce: transformez une proposition récente en support d'entraînement (lecture + reformulation en 60s).</div>
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
