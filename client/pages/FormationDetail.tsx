import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { fetchBuilderContent, fetchBuilderItem } from "@/services/builder";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Link as LinkIcon, Mail, Printer, ArrowLeft } from "lucide-react";

interface Prospect { company_name: string; sector?: string; region?: string; priority_score?: number; contacts?: { name?: string; email?: string }[] }
interface Template { template_name: string; use_case?: string; domain_filter?: string[]; sector_filter?: string[]; format_filter?: string[]; email_subject?: string; email_body?: string; speech_text?: string }

export default function FormationDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useToast();
  const [formation, setFormation] = useState<any | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const item = await fetchBuilderItem<any>("formations", id);
      setFormation(item);
      const [{ items: ps }, { items: ts }] = await Promise.all([
        fetchBuilderContent<Prospect>("prospects", { limit: 200, cacheBust: true }),
        fetchBuilderContent<Template>("templates", { limit: 200, cacheBust: true }),
      ]);
      setProspects(ps);
      setTemplates(ts);
    })();
  }, [id]);

  const compatibleProspects = useMemo(() => {
    if (!formation?.sectors) return [] as Prospect[];
    const sectors = (formation.sectors as string[]) || [];
    return prospects.filter((p) => sectors.includes(String(p.sector))).slice(0, 3);
  }, [prospects, formation?.sectors]);

  const teaserCopy = async () => {
    if (!formation?.teaser_url) return;
    await navigator.clipboard.writeText(formation.teaser_url);
    toast({ title: "Lien teaser copié ✅" });
  };

  const doPrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      const after = () => { setPrintMode(false); window.removeEventListener("afterprint", after as any); };
      window.addEventListener("afterprint", after as any);
      window.print();
    }, 50);
  };

  if (!formation) {
    return (
      <div className="container px-4 sm:px-6 py-8">
        <div className="text-sm text-slate-600">Chargement…</div>
      </div>
    );
  }

  const title = formation.title as string;
  const domain = formation.domain as string;
  const duration = formation.duration as string;
  const formats = (formation.format as string[]) || [];
  const audiences = (formation.audiences as string[]) || [];
  const sectors = (formation.sectors as string[]) || [];
  const objectives = formation.objectives as string;
  const keywords = (formation.keywords as string[]) || [];
  const pdf = formation.pdf_brochure as string | undefined;
  const teaser = formation.teaser_url as string | undefined;

  return (
    <div className={`container max-w-[1200px] px-4 sm:px-6 py-6 sm:py-8 ${printMode ? "print:pt-0" : ""}`}>
      {/* Top actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Link to="/formations" className="inline-flex items-center gap-1 text-sm text-slate-700 hover:underline"><ArrowLeft className="h-4 w-4"/> Retour</Link>
          <h1 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tooltip><TooltipTrigger asChild><a href={pdf || undefined} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${pdf ? "hover:bg-gray-50" : "opacity-50 pointer-events-none"}`}><ExternalLink className="h-4 w-4"/> Voir plaquette</a></TooltipTrigger><TooltipContent>{pdf ? "Ouvrir PDF" : "Non disponible"}</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={teaserCopy} disabled={!teaser} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${teaser ? "hover:bg-gray-50" : "opacity-50"}`}><LinkIcon className="h-4 w-4"/> Copier teaser</button></TooltipTrigger><TooltipContent>{teaser ? "Copier lien" : "Non disponible"}</TooltipContent></Tooltip>
          <EmailProposalButton formation={formation} templates={templates} prospects={prospects} />
          <Tooltip><TooltipTrigger asChild><button onClick={doPrint} className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm"><Printer className="h-4 w-4"/> Exporter en PDF</button></TooltipTrigger><TooltipContent>Export PDF</TooltipContent></Tooltip>
        </div>
      </div>

      {/* Subtitle */}
      <div className="mt-2 text-sm text-slate-600 print:hidden">
        <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[11px]">{domain}</span>
        <span className="mx-2">·</span>
        <span>{duration || "Durée à préciser"}</span>
        <span className="mx-2">·</span>
        <span>{formats.join(", ")}</span>
      </div>

      {/* Two columns */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2">
          {/* Audiences / sectors / keywords */}
          <div className="flex flex-wrap gap-2 print:hidden">
            {audiences.map((a) => (<span key={a} className="rounded-full bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 text-[11px]">{a}</span>))}
            {sectors.map((s) => (<span key={s} className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px]">{s}</span>))}
            {keywords.map((k) => (<span key={k} className="rounded-full bg-gray-100 text-slate-700 border border-gray-200 px-2 py-0.5 text-[11px]">{k}</span>))}
          </div>

          <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Objectifs pédagogiques</h2>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeRich(objectives) }} />
          </section>

          {/* Printable header */}
          {printMode && (
            <div className="mt-6 print:block hidden">
              <div className="text-center text-sm text-slate-700">FPSG — Formation • {new Date().toLocaleDateString()}</div>
            </div>
          )}

          {/* Printable body */}
          {printMode && (
            <section className="mt-4 border-t pt-4 print:block hidden">
              <div className="text-xl font-bold">{title}</div>
              <div className="text-sm text-slate-700">{domain} • {duration} • {formats.join(", ")}</div>
              <div className="mt-3 text-sm">Audiences: {audiences.join(", ") || "—"}</div>
              <div className="text-sm">Secteurs: {sectors.join(", ") || "—"}</div>
              <div className="mt-3" dangerouslySetInnerHTML={{ __html: sanitizeRich(objectives) }} />
              {pdf && <div className="mt-3 text-sm">Brochure: {pdf}</div>}
              <div className="mt-6 text-xs text-slate-500">Astuce : choisissez « Enregistrer au format PDF » dans la boîte d’impression.</div>
            </section>
          )}
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Ressources</h3>
            <div className="space-y-2">
              <a href={pdf || undefined} target="_blank" rel="noreferrer" className={`block rounded-md border px-3 py-2 text-sm ${pdf ? "hover:bg-gray-50" : "opacity-50 pointer-events-none"}`}>Plaquette PDF</a>
              <button onClick={teaserCopy} disabled={!teaser} className={`block w-full text-left rounded-md border px-3 py-2 text-sm ${teaser ? "hover:bg-gray-50" : "opacity-50"}`}>Copier lien teaser</button>
            </div>
          </section>
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Prospects compatibles</h3>
            <ul className="space-y-2">
              {compatibleProspects.map((p, i) => (
                <li key={i} className="text-sm flex items-center justify-between">
                  <span>{p.company_name}</span>
                  <span className="text-xs text-slate-600">{p.region || "—"} • {p.priority_score ?? "—"}</span>
                </li>
              ))}
              {compatibleProspects.length === 0 && <li className="text-sm text-slate-600">Aucun prospect</li>}
            </ul>
            {sectors[0] && <Link to={`/prospects?sector=${encodeURIComponent(sectors[0])}`} className="mt-3 inline-block rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Voir tous les prospects</Link>}
          </section>
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Templates suggérés</h3>
            <div className="flex flex-wrap gap-2">
              {templates.map((t, i) => (
                <EmailProposalButton key={i} asBadge formation={formation} templates={[t]} prospects={prospects} presetTemplate={t} />
              ))}
            </div>
          </section>
        </aside>
      </div>

      <style>{`@media print { header, footer, nav { display: none !important; } body { -webkit-print-color-adjust: exact; color-adjust: exact; } .print\\:hidden{ display: none !important } .print\\:block{ display: block !important } }`}</style>
    </div>
  );
}

function sanitizeRich(input?: string) { return (input || "\").replace(/<script[^>]*>[\s\S]*?<\\/script>/gi, \""); }

function EmailProposalButton({ asBadge, formation, templates, prospects, presetTemplate }: { asBadge?: boolean; formation: any; templates: Template[]; prospects: Prospect[]; presetTemplate?: Template }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [prospectId, setProspectId] = useState<number>(-1);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [tplName, setTplName] = useState<string>(presetTemplate?.template_name || "");
  const [yourName, setYourName] = useState("");
  const [yourEmail, setYourEmail] = useState("");

  const domain = String(formation?.domain || "");
  const format0 = String((Array.isArray(formation?.format) ? formation.format[0] : formation?.format) || "");

  const filteredProspects = useMemo(() => {
    const s = search.toLowerCase();
    return prospects.filter((p) => !s || `${p.company_name} ${p.sector || ""} ${p.region || ""}`.toLowerCase().includes(s));
  }, [search, prospects]);

  const selectedProspect = filteredProspects[prospectId] as Prospect | undefined;

  useEffect(() => {
    if (selectedProspect) {
      setContactName(selectedProspect.contacts?.[0]?.name || contactName);
      setContactEmail(selectedProspect.contacts?.[0]?.email || contactEmail);
    }
  }, [prospectId]);

  const filteredTemplates = useMemo(() => {
    const list = templates.filter((t) =>
      (!t.domain_filter || t.domain_filter.includes(domain)) &&
      (!t.format_filter || t.format_filter.includes(format0)) &&
      (!selectedProspect?.sector || !t.sector_filter || (t.sector_filter || []).includes(String(selectedProspect.sector)))
    );
    return list.length ? list : (templates.length ? [templates[0]] : []);
  }, [templates, domain, format0, selectedProspect?.sector]);

  useEffect(() => {
    if (presetTemplate?.template_name) setTplName(presetTemplate.template_name);
  }, [presetTemplate?.template_name]);

  const currentTemplate = filteredTemplates.find((t) => t.template_name === tplName) || filteredTemplates[0];

  const subject = (currentTemplate?.email_subject || `Proposition — ${formation?.title || "Formation FPSG"}`);
  const bodyRaw = (currentTemplate?.email_body || `Bonjour {{contact_name}},\nJe vous propose la formation \"{{formation_title}}\" ({{format}}).\nCordialement,\n{{your_name}} — {{your_email}}`);

  const replace = (s: string) => s
    .replaceAll("{{company_name}}", String(selectedProspect?.company_name || ""))
    .replaceAll("{{sector}}", String(selectedProspect?.sector || ""))
    .replaceAll("{{region}}", String(selectedProspect?.region || ""))
    .replaceAll("{{contact_name}}", contactName)
    .replaceAll("{{formation_title}}", String(formation?.title || ""))
    .replaceAll("{{duration}}", String(formation?.duration || ""))
    .replaceAll("{{format}}", String((Array.isArray(formation?.format) ? formation.format.join(", ") : formation?.format) || ""))
    .replaceAll("{{domain}}", String(formation?.domain || ""))
    .replaceAll("{{your_name}}", yourName)
    .replaceAll("{{your_email}}", yourEmail);

  const copyEmail = async () => {
    await navigator.clipboard.writeText(`Subject: ${replace(subject)}\n\n${replace(bodyRaw)}`);
    toast({ title: "E-mail copié" });
  };

  const mailto = () => {
    const url = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(replace(subject))}&body=${encodeURIComponent(replace(bodyRaw))}`;
    window.location.href = url;
  };

  if (asBadge) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-full bg-gray-100 text-slate-700 border border-gray-200 px-2 py-0.5 text-[11px]">{presetTemplate?.use_case || presetTemplate?.template_name || "Template"}</button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"><Mail className="h-4 w-4"/> Envoyer proposition e-mail</button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Proposition e-mail</DialogTitle>
          <DialogDescription>Sélectionnez un prospect et un template, puis personnalisez le message.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Prospect</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="mt-1 w-full rounded-md border px-3 py-2 text-sm"/>
            <select value={prospectId} onChange={(e) => setProspectId(Number(e.target.value))} className="mt-2 w-full rounded-md border px-3 py-2 text-sm">
              <option value={-1}>— Choisir —</option>
              {filteredProspects.map((p, idx) => (
                <option key={idx} value={idx}>{p.company_name} — {p.sector || "—"} / {p.region || "—"}</option>
              ))}
            </select>
            {selectedProspect && (
              <div className="mt-2 text-xs text-slate-600">Secteur: {selectedProspect.sector || "—"} • Région: {selectedProspect.region || "—"} • Score: {selectedProspect.priority_score ?? "—"}</div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Contact</label>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nom contact" className="mt-1 w-full rounded-md border px-3 py-2 text-sm"/>
            </div>
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@domaine.com" className="mt-1 w-full rounded-md border px-3 py-2 text-sm"/>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Template</label>
            <select value={tplName} onChange={(e) => setTplName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              {filteredTemplates.map((t, i) => (<option key={i} value={t.template_name}>{t.template_name} {t.use_case ? `(${t.use_case})` : ""}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <input value={replace(subject)} onChange={() => {}} readOnly className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-gray-50"/>
            </div>
            <div>
              <label className="text-sm font-medium">Body</label>
              <textarea value={replace(bodyRaw)} onChange={() => {}} rows={12} className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-gray-50"/>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={yourName} onChange={(e) => setYourName(e.target.value)} placeholder="Votre nom" className="w-full rounded-md border px-3 py-2 text-sm"/>
            <input value={yourEmail} onChange={(e) => setYourEmail(e.target.value)} placeholder="Votre e-mail" className="w-full rounded-md border px-3 py-2 text-sm"/>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={copyEmail} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Copier e-mail</button>
            <button onClick={mailto} className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm">Ouvrir dans e-mail</button>
            <button onClick={() => setOpen(false)} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Enregistrer comme brouillon</button>
            <button onClick={() => setOpen(false)} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Annuler</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
