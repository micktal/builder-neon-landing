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
            <Route path="/resultats" element={<Placeholder title="Résultats" description="Affichage des formations, prospects et templates filtrés. Nous pourrons brancher les données et filtres dynamiques ensuite." />} />
            <Route path="/prospects" element={<Placeholder title="Prospects" description="Liste, fiches et ajout/édition des prospects." />} />
            <Route path="/formations" element={<Placeholder title="Formations" description="Catalogue FPSG avec filtres et fiches détaillées." />} />
            <Route path="/templates" element={<Placeholder title="Templates" description="Modèles de speechs et e-mails, prêts à copier/coller." />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
