import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { recentLimitQuerySchema } from "../dashboard/schemas";
import { getAdminDashboard, getMemberDashboard, getTrainerDashboard } from "../dashboard/service";
import { buildDashboardCacheKey, getDashboardCache, setDashboardCache } from "../dashboard/cache";
import { getPerformanceSnapshot, getSloSnapshot } from "../observability/perf-metrics";
import { getCacheSnapshot } from "../observability/cache-metrics";
import { getBusinessFlowSnapshot } from "../observability/business-flow-metrics";
import { getWearableWebhookAuditSnapshot } from "../observability/wearable-webhook-metrics";
import { cleanupWearableWebhookAuditEvents } from "../observability/wearable-webhook-retention";
import { env } from "../config/env";

// Read-only role-specific dashboard endpoints.
export const dashboardRouter = Router();

dashboardRouter.get("/dashboard/admin", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const cacheKey = buildDashboardCacheKey("admin", "global");
  const cached = await getDashboardCache<Awaited<ReturnType<typeof getAdminDashboard>>>(cacheKey);
  const dashboard = cached ?? (await getAdminDashboard());
  if (!cached) {
    await setDashboardCache(cacheKey, dashboard);
  }
  res.status(200).json({ dashboard });
});

dashboardRouter.get("/dashboard/admin/performance", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const requestedLimit = Number(req.query.limit ?? 30);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 30;
  const metrics = getPerformanceSnapshot(limit);
  const slo = getSloSnapshot();
  const cache = getCacheSnapshot();
  const flows = getBusinessFlowSnapshot(Math.min(25, limit));
  res.status(200).json({ metrics, slo, cache, flows });
});

dashboardRouter.get("/dashboard/admin/integrations/wearables/audit", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const requestedWindow = Number(req.query.windowMinutes ?? 60);
  const windowMinutes = Number.isFinite(requestedWindow) ? Math.min(1440, Math.max(1, requestedWindow)) : 60;
  const audit = await getWearableWebhookAuditSnapshot(windowMinutes);
  res.status(200).json({ audit });
});

dashboardRouter.post("/dashboard/admin/integrations/wearables/audit/cleanup", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const requestedRetention = Number(req.query.retentionDays ?? env.wearableAuditRetentionDays);
  const retentionDays = Number.isFinite(requestedRetention) ? Math.min(365, Math.max(1, requestedRetention)) : env.wearableAuditRetentionDays;
  const result = await cleanupWearableWebhookAuditEvents(retentionDays);
  res.status(200).json({ cleanup: result });
});

dashboardRouter.get("/dashboard/trainer", requireAuth, requireRole(Role.TRAINER), async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const query = recentLimitQuerySchema.parse(req.query);
    const cacheKey = buildDashboardCacheKey("trainer", req.auth.userId, query.limit);
    const cached = await getDashboardCache<Awaited<ReturnType<typeof getTrainerDashboard>>>(cacheKey);
    const dashboard = cached ?? (await getTrainerDashboard(req.auth.userId, query.limit));
    if (!cached) {
      await setDashboardCache(cacheKey, dashboard);
    }
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
    const cacheKey = buildDashboardCacheKey("member", req.auth.userId, query.limit);
    const cached = await getDashboardCache<Awaited<ReturnType<typeof getMemberDashboard>>>(cacheKey);
    const dashboard = cached ?? (await getMemberDashboard(req.auth.userId, query.limit));
    if (!cached) {
      await setDashboardCache(cacheKey, dashboard);
    }
    res.status(200).json({ dashboard });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
    }
    throw error;
  }
});
