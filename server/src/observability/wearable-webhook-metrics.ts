import { createPrismaClient } from "../prisma/client";
import { logError } from "../utils/logger";
import { env } from "../config/env";

export type WearableWebhookAuditStatus =
  | "SIGNATURE_VALID"
  | "RESERVED"
  | "DUPLICATE"
  | "RECEIVED"
  | "PROCESSED"
  | "FAILED"
  | "REJECTED"
  | "FINALIZED_PROCESSED"
  | "FINALIZED_RELEASED";

export type WearableWebhookProvider = "FITBIT" | "APPLE_WATCH" | "GENERIC" | "UNKNOWN";

type AuditEvent = {
  ts: number;
  provider: WearableWebhookProvider;
  status: WearableWebhookAuditStatus;
};

type AuditWrite = {
  provider: WearableWebhookProvider;
  status: WearableWebhookAuditStatus;
  meta?: {
    requestId?: string | undefined;
    eventId?: string | undefined;
    memberUserId?: string | undefined;
    errorCode?: string | undefined;
    message?: string | undefined;
  };
};

const MAX_EVENTS = 10000;
const RETENTION_MS = 24 * 60 * 60 * 1000;
const events: AuditEvent[] = [];
const pendingDbWrites: AuditWrite[] = [];
const prisma = createPrismaClient();
const DB_FALLBACK_COOLDOWN_MS = 30_000;
let dbUnavailableUntilMs = 0;
let dbWriteInFlight = false;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error("AUDIT_DB_TIMEOUT")), timeoutMs);
    }),
  ]);
}

function prune(nowMs: number): void {
  const minTs = nowMs - RETENTION_MS;
  while (events.length > 0 && (events[0]?.ts ?? 0) < minTs) {
    events.shift();
  }
  while (events.length > MAX_EVENTS) {
    events.shift();
  }
  while (pendingDbWrites.length > MAX_EVENTS) {
    pendingDbWrites.shift();
  }
}

function aggregateEvents(windowMinutes: number, now: number): {
  windowMinutes: number;
  totalEvents: number;
  byStatus: Record<string, number>;
  byProvider: Record<string, { total: number; byStatus: Record<string, number> }>;
} {
  const windowMs = Math.max(1, windowMinutes) * 60 * 1000;
  const minTs = now - windowMs;
  const inWindow = events.filter((e) => e.ts >= minTs);

  const byStatus: Record<string, number> = {};
  const byProvider: Record<string, { total: number; byStatus: Record<string, number> }> = {};

  for (const e of inWindow) {
    byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;

    const provider = byProvider[e.provider] ?? { total: 0, byStatus: {} };
    provider.total += 1;
    provider.byStatus[e.status] = (provider.byStatus[e.status] ?? 0) + 1;
    byProvider[e.provider] = provider;
  }

  return {
    windowMinutes: Math.max(1, windowMinutes),
    totalEvents: inWindow.length,
    byStatus,
    byProvider,
  };
}

function drainAuditWriteQueue(): void {
  if (dbWriteInFlight) {
    return;
  }
  if (Date.now() < dbUnavailableUntilMs) {
    return;
  }

  const nextWrite = pendingDbWrites.shift();
  if (!nextWrite) {
    return;
  }

  dbWriteInFlight = true;

  void withTimeout(
    prisma.wearableWebhookAuditEvent.create({
      data: {
        provider: nextWrite.provider,
        status: nextWrite.status,
        ...(nextWrite.meta?.requestId ? { requestId: nextWrite.meta.requestId } : {}),
        ...(nextWrite.meta?.eventId ? { eventId: nextWrite.meta.eventId } : {}),
        ...(nextWrite.meta?.memberUserId ? { memberUserId: nextWrite.meta.memberUserId } : {}),
        ...(nextWrite.meta?.errorCode ? { errorCode: nextWrite.meta.errorCode } : {}),
        ...(nextWrite.meta?.message ? { message: nextWrite.meta.message.slice(0, 500) } : {}),
      },
    }),
    env.wearableAuditDbTimeoutMs,
  )
    .catch((error: unknown) => {
      pendingDbWrites.unshift(nextWrite);
      dbUnavailableUntilMs = Date.now() + DB_FALLBACK_COOLDOWN_MS;
      logError("wearable_webhook_audit_persist_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
    })
    .finally(() => {
      dbWriteInFlight = false;
      if (Date.now() >= dbUnavailableUntilMs) {
        drainAuditWriteQueue();
      }
    });
}

export function recordWearableWebhookAudit(
  status: WearableWebhookAuditStatus,
  provider: WearableWebhookProvider,
  meta?: {
    requestId?: string | undefined;
    eventId?: string | undefined;
    memberUserId?: string | undefined;
    errorCode?: string | undefined;
    message?: string | undefined;
  },
): void {
  const now = Date.now();
  events.push({ ts: now, status, provider });
  pendingDbWrites.push({
    status,
    provider,
    ...(meta ? { meta } : {}),
  });
  prune(now);
  drainAuditWriteQueue();
}

export async function getWearableWebhookAuditSnapshot(windowMinutes: number): Promise<{
  windowMinutes: number;
  totalEvents: number;
  byStatus: Record<string, number>;
  byProvider: Record<string, { total: number; byStatus: Record<string, number> }>;
  source: "database" | "memory_fallback";
}> {
  const now = Date.now();
  prune(now);
  const windowMs = Math.max(1, windowMinutes) * 60 * 1000;
  const minDate = new Date(now - windowMs);

  if (now < dbUnavailableUntilMs || dbWriteInFlight || pendingDbWrites.length > 0) {
    const fallback = aggregateEvents(windowMinutes, now);
    return {
      ...fallback,
      source: "memory_fallback",
    };
  }

  try {
    const rows = await withTimeout(
      prisma.wearableWebhookAuditEvent.findMany({
        where: { createdAt: { gte: minDate } },
        select: { provider: true, status: true },
      }),
      env.wearableAuditDbTimeoutMs,
    );

    const byStatus: Record<string, number> = {};
    const byProvider: Record<string, { total: number; byStatus: Record<string, number> }> = {};

    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
      const provider = byProvider[row.provider] ?? { total: 0, byStatus: {} };
      provider.total += 1;
      provider.byStatus[row.status] = (provider.byStatus[row.status] ?? 0) + 1;
      byProvider[row.provider] = provider;
    }

    return {
      windowMinutes: Math.max(1, windowMinutes),
      totalEvents: rows.length,
      byStatus,
      byProvider,
      source: "database",
    };
  } catch (error) {
    dbUnavailableUntilMs = Date.now() + DB_FALLBACK_COOLDOWN_MS;
    logError("wearable_webhook_audit_read_fallback", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const fallback = aggregateEvents(windowMinutes, now);
    return {
      ...fallback,
      source: "memory_fallback",
    };
  }
}
