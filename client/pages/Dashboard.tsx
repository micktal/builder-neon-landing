import UnifiedCard from "@/components/UnifiedCard";
import { Search, Building2, GraduationCap, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="container py-8 sm:py-10">
      <section className="mb-8 sm:mb-12">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Préparez vos rendez-vous en quelques clics
            </h1>
            <p className="mt-3 text-muted-foreground max-w-prose">
              Identifiez, qualifiez et contactez de nouveaux clients pour les formations FPSG (sûreté, sécurité, gestion de conflit, prévention, management, secourisme).
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/nouvelle-recherche"
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow hover:bg-primary/90 focus:ring-2 focus:ring-ring"
              >
                <Search className="h-4 w-4" /> Nouvelle recherche
              </Link>
              <Link
                to="/formations"
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                <GraduationCap className="h-4 w-4" /> Voir les formations
              </Link>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="text-sm text-muted-foreground mb-2">Astuce</div>
            <p className="text-sm leading-relaxed">
              Utilisez l'assistant multi-étapes pour choisir le domaine, le public/secteur, le format et l'objectif. Nous vous proposerons automatiquement des formations pertinentes, des prospects correspondants et des modèles de speech/e-mail prêts à copier.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Accès rapides</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <UnifiedCard
            to="/nouvelle-recherche"
            title="Nouvelle recherche"
            description="Assistant guidé par étapes"
            icon={<Search className="h-5 w-5" />}
          />
          <UnifiedCard
            to="/prospects"
            title="Prospects"
            description="Entreprises cibles et contacts"
            icon={<Building2 className="h-5 w-5" />}
          />
          <UnifiedCard
            to="/formations"
            title="Formations"
            description="Catalogue FPSG filtrable"
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <UnifiedCard
            to="/templates"
            title="Templates"
            description="Speechs et e-mails prêts à l'emploi"
            icon={<FileText className="h-5 w-5" />}
          />
        </div>
      </section>
    </div>
  );
}
