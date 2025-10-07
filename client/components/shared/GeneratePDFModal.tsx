import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fetchBuilderContent } from "@/services/builder";
import { generateProposalPDF } from "@/lib/pdf";

interface Contact { name?: string; email?: string; phone?: string; role?: string }
interface Prospect { company_name: string; sector?: string; region?: string; contacts?: Contact[] }
interface Formation { title: string; domain?: string; duration?: string; format?: string[]; audiences?: string[]; sectors?: string[]; objectives?: string; price_estimate?: string }
interface Template { template_name: string; use_case?: string; domain_filter?: string[]; sector_filter?: string[]; format_filter?: string[]; email_body?: string }

export default function GeneratePDFModal({ open, onClose, context, initialFormation, initialProspect, initialTemplates, initialProspects }: {
  open: boolean;
  onClose: () => void;
  context: 'formation' | 'prospect';
  initialFormation?: Formation | null;
  initialProspect?: Prospect | null;
  initialTemplates?: Template[] | null;
  initialProspects?: Prospect[] | null;
}) {
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects || []);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates || []);
  const [formations, setFormations] = useState<Formation[]>([]);

  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(context==='prospect' ? (initialProspect || null) : null);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(context==='formation' ? (initialFormation || null) : null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [qProspect, setQProspect] = useState("");
  const [qFormation, setQFormation] = useState("");
  const [costInput, setCostInput] = useState("");

  const [yourName, setYourName] = useState<string>(() => localStorage.getItem("fpsg_user_name") || "");
  const [yourEmail, setYourEmail] = useState<string>(() => localStorage.getItem("fpsg_user_email") || "");
  const [yourPhone, setYourPhone] = useState<string>(() => localStorage.getItem("fpsg_user_phone") || "");

  useEffect(() => {
    if (!initialTemplates) {
      (async () => {
        const t = await fetch('/api/templates?limit=200').then(r=>r.json()).catch(()=>({items:[]}));
        setTemplates(Array.isArray(t?.items) ? t.items.map((x:any)=>x.data) : []);
      })();
    }
    if (!initialProspects) {
      (async () => {
        const { items } = await fetchBuilderContent<Prospect>('prospects', { limit: 200, cacheBust: true });
        setProspects(items);
      })();
    }
    if (context === 'prospect') {
      (async () => {
        const f = await fetch('/api/formations?limit=200').then(r=>r.json()).catch(()=>({items:[]}));
        setFormations(Array.isArray(f?.items) ? f.items.map((x:any)=>x.data) : []);
      })();
    }
  }, [context, initialTemplates, initialProspects]);

  useEffect(() => {
    if (context==='formation' && initialFormation && !initialFormation.price_estimate) setCostInput("");
  }, [context, initialFormation?.price_estimate]);

  const filteredProspects = useMemo(() => {
    const s = qProspect.toLowerCase();
    return prospects.filter(p => !s || `${p.company_name} ${p.sector||''} ${p.region||''}`.toLowerCase().includes(s));
  }, [prospects, qProspect]);

  const filteredFormations = useMemo(() => {
    const s = qFormation.toLowerCase();
    return formations.filter((f:any) => !s || `${f.title} ${f.domain||''}`.toLowerCase().includes(s));
  }, [formations, qFormation]);

  // Auto contact for selected prospect
  useEffect(() => {
    if (selectedProspect) setSelectedContact((selectedProspect.contacts||[])[0] || null);
  }, [selectedProspect?.company_name]);

  const domain = (selectedFormation?.domain || initialFormation?.domain || "");
  const format0 = Array.isArray(selectedFormation?.format || initialFormation?.format) ? (selectedFormation?.format || initialFormation?.format)![0] : (selectedFormation?.format || initialFormation?.format || "") as any;
  const sector = selectedProspect?.sector || initialProspect?.sector || "";

  const filteredTemplates = useMemo(() => {
    return (templates||[]).filter((t) =>
      (!t.domain_filter || t.domain_filter.includes(String(domain))) &&
      (!t.format_filter || t.format_filter.includes(String(format0))) &&
      (!sector || !t.sector_filter || (t.sector_filter || []).includes(String(sector)))
    );
  }, [templates, domain, format0, sector]);

  const canGenerate = () => {
    if (context==='formation') return !!(selectedProspect && (initialFormation || selectedFormation));
    return !!(selectedFormation && (initialProspect || selectedProspect));
  };

  const onGenerate = async () => {
    if (!canGenerate()) return;
    try {
      const formation = (context==='formation' ? (initialFormation || selectedFormation) : selectedFormation)!;
      const prospect = (context==='formation' ? selectedProspect : (initialProspect || selectedProspect))!;
      const contact = selectedContact || (prospect.contacts && prospect.contacts[0]) || null;
      const sales = { yourName, yourEmail, yourPhone };

      localStorage.setItem('fpsg_user_name', yourName || '');
      localStorage.setItem('fpsg_user_email', yourEmail || '');
      localStorage.setItem('fpsg_user_phone', yourPhone || '');

      await generateProposalPDF({
        formation,
        prospect,
        contact,
        template: selectedTemplate || null,
        sales,
        costOverride: (!formation.price_estimate || !String(formation.price_estimate).trim()) ? (costInput || undefined) : undefined,
      });
      toast({ title: '✅ Proposition PDF générée' });
      onClose();
    } catch (e:any) {
      toast({ title: e?.message || 'Erreur lors de la génération PDF' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v)=>!v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>🧾 Générer proposition PDF</DialogTitle>
          <DialogDescription>Combine la formation, le prospect et un template d'accroche pour créer une proposition PDF mise en page.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {context==='formation' ? (
            <div>
              <label className="text-sm font-medium">Prospect</label>
              <Input value={qProspect} onChange={(e)=>setQProspect(e.target.value)} placeholder="Rechercher prospect…" className="mt-1"/>
              <select className="mt-2 w-full rounded-md border px-3 py-2 text-sm" value={selectedProspect ? selectedProspect.company_name : ''} onChange={(e)=>setSelectedProspect(filteredProspects.find(p=>p.company_name===e.target.value) || null)}>
                <option value="">— Choisir —</option>
                {filteredProspects.map((p,i)=> <option key={i} value={p.company_name}>{p.company_name} ��� {p.sector||'—'} / {p.region||'—'}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <div className="text-sm text-slate-600"><span className="font-medium">Prospect:</span> {initialProspect?.company_name}</div>
            </div>
          )}

          {context==='prospect' ? (
            <div>
              <label className="text-sm font-medium">Formation</label>
              <Input value={qFormation} onChange={(e)=>setQFormation(e.target.value)} placeholder="Rechercher formation…" className="mt-1"/>
              <select className="mt-2 w-full rounded-md border px-3 py-2 text-sm" value={selectedFormation ? selectedFormation.title : ''} onChange={(e)=>setSelectedFormation(filteredFormations.find((f:any)=>f.title===e.target.value) || null)}>
                <option value="">— Choisir —</option>
                {filteredFormations.map((f:any,i:number)=> <option key={i} value={f.title}>{f.title} {f.domain ? `(${f.domain})` : ''}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <div className="text-sm text-slate-600"><span className="font-medium">Formation:</span> {initialFormation?.title}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Contact – nom</label>
              <Input value={selectedContact?.name || ''} onChange={(e)=>setSelectedContact({ ...(selectedContact||{}), name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Contact – e-mail</label>
              <Input value={selectedContact?.email || ''} onChange={(e)=>setSelectedContact({ ...(selectedContact||{}), email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Contact – téléphone</label>
              <Input value={selectedContact?.phone || ''} onChange={(e)=>setSelectedContact({ ...(selectedContact||{}), phone: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Template (accroche – optionnel)</label>
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={selectedTemplate?.template_name || ''} onChange={(e)=>setSelectedTemplate(filteredTemplates.find(t=>t.template_name===e.target.value) || null)}>
              <option value="">— Aucun —</option>
              {filteredTemplates.map((t,i)=> <option key={i} value={t.template_name}>{t.template_name} {t.use_case ? `(${t.use_case})` : ''}</option>)}
            </select>
          </div>

          {(!initialFormation?.price_estimate || !String(initialFormation?.price_estimate).trim()) && (
            <div>
              <label className="text-sm font-medium">Coût indicatif</label>
              <Input value={costInput} onChange={(e)=>setCostInput(e.target.value)} placeholder="ex. à partir de 2 900 € HT" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Votre nom</label>
              <Input value={yourName} onChange={(e)=>setYourName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Votre e-mail</label>
              <Input value={yourEmail} onChange={(e)=>setYourEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Votre téléphone</label>
              <Input value={yourPhone} onChange={(e)=>setYourPhone(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={onGenerate} disabled={!canGenerate()}>Générer PDF</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
