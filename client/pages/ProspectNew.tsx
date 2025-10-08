import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ENTITY_TYPES = [
  "Privé",
  "Administration",
  "Collectivité",
  "Établissement public",
  "École",
  "Hôpital",
] as const;

const SECTORS = [
  "Industrie",
  "Santé",
  "Retail",
  "Transport",
  "BTP",
  "Tertiaire",
  "Public",
  "Éducation",
] as const;

const SIZE_BANDS = ["1–49", "50–249", "250–999", "1000+"] as const;

const REGIONS = [
  "IDF",
  "PACA",
  "ARA",
  "Hauts-de-France",
  "NA",
  "GE",
  "Bretagne",
  "Normandie",
  "Occitanie",
  "Corse",
] as const;

const ROLES = ["RH", "HSE", "Acheteur", "Direction", "Autre"] as const;
const FORMATS = ["Présentiel", "Distanciel", "Blended", "E-learning"] as const;

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ProspectNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const q = useQuery();

  // General info
  const [company_name, setCompany] = useState("");
  const [entity_type, setEntityType] = useState<string | "">("");
  const [sector, setSector] = useState<string | "">("");
  const [size_band, setSizeBand] = useState<string | "">("");
  const [region, setRegion] = useState<string | "">("");
  const [sites_count, setSitesCount] = useState<number | "">("");

  // Contacts (repeater)
  const [contacts, setContacts] = useState([
    { contact_name: "", role: "", email: "", phone: "", linkedin: "" },
  ]);

  // History & needs
  const [training_history, setTrainingHistory] = useState("");
  const [notes, setNotes] = useState("");
  const [budget_hint, setBudgetHint] = useState("");
  const [preferred_format, setPreferredFormat] = useState<string | "">("");

  // Scoring
  const [priority_score, setPriorityScore] = useState<number>(50);

  // Prefill from query
  useEffect(() => {
    const qs = q.get("sector");
    const qr = q.get("region");
    const qd = q.get("domain");
    if (qs && !sector) setSector(qs);
    if (qr && !region) setRegion(qr);
    if (qd && !notes) setNotes((n) => n || `Intérêt possible pour le domaine: ${qd}`);
  }, [q, sector, region, notes]);

  const requiredOk = useMemo(() => {
    const c0 = contacts[0] ?? { contact_name: "", email: "" } as any;
    return (
      company_name.trim().length > 0 &&
      sector.trim().length > 0 &&
      c0.contact_name.trim().length > 0 &&
      c0.email.trim().length > 0
    );
  }, [company_name, sector, contacts]);

  const scoreLabel = useMemo(() => {
    if (priority_score <= 30) return { label: "Froid", color: "bg-blue-100 text-blue-700" } as const;
    if (priority_score <= 70) return { label: "Tiède", color: "bg-amber-100 text-amber-700" } as const;
    return { label: "Chaud", color: "bg-red-100 text-red-700" } as const;
  }, [priority_score]);

  const autoScore = () => {
    let s = 40;
    if (size_band === "1000+") s += 25;
    else if (size_band === "250–999") s += 15;
    else if (size_band === "50–249") s += 8;
    if (["Santé", "Retail", "Industrie"].includes(sector)) s += 10;
    if (preferred_format) s += 5;
    setPriorityScore(Math.max(0, Math.min(100, s)));
  };

  const copySummary = async () => {
    const c0 = contacts[0] || { contact_name: "", role: "", email: "" };
    const text = `Entreprise : ${company_name}\nSecteur : ${sector}\nRégion : ${region}\nContact : ${c0.contact_name} (${c0.role} – ${c0.email})\nBesoins : ${notes}\nScore : ${priority_score}/100`;
    try { await navigator.clipboard.writeText(text); toast({ title: "Résumé copié" }); } catch { toast({ title: "Impossible de copier" }); }
  };

  const openEmail = () => {
    const c0 = contacts[0] || { contact_name: "", email: "" };
    const subject = `Proposition de formation FPSG – ${company_name}`;
    const body = `Bonjour ${c0.contact_name},%0D%0AJe me permets de vous contacter au nom de FPSG (groupe Fiducial), centre de formation spécialisé en ${sector}. Nous accompagnons vos équipes sur des modules ${preferred_format || "au format adapté"} tels que ${training_history || "nos parcours adaptés"}.%0D%0ASeriez-vous disponible pour un échange rapide cette semaine ?%0D%0A%0D%0ACordialement,%0D{{your_name}} – FPSG`;
    const url = `mailto:${encodeURIComponent(c0.email)}?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = url;
  };

  const save = async () => {
    if (!requiredOk) { toast({ title: "Champs requis manquants" }); return; }
    try {
      const payload = {
        company_name,
        entity_type,
        sector,
        size_band,
        region,
        sites_count: sites_count === "" ? null : sites_count,
        contacts: contacts.map(c => ({
          name: c.contact_name,
          role: c.role,
          email: c.email,
          phone: c.phone,
          linkedin: c.linkedin,
        })),
        training_history,
        budget_hint,
        preferred_format,
        priority_score,
        notes,
      };
      const resp = await fetch("/api/prospects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await resp.json();
      if (!resp.ok || json?.error) throw new Error(json?.error || "Erreur serveur");
      toast({ title: "Prospect ajouté avec succès" });
      // navigate vers la liste
      // navigate("/prospects");
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Impossible d'enregistrer" });
    }
  };

  const setContactField = (idx: number, key: keyof typeof contacts[number], value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [key]: value } : c)));
  };

  return (
    <div className="container max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900">Nouveau prospect – FPSG Prospection</h1>
        <Link to="/dashboard" className="text-sm text-slate-700 underline-offset-4 hover:underline">← Dashboard</Link>
      </div>

      {/* Bloc 1 */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6 shadow-sm">
        <h2 className="text-[18px] sm:text-[22px] font-semibold text-slate-900 mb-3">Informations générales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Nom de l’entreprise / organisation *</label>
            <input value={company_name} onChange={(e) => setCompany(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Ex: ACME Santé" />
            <p className="mt-1 text-xs text-amber-600">⚠️ Vérifiez l’orthographe pour éviter les doublons.</p>
          </div>
          <div>
            <label className="text-sm font-medium">Type d’entité</label>
            <select value={entity_type} onChange={(e) => setEntityType(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">—</option>
              {ENTITY_TYPES.map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Secteur *</label>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">—</option>
              {SECTORS.map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Taille</label>
            <select value={size_band} onChange={(e) => setSizeBand(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">—</option>
              {SIZE_BANDS.map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Région</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">—</option>
              {REGIONS.map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Nombre de sites (si connu)</label>
            <input type="number" value={sites_count} onChange={(e) => setSitesCount(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
        </div>
      </section>

      {/* Bloc 2 */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-[18px] sm:text-[22px] font-semibold text-slate-900 mb-1">Contact principal</h2>
        <p className="text-xs text-slate-600 mb-3">Décideur ou interlocuteur principal</p>
        {contacts.map((c, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Nom & prénom *</label>
              <input value={c.contact_name} onChange={(e) => setContactField(idx, "contact_name", e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Ex: Claire Dupont" />
            </div>
            <div>
              <label className="text-sm font-medium">Rôle</label>
              <select value={c.role} onChange={(e) => setContactField(idx, "role", e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">—</option>
                {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">E-mail *</label>
              <input type="email" value={c.email} onChange={(e) => setContactField(idx, "email", e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="nom@entreprise.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Téléphone</label>
              <input type="tel" value={c.phone} onChange={(e) => setContactField(idx, "phone", e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="+33..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">LinkedIn (URL)</label>
              <input type="url" value={c.linkedin} onChange={(e) => setContactField(idx, "linkedin", e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        ))}
        <button onClick={() => setContacts((prev) => [...prev, { contact_name: "", role: "", email: "", phone: "", linkedin: "" }])} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">+ Ajouter un autre contact</button>
      </section>

      {/* Bloc 3 */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-[18px] sm:text-[22px] font-semibold text-slate-900 mb-1">Historique & besoins</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Prestataire actuel ou formations précédentes</label>
              <textarea rows={4} value={training_history} onChange={(e) => setTrainingHistory(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Historique formation..." />
            </div>
            <div>
              <label className="text-sm font-medium">Commentaires internes, besoins exprimés, difficultés rencontrées</label>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Notes internes..." />
            </div>
            <div>
              <label className="text-sm font-medium">Budget annuel formation (estimé ou inconnu)</label>
              <input value={budget_hint} onChange={(e) => setBudgetHint(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Ex: 30k€ / Inconnu" />
            </div>
            <div>
              <label className="text-sm font-medium">Format préféré</label>
              <select value={preferred_format} onChange={(e) => setPreferredFormat(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">—</option>
                {FORMATS.map((f) => (<option key={f} value={f}>{f}</option>))}
              </select>
            </div>
          </div>
        </div>
        <aside className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-900 mb-2">Astuce</div>
          <p className="text-sm text-slate-600">Plus les besoins sont précis, plus l’IA proposera des speechs ciblés.</p>
        </aside>
      </section>

      {/* Bloc 4 */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-[18px] sm:text-[22px] font-semibold text-slate-900 mb-1">Priorité commerciale</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <input type="range" min={0} max={100} value={priority_score} onChange={(e) => setPriorityScore(Number(e.target.value))} className="w-full" />
            <div className="mt-1 text-sm text-slate-700">Score: {priority_score}/100</div>
          </div>
          <div className={`inline-flex h-9 items-center justify-center rounded-full px-3 text-sm ${scoreLabel.color}`}>{scoreLabel.label}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={autoScore} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Calculer score automatique</button>
          <button onClick={copySummary} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Copier résumé prospect</button>
          <button onClick={openEmail} className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm">Générer e-mail prise de contact</button>
        </div>
      </section>

      {/* Aperçu */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-900 mb-2">Aperçu prospect</div>
        <div className="text-sm text-slate-700">
          {company_name || "—"} – {sector || "—"} – {region || "—"}
          <div>Contact : {(contacts[0]?.contact_name || "—")} ({contacts[0]?.role || "—"})</div>
          <div>Besoin : {notes || "—"}</div>
        </div>
      </section>

      {/* Sticky actions */}
      <div className="h-16" />
      <div className="fixed sm:static left-0 right-0 bottom-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 sm:p-0">
        <div className="max-w-[900px] mx-auto flex items-center justify-between gap-2">
          <button onClick={() => navigate('/dashboard')} className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">Annuler</button>
          <div className="flex gap-2">
            <button onClick={save} disabled={!requiredOk} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50">Enregistrer le prospect</button>
            <button onClick={openEmail} className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">Générer un e-mail de prise de contact</button>
          </div>
        </div>
      </div>
    </div>
  );
}
