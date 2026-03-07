import { env } from "../config/env";
import { cacheDelByPrefix, cacheGet, cacheSet } from "../cache/client";
import { logInfo } from "../utils/logger";
import {
  recordDashboardCacheHit,
  recordDashboardCacheInvalidation,
  recordDashboardCacheMiss,
  recordDashboardCacheSet,
} from "../observability/cache-metrics";

const DASHBOARD_CACHE_PREFIX = "dashboard:v1:";

export function buildDashboardCacheKey(scope: "admin" | "trainer" | "member", id: string, limit = 0): string {
  return `${DASHBOARD_CACHE_PREFIX}${scope}:${id}:${limit}`;
}

export async function getDashboardCache<T>(key: string): Promise<T | null> {
  const raw = await cacheGet(key);
  if (!raw) {
    recordDashboardCacheMiss();
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as T;
    recordDashboardCacheHit();
    return parsed;
  } catch {
    recordDashboardCacheMiss();
    return null;
  }
}

export async function setDashboardCache<T>(key: string, payload: T): Promise<void> {
  await cacheSet(key, JSON.stringify(payload), env.dashboardCacheTtlSec);
  recordDashboardCacheSet();
}

export async function invalidateDashboardCache(reason: string): Promise<void> {
  const removed = await cacheDelByPrefix(DASHBOARD_CACHE_PREFIX);
  recordDashboardCacheInvalidation(removed);
  logInfo("dashboard_cache_invalidate", { reason, removed });
}
