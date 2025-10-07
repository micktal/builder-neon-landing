import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const domains = [
  "Sûreté",
  "Sécurité",
  "Gestion de conflit",
  "Prévention",
  "Management",
  "Secourisme",
];

const formats = ["Présentiel", "Distanciel", "Blended"];

const sectors = [
  "Retail",
  "Banque/Assurance",
  "Industrie",
  "Santé",
  "Éducation",
  "Administration",
];

const audiences = ["Agents", "Managers", "Direction", "RH", "Accueil"];

export default function NouvelleRecherche() {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState<string | null>(null);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [format, setFormat] = useState<string | null>(null);
  const [objectif, setObjectif] = useState<string>("");
  const navigate = useNavigate();

  const canNext1 = !!domain;
  const canNext2 = selectedAudiences.length > 0 || selectedSectors.length > 0;
  const canFinish = !!format && objectif.trim().length > 0;

  const handleFinish = () => {
    const params = new URLSearchParams();
    if (domain) params.set("domain", domain);
    if (selectedAudiences.length) params.set("audiences", selectedAudiences.join(","));
    if (selectedSectors.length) params.set("sectors", selectedSectors.join(","));
    if (format) params.set("format", format);
    if (objetif) params.set("objectif", objectif);
    navigate({ pathname: "/resultats", search: params.toString() });
  };

  return (
    <div className="container py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Nouvelle recherche</h1>
        <p className="text-muted-foreground mt-2">Assistant multi-étapes : domaine → public/secteur → format → objectif</p>
      </div>

      <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm mb-6">
        <li className={`rounded-full px-3 py-1 border ${step >= 1 ? "bg-primary text-primary-foreground border-primary" : ""}`}>1. Domaine</li>
        <li className={`rounded-full px-3 py-1 border ${step >= 2 ? "bg-primary text-primary-foreground border-primary" : ""}`}>2. Public & Secteur</li>
        <li className={`rounded-full px-3 py-1 border ${step >= 3 ? "bg-primary text-primary-foreground border-primary" : ""}`}>3. Format</li>
        <li className={`rounded-full px-3 py-1 border ${step >= 4 ? "bg-primary text-primary-foreground border-primary" : ""}`}>4. Objectif</li>
      </ol>

      {step === 1 && (
        <section className="rounded-xl border p-4 sm:p-6">
          <h2 className="font-semibold mb-3">Choisissez un domaine</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {domains.map((d) => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`rounded-md border px-3 py-2 text-sm hover:bg-accent ${domain === d ? "bg-primary text-primary-foreground border-primary" : ""}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={!canNext1}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-xl border p-4 sm:p-6">
          <h2 className="font-semibold mb-3">Public & Secteurs</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium mb-2">Public</div>
              <div className="flex flex-wrap gap-2">
                {audiences.map((a) => {
                  const active = selectedAudiences.includes(a);
                  return (
                    <button
                      key={a}
                      onClick={() =>
                        setSelectedAudiences((prev) =>
                          prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-sm hover:bg-accent ${active ? "bg-primary text-primary-foreground border-primary" : ""}`}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Secteurs</div>
              <div className="flex flex-wrap gap-2">
                {sectors.map((s) => {
                  const active = selectedSectors.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() =>
                        setSelectedSectors((prev) =>
                          prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-sm hover:bg-accent ${active ? "bg-primary text-primary-foreground border-primary" : ""}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(1)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Précédent</button>
            <button
              disabled={!canNext2}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-xl border p-4 sm:p-6">
          <h2 className="font-semibold mb-3">Format</h2>
          <div className="flex flex-wrap gap-2">
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`rounded-md border px-3 py-2 text-sm hover:bg-accent ${format === f ? "bg-primary text-primary-foreground border-primary" : ""}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(2)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Précédent</button>
            <button onClick={() => setStep(4)} disabled={!format} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50">Suivant</button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="rounded-xl border p-4 sm:p-6">
          <h2 className="font-semibold mb-3">Objectif</h2>
          <textarea
            value={objectif}
            onChange={(e) => setObjectif(e.target.value)}
            placeholder="Ex: Sensibiliser les équipes magasin aux risques de démarque inconnue"
            className="w-full min-h-[100px] rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(3)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Précédent</button>
            <button
              disabled={!canFinish}
              onClick={handleFinish}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Voir résultats
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
