import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleLTPHubData } from "./routes/ltp-hub";
import { handleAFEData } from "./routes/afe-data";
import { handleFileInfo } from "./routes/file-info";

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

  // Dashboard data endpoints
  app.get("/api/ltp-hub", handleLTPHubData);
  app.get("/api/afe-data", handleAFEData);
  app.get("/api/file-info", handleFileInfo);

  return app;
}
