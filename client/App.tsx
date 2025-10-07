import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NouvelleRecherche from "./pages/NouvelleRecherche";
import Placeholder from "./pages/Placeholder";
import ProspectNew from "./pages/ProspectNew";
import Prospects from "./pages/Prospects";
import FormationDetail from "./pages/FormationDetail";
import ProspectDetail from "./pages/ProspectDetail";
import Resultats from "./pages/Resultats";
import Formations from "./pages/Formations";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import EspaceFormationInterne from "./pages/EspaceFormationInterne";

const App = () => (
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
          <Route path="/prospects/:id" element={<ProspectDetail />} />
          <Route path="/formations" element={<Formations />} />
          <Route path="/formations/:id" element={<FormationDetail />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/espace-formation-interne" element={<EspaceFormationInterne />} />
          <Route path="/prospects/new" element={<ProspectNew />} />
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
);

createRoot(document.getElementById("root")!).render(<App />);
