type CacheCounters = {
  dashboardHits: number;
  dashboardMisses: number;
  dashboardSets: number;
  dashboardInvalidations: number;
  dashboardInvalidatedKeys: number;
};

const cacheCounters: CacheCounters = {
  dashboardHits: 0,
  dashboardMisses: 0,
  dashboardSets: 0,
  dashboardInvalidations: 0,
  dashboardInvalidatedKeys: 0,
};

export function recordDashboardCacheHit(): void {
  cacheCounters.dashboardHits += 1;
}

export function recordDashboardCacheMiss(): void {
  cacheCounters.dashboardMisses += 1;
}

export function recordDashboardCacheSet(): void {
  cacheCounters.dashboardSets += 1;
}

export function recordDashboardCacheInvalidation(removed: number): void {
  cacheCounters.dashboardInvalidations += 1;
  cacheCounters.dashboardInvalidatedKeys += Math.max(0, removed);
}

export function getCacheSnapshot(): CacheCounters & { dashboardHitRatePct: number } {
  const total = cacheCounters.dashboardHits + cacheCounters.dashboardMisses;
  const hitRate = total === 0 ? 0 : (cacheCounters.dashboardHits / total) * 100;

  return {
    ...cacheCounters,
    dashboardHitRatePct: Number(hitRate.toFixed(2)),
  };
}
