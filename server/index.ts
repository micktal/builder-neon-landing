import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createProspect } from "./routes/prospects-create";
import { seedFormations } from "./routes/seed-formations";
import { listFormations } from "./routes/formations-list";
import { getFormation } from "./routes/formations-detail";
import { importFormations } from "./routes/import-formations";
import { listTemplates } from "./routes/templates-list";
import { importTemplates } from "./routes/import-templates";
import { createTemplate } from "./routes/templates-create";
import { listProspects } from "./routes/prospects-list";
import { aiCommercial } from "./routes/ai-commercial";
import { importProspects } from "./routes/import-prospects";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Create prospect (Builder CMS)
  app.post("/api/prospects", createProspect);

  // Seed formations (Builder CMS)
  app.post("/api/seed/formations", seedFormations);
  app.get("/api/seed/formations", seedFormations);

  // List formations (Builder CMS)
  app.get("/api/formations", listFormations);
  app.get("/api/formations/:id", getFormation);

  // Import formations from CSV
  app.post("/api/import/formations", importFormations);
  app.get("/api/import/formations", importFormations);

  // Templates endpoints
  app.get("/api/templates", listTemplates);
  app.post("/api/templates/create", createTemplate);
  app.post("/api/import/templates", importTemplates);
  app.get("/api/import/templates", importTemplates);

  // Prospects list (Builder CMS)
  app.get("/api/prospects", listProspects);

  // AI Assistant
  app.post("/api/ai/commercial", aiCommercial);

  return app;
}
