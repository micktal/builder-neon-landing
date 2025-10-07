import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createProspect } from "./routes/prospects-create";
import { seedFormations } from "./routes/seed-formations";
import { listFormations } from "./routes/formations-list";
import { getFormation } from "./routes/formations-detail";
import { importFormations } from "./routes/import-formations";

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

  return app;
}
