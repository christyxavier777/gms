import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { recentLimitQuerySchema } from "../dashboard/schemas";
import { getAdminDashboard, getMemberDashboard, getTrainerDashboard } from "../dashboard/service";

// Read-only role-specific dashboard endpoints.
export const dashboardRouter = Router();

dashboardRouter.get("/dashboard/admin", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const dashboard = await getAdminDashboard();
  res.status(200).json({ dashboard });
});

dashboardRouter.get("/dashboard/trainer", requireAuth, requireRole(Role.TRAINER), async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const query = recentLimitQuerySchema.parse(req.query);
    const dashboard = await getTrainerDashboard(req.auth.userId, query.limit);
    res.status(200).json({ dashboard });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
    }
    throw error;
  }
});

dashboardRouter.get("/dashboard/member", requireAuth, requireRole(Role.MEMBER), async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const query = recentLimitQuerySchema.parse(req.query);
    const dashboard = await getMemberDashboard(req.auth.userId, query.limit);
    res.status(200).json({ dashboard });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
    }
    throw error;
  }
});
