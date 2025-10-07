import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NouvelleRecherche from "./pages/NouvelleRecherche";
import Placeholder from "./pages/Placeholder";
import ProspectNew from "./pages/ProspectNew";
import Prospects from "./pages/Prospects";
import Resultats from "./pages/Resultats";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nouvelle-recherche" element={<NouvelleRecherche />} />
            <Route path="/resultats" element={<Resultats />} />
            <Route path="/prospects" element={<Prospects />} />
            <Route path="/formations" element={<Placeholder title="Formations" description="Catalogue FPSG avec filtres et fiches détaillées." />} />
            <Route path="/formations/:id" element={<FormationDetail />} />
            <Route path="/templates" element={<Placeholder title="Templates" description="Modèles de speechs et e-mails, prêts à copier/coller." />} />
            <Route path="/prospects/new" element={<ProspectNew />} />
            <Route path="/formations/new" element={<Placeholder title="Nouvelle formation" description="Formulaire de création à venir." />} />
            <Route path="/templates/new" element={<Placeholder title="Nouveau template" description="Formulaire de création à venir." />} />
            <Route path="/aide" element={<Placeholder title="Aide" description="Documentation et bonnes pratiques (prochainement)." />} />
            <Route path="/legal" element={<Placeholder title="Mentions légales" />} />
            <Route path="/privacy" element={<Placeholder title="Confidentialité" />} />
            <Route path="/support" element={<Placeholder title="Support" description="Contactez l'équipe interne." />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
