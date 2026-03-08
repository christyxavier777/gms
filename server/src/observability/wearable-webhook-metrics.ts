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

const MAX_EVENTS = 10000;
const RETENTION_MS = 24 * 60 * 60 * 1000;
const events: AuditEvent[] = [];

function prune(nowMs: number): void {
  const minTs = nowMs - RETENTION_MS;
  while (events.length > 0 && (events[0]?.ts ?? 0) < minTs) {
    events.shift();
  }
  while (events.length > MAX_EVENTS) {
    events.shift();
  }
}

export function recordWearableWebhookAudit(
  status: WearableWebhookAuditStatus,
  provider: WearableWebhookProvider,
): void {
  const now = Date.now();
  events.push({ ts: now, status, provider });
  prune(now);
}

export function getWearableWebhookAuditSnapshot(windowMinutes: number): {
  windowMinutes: number;
  totalEvents: number;
  byStatus: Record<string, number>;
  byProvider: Record<string, { total: number; byStatus: Record<string, number> }>;
} {
  const now = Date.now();
  prune(now);
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
