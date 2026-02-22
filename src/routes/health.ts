import { Router } from "express";

// Health endpoint for uptime and readiness checks.
export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
