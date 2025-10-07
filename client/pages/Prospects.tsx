import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search as SearchIcon, Plus, Upload, Download, Mail, Eye, Clipboard, Filter, Info } from "lucide-react";

import { useEffect } from "react";
import { fetchBuilderContent } from "@/services/builder";

interface Contact { name: string; role: string; email: string; phone?: string }
interface Prospect {
  id?: string;
  company_name: string;
  entity_type?: string;
  sector: string;
  size_band?: string;
  region: string;
  sites_count?: number;
  contacts: Contact[];
  training_history?: string;
  budget_hint?: string;
  priority_score: number;
  preferred_format?: string;
  notes?: string;
}

const EMPTY: Prospect[] = [];

const SECTORS = ["Industrie", "Santé", "Retail/Luxe", "Transport", "BTP", "Tertiaire", "Public", "Éducation"] as const;
const REGIONS = ["IDF", "PACA", "ARA", "HDF", "NA", "GE", "Bretagne", "Normandie", "Occitanie", "Corse"] as const;
const SIZES = ["1–49", "50–249", "250–999", "1000+"] as const;

export default function Prospects() {
  const { toast } = useToast();

  // Data
  const [data, setData] = useState<Prospect[]>(EMPTY);

  // Filters
  const [q, setQ] = useState("");
  const [fSector, setFSector] = useState<string | "">("");
  const [fRegion, setFRegion] = useState<string | "">("");
  const [fSize, setFSize] = useState<string | "">("");
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(100);

  // Selection & pagination
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Load
  useEffect(() => {
    (async () => {
      const { items } = await fetchBuilderContent<Prospect>("prospects", { limit: 200, cacheBust: true });
      setData(items);
    })();
  }, []);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    return (data || EMPTY).filter((p) => {
      const matchText = !search || [
        p.company_name,
        p.contacts[0]?.name,
        p.notes || "",
      ].join(" ").toLowerCase().includes(search);
      const matchSector = !fSector || p.sector === fSector;
      const matchRegion = !fRegion || p.region === fRegion;
      const matchSize = !fSize || (p.size_band || "") === fSize;
      const matchScore = p.priority_score >= scoreMin && p.priority_score <= scoreMax;
      return matchText && matchSector && matchRegion && matchSize && matchScore;
    });
  }, [q, fSector, fRegion, fSize, scoreMin, scoreMax]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const items = filtered.slice(start, start + perPage);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) items.forEach((i) => (next[i.id] = true));
    setSelected(next);
  };

  const toggleOne = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const selectedRows = (data || EMPTY).filter((p) => p.id && selectedIds.includes(p.id));

  // CSV helpers
  const toCsv = (rows: Prospect[]) => {
    const headers = [
      "company_name","sector","region","size_band",
      "priority_score","preferred_format",
      "contact_name","contact_role","contact_email","contact_phone",
      "training_history","notes",
    ];
    const escape = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/\r?\n/g, " ").replace(/"/g, '""');
      return `"${s}"`;
    };
    const lines = [headers.join(",")];
    rows.forEach((r) => {
      const c0: Partial<Contact> = Array.isArray(r.contacts) && r.contacts.length ? r.contacts[0] : {};
      lines.push([
        r.company_name, r.sector, r.region, r.size_band || "",
        r.priority_score ?? "", r.preferred_format || "",
        c0.name || "", c0.role || "", c0.email || "", c0.phone || "",
        r.training_history || "", r.notes || "",
      ].map(escape).join(","));
    });
    return lines.join("\n");
  };
  const downloadCsv = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.style.display = "none";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const exportSelection = () => {
    if (!selectedRows.length) { toast({ title: "Sélectionnez au moins 1 prospect" }); return; }
    const csv = toCsv(selectedRows);
    downloadCsv(`prospects_selection_${new Date().toISOString().slice(0,10)}.csv`, csv);
    toast({ title: "✅ Export de la sélection prêt" });
  };
  const exportFiltered = () => {
    const csv = toCsv(filtered);
    if (!filtered.length) { toast({ title: "Aucun résultat à exporter" }); return; }
    downloadCsv(`prospects_filtres_${new Date().toISOString().slice(0,10)}.csv`, csv);
    toast({ title: "✅ Export des résultats prêt" });
  };

  const copy = async (label: string, text: string) => {
    try { await navigator.clipboard.writeText(text); toast({ title: `${label} copié` }); } catch { toast({ title: "Échec de la copie" }); }
  };

  const exportCSV = (rows: Prospect[]) => {
    const header = ["company_name","sector","region","size_band","contact_name","contact_role","email","priority_score"].join(",");
    const lines = rows.map((r) => [
      r.company_name,
      r.sector,
      r.region,
      r.size_band || "",
      r.contacts[0]?.name || "",
      r.contacts[0]?.role || "",
      r.contacts[0]?.email || "",
      r.priority_score,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "prospects.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const copyEmails = () => copy("E-mails", selectedRows.map((r) => r.contacts[0]?.email).filter(Boolean).join(";"));

  const summaryText = (p: Prospect) => `${p.company_name} — ${p.sector} / ${p.region}\nContact: ${p.contacts[0]?.name || ""} (${p.contacts[0]?.role || ""}) — ${p.contacts[0]?.email || ""}\nScore: ${p.priority_score}/100\nNotes: ${p.notes || "—"}`;

  const scoreBadge = (v: number) => {
    if (v <= 30) return "bg-blue-100 text-blue-700";
    if (v <= 70) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const resetFilters = () => { setQ(""); setFSector(""); setFRegion(""); setFSize(""); setScoreMin(0); setScoreMax(100); setPage(1); };

  return (
    <div className="container max-w-[1200px] px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900">Prospects <span className="text-sm font-normal text-slate-600">({total})</span></h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/prospects/new" className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm"><Plus className="h-4 w-4" /> Créer un prospect</Link>
          <Dialog>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"><Upload className="h-4 w-4"/> Importer CSV</button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer CSV</DialogTitle>
                <DialogDescription>À venir : import CSV pour créer/mettre à jour des prospects.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={exportSelection} disabled={selectedRows.length===0} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"><Download className="h-4 w-4"/> Exporter (sélection)</button>
            </TooltipTrigger>
            <TooltipContent>Sélectionnez au moins 1 prospect</TooltipContent>
          </Tooltip>
          <button onClick={exportFiltered} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"><Download className="h-4 w-4"/> Exporter (résultats filtrés)</button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
            <SearchIcon className="h-4 w-4 text-slate-500"/>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="w-full text-sm focus:outline-none" placeholder="Rechercher entreprise, contact, notes…" />
          </div>
          <select value={fSector} onChange={(e) => { setFSector(e.target.value); setPage(1); }} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
            <option value="">Secteur</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fRegion} onChange={(e) => { setFRegion(e.target.value); setPage(1); }} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
            <option value="">Région</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={fSize} onChange={(e) => { setFSize(e.target.value); setPage(1); }} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
            <option value="">Taille</option>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 whitespace-nowrap">Score: {scoreMin}–{scoreMax}</span>
            <input type="range" min={0} max={100} value={scoreMin} onChange={(e) => { setScoreMin(Number(e.target.value)); setPage(1); }} />
            <input type="range" min={0} max={100} value={scoreMax} onChange={(e) => { setScoreMax(Number(e.target.value)); setPage(1); }} />
          </div>
        </div>
        <div className="mt-3">
          <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"><Filter className="h-4 w-4"/> Réinitialiser filtres</button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left"><input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} /></th>
              <th className="p-3 text-left">Entreprise</th>
              <th className="p-3 text-left">Secteur</th>
              <th className="p-3 text-left">Région</th>
              <th className="p-3 text-left">Taille</th>
              <th className="p-3 text-left">Contact principal</th>
              <th className="p-3 text-left">E-mail</th>
              <th className="p-3 text-left">Score</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id || p.company_name} className="border-b hover:bg-gray-50">
                <td className="p-3"><input type="checkbox" checked={!!selected[p.id]} onChange={() => toggleOne(p.id)} /></td>
                <td className="p-3"><Link to={`/prospects/${p.id}`} className="text-blue-700 hover:underline">{p.company_name}</Link></td>
                <td className="p-3">{p.sector}</td>
                <td className="p-3">{p.region}</td>
                <td className="p-3">{p.size_band}</td>
                <td className="p-3">{p.contacts[0]?.name} {p.contacts[0]?.role ? `(${p.contacts[0]?.role})` : ""}</td>
                <td className="p-3">
                  <button onClick={() => p.contacts[0]?.email && navigator.clipboard.writeText(p.contacts[0].email).then(() => toast({ title: "E-mail copié" }))} className="underline text-blue-700">
                    {p.contacts[0]?.email}
                  </button>
                </td>
                <td className="p-3"><span className={`inline-flex rounded-full px-2 py-0.5 ${scoreBadge(p.priority_score)}`}>{p.priority_score}</span></td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Tooltip><TooltipTrigger asChild><Link to={`/prospects/${p.id}`} className="p-1 rounded hover:bg-gray-100" aria-label="Ouvrir"><Eye className="h-4 w-4"/></Link></TooltipTrigger><TooltipContent>Ouvrir fiche</TooltipContent></Tooltip>
                    {p.contacts[0]?.email && (
                      <Tooltip><TooltipTrigger asChild><a href={`mailto:${p.contacts[0].email}?subject=${encodeURIComponent('Prise de contact FPSG')}`} className="p-1 rounded hover:bg-gray-100" aria-label="Email"><Mail className="h-4 w-4"/></a></TooltipTrigger><TooltipContent>Mailto</TooltipContent></Tooltip>
                    )}
                    <Tooltip><TooltipTrigger asChild><button onClick={() => copy("Résumé", summaryText(p))} className="p-1 rounded hover:bg-gray-100" aria-label="Copier"><Clipboard className="h-4 w-4"/></button></TooltipTrigger><TooltipContent>Copier résumé</TooltipContent></Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden grid gap-3">
        {items.map((p) => (
          <div key={p.id || p.company_name} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">{p.company_name}</div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${scoreBadge(p.priority_score)}`}>{p.priority_score}</span>
            </div>
            <div className="text-xs text-slate-600">{p.sector} • {p.region} • {p.size_band}</div>
            <div className="mt-1 text-sm text-slate-700">{p.contacts[0]?.name} {p.contacts[0]?.role ? `(${p.contacts[0]?.role})` : ""} — <button onClick={() => p.contacts[0]?.email && navigator.clipboard.writeText(p.contacts[0].email).then(() => toast({ title: 'E-mail copié' }))} className="underline text-blue-700">{p.contacts[0]?.email}</button></div>
            {p.notes && <div className="mt-1 text-sm text-slate-600 line-clamp-2">{p.notes}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/prospects/${p.id}`} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm">Ouvrir</Link>
              {p.contacts[0]?.email && <a href={`mailto:${p.contacts[0].email}?subject=${encodeURIComponent('Prise de contact FPSG')}`} className="rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm">E-mail</a>}
              <button onClick={() => copy("Résumé", summaryText(p))} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm">Copier résumé</button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate-600">{total === 0 ? "Aucun prospect" : `${start + 1}–${Math.min(start + perPage, total)} sur ${total}`}</div>
        <div className="flex items-center gap-2">
          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm">
            {[10,25,50].map((n) => <option key={n} value={n}>{n}/page</option>)}
          </select>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page===1} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm disabled:opacity-50">Préc.</button>
            <div className="px-2 text-sm">Page {page}/{pageCount}</div>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page===pageCount} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm disabled:opacity-50">Suiv.</button>
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-[1200px] px-4 py-2 flex items-center justify-between">
            <div className="text-sm">{selectedRows.length} sélectionné(s)</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportSelection} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm"><Download className="h-4 w-4 inline mr-1"/> Exporter (sélection)</button>
              <button onClick={copyEmails} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm"><Mail className="h-4 w-4 inline mr-1"/> Copier e-mails</button>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm"><Info className="h-4 w-4 inline mr-1"/> Créer campagne e-mail</button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Campagne e-mail</DialogTitle>
                    <DialogDescription>Placeholder — configuration de campagne à venir.</DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-center text-slate-700">
          Aucun prospect trouvé
          <div className="mt-3">
            <Link to="/prospects/new" className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm">Créer un prospect</Link>
          </div>
        </div>
      )}
    </div>
  );
}
