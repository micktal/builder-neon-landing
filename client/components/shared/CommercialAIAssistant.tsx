import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Prospect = { company_name: string; sector?: string; region?: string; notes?: string };

export default function CommercialAIAssistant({ prospect, formation, templates }: { prospect?: Prospect | null; formation?: any | null; templates?: any[] | null }) {
  const { toast } = useToast();
  const [aiMode, setAiMode] = useState<"analyze"|"suggest_template"|"write_email"|"summarize">("suggest_template");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [tpls, setTpls] = useState<any[]>(templates || []);

  useEffect(() => {
    if (!templates) {
      (async () => {
        const t = await fetch('/api/templates?limit=200').then(r=>r.json()).catch(()=>({items:[]}));
        setTpls(Array.isArray(t?.items) ? t.items.map((x:any)=>x.data) : []);
      })();
    }
  }, [templates]);

  const launch = async () => {
    setIsLoading(true); setAiResponse("");
    try {
      const res = await fetch('/api/ai/commercial', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: aiMode, prospect, formation, templates: tpls, prompt: promptInput })
      });
      const json = await res.json();
      if (!res.ok || json?.error) throw new Error(json?.error || 'Erreur IA');
      setAiResponse(String(json.result || ''));
    } catch (e:any) {
      toast({ title: e?.message || 'Erreur IA' });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">🤖 Assistant IA Commercial FPSG</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-1">
          <div className="text-xs text-slate-600 mb-1">Mode</div>
          <select value={aiMode} onChange={(e)=>setAiMode(e.target.value as any)} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="analyze">Analyser le prospect</option>
            <option value="suggest_template">Suggérer un template</option>
            <option value="write_email">Rédiger un e-mail</option>
            <option value="summarize">Résumer l’échange</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs text-slate-600 mb-1">Contexte (optionnel)</div>
          <Textarea value={promptInput} onChange={(e)=>setPromptInput(e.target.value)} placeholder="Ajoutez un contexte : appel, besoin, objection…" rows={3} />
        </div>
        <div className="md:col-span-1 flex gap-2">
          <Button className="mt-6 w-full" disabled={isLoading} onClick={launch}>{isLoading ? '⏳ Analyse…' : 'Lancer'}</Button>
        </div>
      </div>
      <div className="mt-3">
        <Textarea readOnly value={aiResponse} placeholder="Résultat IA affiché ici…" rows={10} />
      </div>
    </div>
  );
}
