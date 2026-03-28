import { createPrismaClient } from "../prisma/client";
import { CacheHealthSnapshot, getCacheHealth } from "../cache/client";

const prisma = createPrismaClient();
const SERVICE_NAME = "gms-server";

export type DatabaseHealthSnapshot = {
  status: "up" | "down";
  ready: boolean;
  latencyMs: number | null;
  detail?: string;
};

export type LivenessReport = {
  status: "ok";
  service: string;
  timestamp: string;
  uptimeSec: number;
};

export type ReadinessReport = {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  dependencies: {
    database: DatabaseHealthSnapshot;
    cache: CacheHealthSnapshot;
  };
};

export async function getDatabaseHealth(): Promise<DatabaseHealthSnapshot> {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "up",
      ready: true,
      latencyMs: Date.now() - startedAt,
      detail: "PostgreSQL responded to SELECT 1.",
    };
  } catch (error) {
    return {
      status: "down",
      ready: false,
      latencyMs: Date.now() - startedAt,
      detail:
        error instanceof Error
          ? `PostgreSQL health check failed: ${error.message}`
          : "PostgreSQL health check failed.",
    };
  }
}

export function buildLivenessReport(now = new Date()): LivenessReport {
  return {
    status: "ok",
    service: SERVICE_NAME,
    timestamp: now.toISOString(),
    uptimeSec: Math.max(0, Math.floor(process.uptime())),
  };
}

export function buildReadinessReport(
  dependencies: {
    database: DatabaseHealthSnapshot;
    cache: CacheHealthSnapshot;
  },
  now = new Date(),
): ReadinessReport {
  const ready = dependencies.database.ready && dependencies.cache.ready;

  return {
    status: ready ? "ok" : "degraded",
    service: SERVICE_NAME,
    timestamp: now.toISOString(),
    dependencies,
  };
}

export async function getReadinessReport(): Promise<ReadinessReport> {
  const [database, cache] = await Promise.all([getDatabaseHealth(), getCacheHealth()]);
  return buildReadinessReport({ database, cache });
}
