import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type Prospect = { company_name: string; sector?: string; region?: string; contacts?: { name?: string; email?: string }[] };
type Template = { template_name: string; use_case?: string; domain_filter?: string[]; sector_filter?: string[]; format_filter?: string[]; audience_filter?: string[]; email_subject?: string; email_body?: string };
type ComposePreset = { templateName?: string; subject?: string; body?: string };

export default function ComposeEmailModal({ open, onClose, context, defaultUseCase, preset }: { open: boolean; onClose: () => void; context?: { formation?: { title?: string; duration?: string; format?: string | string[]; domain?: string }, prospect?: Prospect }; defaultUseCase?: string; preset?: ComposePreset; }) {
  const { toast } = useToast();
  const [openCompose, setOpenCompose] = useState<boolean>(open);
  useEffect(() => setOpenCompose(open), [open]);
  const close = () => { setOpenCompose(false); onClose?.(); };

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [searchProspect, setSearchProspect] = useState("");
  const [searchTemplate, setSearchTemplate] = useState("");

  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(context?.prospect ?? null);
  const [selectedContact, setSelectedContact] = useState<{ name?: string; email?: string } | null>(context?.prospect?.contacts?.[0] || null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [yourName, setYourName] = useState<string>(() => localStorage.getItem("fpsg_user_name") || "");
  const [yourEmail, setYourEmail] = useState<string>(() => localStorage.getItem("fpsg_user_email") || "");
  const [lockBody, setLockBody] = useState<boolean>(false);
  const [pendingTemplateName, setPendingTemplateName] = useState<string | null>(null);
  const [hasAppliedPreset, setHasAppliedPreset] = useState<boolean>(false);

  useEffect(() => { localStorage.setItem("fpsg_user_name", yourName || ""); }, [yourName]);
  useEffect(() => { localStorage.setItem("fpsg_user_email", yourEmail || ""); }, [yourEmail]);

  useEffect(() => {
    (async () => {
      const p = await fetch('/api/prospects?limit=200').then(r => r.json()).catch(() => ({ items: [] }));
      const t = await fetch('/api/templates?limit=200').then(r => r.json()).catch(() => ({ items: [] }));
      setProspects(Array.isArray(p?.items) ? p.items.map((x: any) => x.data) : []);
      setTemplates(Array.isArray(t?.items) ? t.items.map((x: any) => x.data) : []);
    })();
  }, []);

  const filteredProspects = useMemo(() => {
    const s = searchProspect.toLowerCase();
    const list = prospects || [];
    const arr = list.filter((p) => !s || `${p.company_name} ${p.sector || ''} ${p.region || ''}`.toLowerCase().includes(s));
    return arr;
  }, [prospects, searchProspect]);

  useEffect(() => {
    if (!selectedProspect && filteredProspects.length && context?.prospect) {
      setSelectedProspect(context.prospect);
      setSelectedContact(context.prospect.contacts?.[0] || null);
    }
  }, [filteredProspects.length]);

  const formation = context?.formation;
  const format0 = Array.isArray(formation?.format) ? (formation?.format as string[])[0] : (formation?.format as string | undefined);

  const filteredTemplates = useMemo(() => {
    const s = searchTemplate.toLowerCase();
    return (templates || []).filter((t) => {
      if (defaultUseCase && t.use_case && t.use_case !== defaultUseCase) return false;
      if (formation?.domain && t.domain_filter && !t.domain_filter.includes(formation.domain)) return false;
      if (selectedProspect?.sector && t.sector_filter && !t.sector_filter.includes(String(selectedProspect.sector))) return false;
      if (format0 && t.format_filter && !t.format_filter.includes(String(format0))) return false;
      if (s) {
        const hay = `${t.template_name} ${t.use_case || ''} ${(t.domain_filter || []).join(' ')} ${(t.sector_filter || []).join(' ')} ${(t.format_filter || []).join(' ')}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [templates, searchTemplate, defaultUseCase, formation?.domain, selectedProspect?.sector, format0]);

  const vars = useMemo(() => ({
    company_name: selectedProspect?.company_name || '',
    sector: selectedProspect?.sector || '',
    region: selectedProspect?.region || '',
    contact_name: selectedContact?.name || '',
    formation_title: formation?.title || '',
    duration: formation?.duration || '',
    format: Array.isArray(formation?.format) ? (formation?.format as string[]).join(', ') : (formation?.format || ''),
    domain: formation?.domain || '',
    your_name: yourName || '',
    your_email: yourEmail || '',
  }), [selectedProspect?.company_name, selectedProspect?.sector, selectedProspect?.region, selectedContact?.name, formation?.title, formation?.duration, formation?.format, formation?.domain, yourName, yourEmail]);

  function applyPlaceholders(text?: string) {
    const s = String(text || "");
    return s
      .replaceAll('{{company_name}}', vars.company_name)
      .replaceAll('{{sector}}', vars.sector)
      .replaceAll('{{region}}', vars.region)
      .replaceAll('{{contact_name}}', vars.contact_name)
      .replaceAll('{{formation_title}}', vars.formation_title)
      .replaceAll('{{duration}}', vars.duration)
      .replaceAll('{{format}}', vars.format)
      .replaceAll('{{domain}}', vars.domain)
      .replaceAll('{{your_name}}', vars.your_name)
      .replaceAll('{{your_email}}', vars.your_email);
  }

  function renderTemplate(t?: Template | null) {
    const base = t || selectedTemplate;
    if (!base) return;
    const newSubject = applyPlaceholders(base.email_subject || 'Proposition FPSG — {{company_name}}');
    if (!lockBody) setBody(applyPlaceholders(base.email_body || ''));
    setSubject(newSubject);
  }

  useEffect(() => { if (selectedTemplate) renderTemplate(selectedTemplate); }, [selectedTemplate, vars]);
  useEffect(() => { if (selectedProspect) setSelectedContact(selectedProspect.contacts?.[0] || null); }, [selectedProspect?.company_name]);

  const canSend = !!selectedContact?.email && !!subject && !!body;

  const onCopy = async () => {
    if (!selectedContact?.email) { toast({ title: 'Sélectionnez un contact' }); return; }
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast({ title: '✅ Copié' });
  };

  const onMailto = () => {
    if (!canSend) return;
    const url = `mailto:${encodeURIComponent(String(selectedContact?.email))}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  return (
    <Dialog open={openCompose} onOpenChange={(v) => { if (!v) close(); else setOpenCompose(true); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Composer un e-mail</DialogTitle>
          <DialogDescription>Choisissez un prospect et un template, puis personnalisez.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Prospect column */}
          <div>
            <div className="text-sm font-medium">Prospect</div>
            <Input value={searchProspect} onChange={(e) => setSearchProspect(e.target.value)} placeholder="Rechercher un prospect…" className="mt-2" />
            <select className="mt-2 w-full rounded-md border px-3 py-2 text-sm" value={selectedProspect ? selectedProspect.company_name : ''} onChange={(e) => {
              const p = filteredProspects.find(pp => pp.company_name === e.target.value) || null;
              setSelectedProspect(p);
            }}>
              <option value="">— Choisir —</option>
              {filteredProspects.map((p) => (
                <option key={p.company_name} value={p.company_name}>{p.company_name} — {p.sector || '—'} / {p.region || '—'}</option>
              ))}
            </select>
            <div className="grid grid-cols-1 gap-2 mt-3">
              <Input value={selectedContact?.name || ''} onChange={(e) => setSelectedContact({ ...(selectedContact || {}), name: e.target.value })} placeholder="Nom contact" />
              <Input value={selectedContact?.email || ''} onChange={(e) => setSelectedContact({ ...(selectedContact || {}), email: e.target.value })} placeholder="Email contact" />
            </div>
          </div>

          {/* Template column */}
          <div>
            <div className="text-sm font-medium">Template</div>
            <Input value={searchTemplate} onChange={(e) => setSearchTemplate(e.target.value)} placeholder="Rechercher un template…" className="mt-2" />
            <select className="mt-2 w-full rounded-md border px-3 py-2 text-sm" value={selectedTemplate?.template_name || ''} onChange={(e) => {
              const t = filteredTemplates.find(tt => tt.template_name === e.target.value) || null;
              setSelectedTemplate(t);
            }}>
              <option value="">— Choisir —</option>
              {filteredTemplates.map((t) => (
                <option key={t.template_name} value={t.template_name}>{t.template_name}{t.use_case ? ` (${t.use_case})` : ''}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 mt-3">
              <Checkbox id="lockBody" checked={lockBody} onCheckedChange={(v) => setLockBody(Boolean(v))} />
              <label htmlFor="lockBody" className="text-sm">Ne pas écraser mon corps si je change de template</label>
            </div>
            <Button variant="outline" className="mt-2" onClick={() => renderTemplate()}>Régénérer à partir du template</Button>
          </div>

          {/* Preview & vars */}
          <div>
            <div className="text-sm font-medium">Aperçu & variables</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <Input value={yourName} onChange={(e) => setYourName(e.target.value)} placeholder="Votre nom" />
              <Input value={yourEmail} onChange={(e) => setYourEmail(e.target.value)} placeholder="Votre e-mail" />
            </div>
            <div className="mt-2">
              <div className="text-xs text-slate-600">Aperçu mailto (lecture seule)</div>
              <Input readOnly value={`mailto:${selectedContact?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`} />
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium">Sujet</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium">Corps</label>
              <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={onCopy}>Copier</Button>
          <Button onClick={onMailto} disabled={!canSend} title={!canSend ? 'Sélectionnez un e-mail + sujet + corps' : ''}>Ouvrir dans e-mail</Button>
          <Button variant="outline" onClick={close}>Enregistrer brouillon</Button>
          <Button variant="outline" onClick={close}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
