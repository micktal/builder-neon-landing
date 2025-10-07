import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const DOMAINS = [
  "Sûreté",
  "Gestion de conflit",
  "Prévention HSE",
  "Management",
  "Secourisme",
  "Accueil",
  "E-learning",
];

const AUDIENCES = [
  "Agents",
  "Managers",
  "RH/HSE",
  "Accueil",
  "Santé",
  "Logistique",
  "Luxe/Retail",
  "Tertiaire",
];

const SECTORS = [
  "Industrie",
  "Santé",
  "Retail/Luxe",
  "Transport",
  "BTP",
  "Tertiaire",
  "Public",
  "Éducation",
];

const FORMATS = ["Présentiel", "Distanciel", "Blended", "E-learning"] as const;
const USE_CASES = [
  "Découverte",
  "Relance salon",
  "Audit",
  "Renouvellement",
  "Cross-sell",
] as const;

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
];

export default function NouvelleRecherche() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // States
  const [currentStep, setCurrentStep] = useState<number>(1); // 1..5
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const steps = [
    { id: 1, label: "Domaine" },
    { id: 2, label: "Public & Secteur" },
    { id: 3, label: "Format" },
    { id: 4, label: "Objectif" },
    { id: 5, label: "Résumé" },
  ];

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case 1:
        return !!selectedDomain;
      case 2:
        return selectedAudiences.length > 0 || selectedSectors.length > 0;
      case 3:
        return !!selectedFormat;
      case 4:
        return !!selectedUseCase;
      case 5:
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedDomain, selectedAudiences, selectedSectors, selectedFormat, selectedUseCase]);

  const progress = (currentStep / steps.length) * 100;

  const resetAll = () => {
    setSelectedDomain(null);
    setSelectedAudiences([]);
    setSelectedSectors([]);
    setSelectedRegion(null);
    setSelectedFormat(null);
    setSelectedUseCase(null);
    setCurrentStep(1);
  };

  const goNext = () => {
    if (!canContinue) return;
    if (currentStep < 5) setCurrentStep((s) => s + 1);
  };
  const goPrev = () => setCurrentStep((s) => Math.max(1, s - 1));

  const seeResults = () => {
    const params = new URLSearchParams();
    if (selectedDomain) params.set("domain", selectedDomain);
    if (selectedAudiences.length) params.set("audiences", selectedAudiences.join(","));
    if (selectedSectors.length) params.set("sectors", selectedSectors.join(","));
    if (selectedRegion) params.set("region", selectedRegion);
    if (selectedFormat) params.set("format", selectedFormat);
    if (selectedUseCase) params.set("useCase", selectedUseCase);
    navigate({ pathname: "/resultats", search: params.toString() });
  };

  const copyFilters = async () => {
    const payload = {
      domain: selectedDomain ?? "",
      audiences: selectedAudiences.join(","),
      sectors: selectedSectors.join(","),
      region: selectedRegion ?? "",
      format: selectedFormat ?? "",
      useCase: selectedUseCase ?? "",
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast({ title: "Filtres copiés" });
    } catch {
      toast({ title: "Impossible de copier" });
    }
  };

  return (
    <div className="container max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top bar: back + stepper controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="text-sm text-slate-700 hover:text-slate-900 underline-offset-4 hover:underline">← Retour Dashboard</Link>
          <button onClick={resetAll} className="text-sm text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline">Reset</button>
        </div>

        <h1 className="text-[22px] sm:text-[28px] font-extrabold tracking-tight text-slate-900">Nouvelle recherche — Assistant de prospection</h1>

        {/* Stepper */}
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
              {steps.map((s, idx) => {
                const isActive = currentStep === s.id;
                const isDone = currentStep > s.id;
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${isActive ? "bg-blue-600 text-white border-blue-600" : isDone ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-slate-700 border-gray-200"}`}>
                      {s.id}
                    </div>
                    <div className={`text-sm ${isActive ? "text-slate-900 font-medium" : "text-slate-600"}`}>{s.label}</div>
                    {idx < steps.length - 1 && <div className="hidden sm:block mx-3 h-px w-12 bg-gray-200" />}
                  </div>
                );
              })}
            </div>
            <div className="relative w-full sm:w-52 h-2 rounded bg-gray-100 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main card + sidebar tips */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          {currentStep === 1 && (
            <Step1
              selectedDomain={selectedDomain}
              onSelect={setSelectedDomain}
              onCancel={() => navigate('/dashboard')}
              onNext={goNext}
              canContinue={canContinue}
            />
          )}
          {currentStep === 2 && (
            <Step2
              selectedAudiences={selectedAudiences}
              setSelectedAudiences={setSelectedAudiences}
              selectedSectors={selectedSectors}
              setSelectedSectors={setSelectedSectors}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
              onPrev={goPrev}
              onNext={goNext}
              canContinue={canContinue}
            />
          )}
          {currentStep === 3 && (
            <Step3
              selectedFormat={selectedFormat}
              onSelect={setSelectedFormat}
              onPrev={goPrev}
              onNext={goNext}
              canContinue={canContinue}
            />
          )}
          {currentStep === 4 && (
            <Step4
              selectedUseCase={selectedUseCase}
              onSelect={setSelectedUseCase}
              onPrev={goPrev}
              onNext={goNext}
              canContinue={canContinue}
            />
          )}
          {currentStep === 5 && (
            <Step5
              data={{ selectedDomain, selectedAudiences, selectedSectors, selectedRegion, selectedFormat, selectedUseCase }}
              onBackTo={(n) => setCurrentStep(n)}
              onCopy={copyFilters}
              onSeeResults={seeResults}
            />
          )}
        </section>

        <aside className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <Tips currentStep={currentStep} />
          <div className="mt-6">
            <PreviewMini />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Step1({ selectedDomain, onSelect, onCancel, onNext, canContinue }: {
  selectedDomain: string | null;
  onSelect: (v: string) => void;
  onCancel: () => void;
  onNext: () => void;
  canContinue: boolean;
}) {
  return (
    <div>
      <h2 className="text-[18px] sm:text-[22px] font-semibold text-slate-900">Choisissez le domaine</h2>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DOMAINS.map((d) => {
          const active = selectedDomain === d;
          return (
            <button
              key={d}
              onClick={() => onSelect(d)}
              className={`text-left rounded-xl border px-3 py-3 text-sm transition shadow-sm hover:shadow ${active ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-slate-800 border-gray-200 hover:bg-gray-100"}`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 text-xs text-slate-600">
        Exemples de modules: gestion de conflits clients, situations agressives, médiation (placeholder).
      </div>

      <div className="h-16" />
      <MobileSticky>
        <div className="flex items-center justify-between gap-2">
          <button onClick={onCancel} className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">Annuler</button>
          <button onClick={onNext} disabled={!canContinue} className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">Suivant</button>
        </div>
      </MobileSticky>
    </div>
  );
}

function Step2({ selectedAudiences, setSelectedAudiences, selectedSectors, setSelectedSectors, selectedRegion, setSelectedRegion, onPrev, onNext, canContinue }: {
  selectedAudiences: string[];
  setSelectedAudiences: (v: string[]) => void;
  selectedSectors: string[];
  setSelectedSectors: (v: string[]) => void;
  selectedRegion: string | null;
  setSelectedRegion: (v: string | null) => void;
  onPrev: () => void;
  onNext: () => void;
  canContinue: boolean;
}) {
  const toggle = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);
  };

  return (
    <div>
      <h2 className="text-[18px] sm:text-[22px] font-semibold text-slate-900">Public et secteur visés</h2>

      <div className="mt-4">
        <div className="text-sm font-medium text-slate-900 mb-2">Audiences</div>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((a) => {
            const active = selectedAudiences.includes(a);
            return (
              <button key={a} onClick={() => toggle(selectedAudiences, setSelectedAudiences, a)} className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-slate-700 border-gray-200 hover:bg-gray-200"}`}>{a}</button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm font-medium text-slate-900 mb-2">Secteurs</div>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => {
            const active = selectedSectors.includes(s);
            return (
              <button key={s} onClick={() => toggle(selectedSectors, setSelectedSectors, s)} className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-slate-700 border-gray-200 hover:bg-gray-200"}`}>{s}</button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <label className="text-sm font-medium text-slate-900 mb-1 block">Région (optionnelle)</label>
        <select value={selectedRegion ?? ""} onChange={(e) => setSelectedRegion(e.target.value || null)} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">—</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 text-xs text-slate-600">Ces critères aideront à suggérer des prospects et templates pertinents.</div>

      <div className="h-16" />
      <MobileSticky>
        <div className="flex items-center justify-between gap-2">
          <button onClick={onPrev} className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">Précédent</button>
          <button onClick={onNext} disabled={!canContinue} className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">Suivant</button>
        </div>
      </MobileSticky>
    </div>
  );
}

function Step3({ selectedFormat, onSelect, onPrev, onNext, canContinue }: {
  selectedFormat: string | null;
  onSelect: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canContinue: boolean;
}) {
  return (
    <div>
      <h2 className="text-[18px] sm:text-[22px] font-semibold text-slate-900">Format de formation</h2>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FORMATS.map((f) => {
          const active = selectedFormat === f;
          return (
            <button key={f} onClick={() => onSelect(f)} className={`rounded-xl border px-3 py-3 text-sm transition shadow-sm hover:shadow ${active ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-slate-800 border-gray-200 hover:bg-gray-100"}`}>
              {f}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-600">Présentiel = ateliers concrets ; Distanciel = visio ; Blended = mix ; E-learning = asynchrone.</p>

      <div className="h-16" />
      <MobileSticky>
        <div className="flex items-center justify-between gap-2">
          <button onClick={onPrev} className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">Précédent</button>
          <button onClick={onNext} disabled={!canContinue} className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">Suivant</button>
        </div>
      </MobileSticky>
    </div>
  );
}

function Step4({ selectedUseCase, onSelect, onPrev, onNext, canContinue }: {
  selectedUseCase: string | null;
  onSelect: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canContinue: boolean;
}) {
  return (
    <div>
      <h2 className="text-[18px] sm:text-[22px] font-semibold text-slate-900">Objectif du contact</h2>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {USE_CASES.map((u) => {
          const active = selectedUseCase === u;
          return (
            <button key={u} onClick={() => onSelect(u)} className={`rounded-xl border px-3 py-3 text-sm transition shadow-sm hover:shadow ${active ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-slate-800 border-gray-200 hover:bg-gray-100"}`}>
              {u}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-600">Cet objectif permettra de proposer des speechs et e-mails adaptés.</p>

      <div className="h-16" />
      <MobileSticky>
        <div className="flex items-center justify-between gap-2">
          <button onClick={onPrev} className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">Précédent</button>
          <button onClick={onNext} disabled={!canContinue} className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">Suivant</button>
        </div>
      </MobileSticky>
    </div>
  );
}

function Step5({ data, onBackTo, onCopy, onSeeResults }: {
  data: { selectedDomain: string | null; selectedAudiences: string[]; selectedSectors: string[]; selectedRegion: string | null; selectedFormat: string | null; selectedUseCase: string | null };
  onBackTo: (n: number) => void;
  onCopy: () => void;
  onSeeResults: () => void;
}) {
  const items: { label: string; value: string; step: number }[] = [
    { label: "Domaine", value: data.selectedDomain ?? "—", step: 1 },
    { label: "Audiences", value: data.selectedAudiences.join(", ") || "—", step: 2 },
    { label: "Secteurs", value: data.selectedSectors.join(", ") || "—", step: 2 },
    { label: "Région", value: data.selectedRegion ?? "—", step: 2 },
    { label: "Format", value: data.selectedFormat ?? "—", step: 3 },
    { label: "Objectif", value: data.selectedUseCase ?? "—", step: 4 },
  ];

  return (
    <div>
      <h2 className="text-[18px] sm:text-[22px] font-semibold text-slate-900">Votre sélection</h2>
      <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm divide-y">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between p-3">
            <div>
              <div className="text-sm text-slate-500">{it.label}</div>
              <div className="text-sm font-medium text-slate-900">{it.value}</div>
            </div>
            <button onClick={() => onBackTo(it.step)} className="text-sm text-blue-700 hover:underline">Modifier</button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={onCopy} className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">Copier les filtres</button>
        <button onClick={onSeeResults} className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium">Voir les résultats</button>
      </div>
    </div>
  );
}

function Tips({ currentStep }: { currentStep: number }) {
  const content = {
    1: "Exemples de modules par domaine (placeholder).",
    2: "Astuce : ciblez 1–2 audiences max au départ.",
    3: "Comparaison rapide des formats.",
    4: "Exemples d'objets d'e-mail par objectif (placeholder).",
    5: "La page Résultats affichera formations, prospects et templates filtrés.",
  } as Record<number, string>;
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900 mb-2">Aide</div>
      <p className="text-sm text-slate-600">{content[currentStep]}</p>
    </div>
  );
}

function PreviewMini() {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900 mb-2">Aperçu instantané</div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2"><span>Formations compatibles (exemple)</span><span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-slate-700">Pré-filtré</span></div>
        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2"><span>Prospects possibles</span><span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-slate-700">Pré-filtré</span></div>
        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2"><span>Templates suggérés</span><span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-slate-700">Pré-filtré</span></div>
      </div>
    </div>
  );
}

function MobileSticky({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed sm:static left-0 right-0 bottom-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 sm:p-0">
      <div className="max-w-[900px] mx-auto">{children}</div>
    </div>
  );
}
