import { env } from "../config/env";
import { cacheDelByPrefix, cacheGet, cacheSet } from "../cache/client";
import { logInfo } from "../utils/logger";

const DASHBOARD_CACHE_PREFIX = "dashboard:v1:";

export function buildDashboardCacheKey(scope: "admin" | "trainer" | "member", id: string, limit = 0): string {
  return `${DASHBOARD_CACHE_PREFIX}${scope}:${id}:${limit}`;
}

export async function getDashboardCache<T>(key: string): Promise<T | null> {
  const raw = await cacheGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setDashboardCache<T>(key: string, payload: T): Promise<void> {
  await cacheSet(key, JSON.stringify(payload), env.dashboardCacheTtlSec);
}

export async function invalidateDashboardCache(reason: string): Promise<void> {
  const removed = await cacheDelByPrefix(DASHBOARD_CACHE_PREFIX);
  logInfo("dashboard_cache_invalidate", { reason, removed });
}

