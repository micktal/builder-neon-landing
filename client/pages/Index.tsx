import { Link } from "react-router-dom";
import { Search, Building2, GraduationCap, FileText } from "lucide-react";

export default function Index() {
  return (
    <div className="bg-gradient-to-b from-accent/40 to-background">
      <section className="container pt-10 sm:pt-14 pb-10">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              FPSG Prospection Assistant
            </h1>
            <p className="mt-4 text-muted-foreground max-w-prose">
              Plateforme interne pour les commerciaux FPSG du groupe Fiducial. Recherchez des prospects, filtrez les formations et générez des speechs/e-mails adaptés — rapidement, depuis mobile ou ordinateur.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/nouvelle-recherche"
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow hover:bg-primary/90"
              >
                <Search className="h-4 w-4" /> Démarrer une recherche
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Ouvrir le dashboard
              </Link>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Feature icon={<GraduationCap className="h-5 w-5" />} title="Formations filtrables" text="Par domaine, public, secteur et format (présentiel / distanciel / blended)." />
              <Feature icon={<Building2 className="h-5 w-5" />} title="Prospects ciblés" text="Affichage par secteur et localisation. Ajout/édition depuis l'interface." />
              <Feature icon={<FileText className="h-5 w-5" />} title="Templates prêts" text="Speechs commerciaux et e-mails contextualisés, prêts à copier/coller." />
              <Feature icon={<Search className="h-5 w-5" />} title="Assistant guidé" text="Domaine → public/secteur → format → objectif → résultats." />
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-12">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Accès rapides</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Quick to="/nouvelle-recherche" icon={<Search className="h-5 w-5" />} title="Nouvelle recherche" />
          <Quick to="/prospects" icon={<Building2 className="h-5 w-5" />} title="Prospects" />
          <Quick to="/formations" icon={<GraduationCap className="h-5 w-5" />} title="Formations" />
          <Quick to="/templates" icon={<FileText className="h-5 w-5" />} title="Templates" />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{text}</div>
      </div>
    </div>
  );
}

function Quick({ to, icon, title }: { to: string; icon: React.ReactNode; title: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 text-card-foreground hover:shadow-lg transition"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div className="font-medium">{title}</div>
    </Link>
  );
}
