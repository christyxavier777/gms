import { Router } from "express";
import { buildLivenessReport, getReadinessReport } from "../health/service";

// Health endpoint for uptime and readiness checks.
export const healthRouter = Router();

healthRouter.get("/health/live", (_req, res) => {
  res.status(200).json(buildLivenessReport());
});

healthRouter.get("/health/ready", async (_req, res) => {
  const report = await getReadinessReport();
  res.status(report.status === "ok" ? 200 : 503).json(report);
});

healthRouter.get("/health", async (_req, res) => {
  const report = await getReadinessReport();
  res.status(report.status === "ok" ? 200 : 503).json({
    status: report.status,
    service: report.service,
    timestamp: report.timestamp,
    database: report.dependencies.database.status,
    cache: report.dependencies.cache.status,
    dependencies: report.dependencies,
  });
});
