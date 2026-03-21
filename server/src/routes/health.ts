import { Router } from "express";
import { createPrismaClient } from "../prisma/client";

// Health endpoint for uptime and readiness checks.
export const healthRouter = Router();
const prisma = createPrismaClient();

healthRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "up" });
  } catch {
    res.status(503).json({ status: "degraded", database: "down" });
  }
});
