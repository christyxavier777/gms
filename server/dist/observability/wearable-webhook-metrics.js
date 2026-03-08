"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordWearableWebhookAudit = recordWearableWebhookAudit;
exports.getWearableWebhookAuditSnapshot = getWearableWebhookAuditSnapshot;
const client_1 = require("../prisma/client");
const logger_1 = require("../utils/logger");
const MAX_EVENTS = 10000;
const RETENTION_MS = 24 * 60 * 60 * 1000;
const events = [];
const prisma = (0, client_1.createPrismaClient)();
const DB_FALLBACK_COOLDOWN_MS = 30_000;
let dbUnavailableUntilMs = 0;
let dbWriteInFlight = false;
function prune(nowMs) {
    const minTs = nowMs - RETENTION_MS;
    while (events.length > 0 && (events[0]?.ts ?? 0) < minTs) {
        events.shift();
    }
    while (events.length > MAX_EVENTS) {
        events.shift();
    }
}
function aggregateEvents(windowMinutes, now) {
    const windowMs = Math.max(1, windowMinutes) * 60 * 1000;
    const minTs = now - windowMs;
    const inWindow = events.filter((e) => e.ts >= minTs);
    const byStatus = {};
    const byProvider = {};
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
function recordWearableWebhookAudit(status, provider, meta) {
    const now = Date.now();
    events.push({ ts: now, status, provider });
    prune(now);
    if (now < dbUnavailableUntilMs) {
        return;
    }
    if (dbWriteInFlight) {
        return;
    }
    dbWriteInFlight = true;
    void prisma.wearableWebhookAuditEvent
        .create({
        data: {
            provider,
            status,
            ...(meta?.requestId ? { requestId: meta.requestId } : {}),
            ...(meta?.eventId ? { eventId: meta.eventId } : {}),
            ...(meta?.memberUserId ? { memberUserId: meta.memberUserId } : {}),
            ...(meta?.errorCode ? { errorCode: meta.errorCode } : {}),
            ...(meta?.message ? { message: meta.message.slice(0, 500) } : {}),
        },
    })
        .catch((error) => {
        dbUnavailableUntilMs = Date.now() + DB_FALLBACK_COOLDOWN_MS;
        (0, logger_1.logError)("wearable_webhook_audit_persist_failed", {
            error: error instanceof Error ? error.message : "unknown",
        });
    })
        .finally(() => {
        dbWriteInFlight = false;
    });
}
async function getWearableWebhookAuditSnapshot(windowMinutes) {
    const now = Date.now();
    prune(now);
    const windowMs = Math.max(1, windowMinutes) * 60 * 1000;
    const minDate = new Date(now - windowMs);
    if (now < dbUnavailableUntilMs) {
        const fallback = aggregateEvents(windowMinutes, now);
        return {
            ...fallback,
            source: "memory_fallback",
        };
    }
    try {
        const rows = await prisma.wearableWebhookAuditEvent.findMany({
            where: { createdAt: { gte: minDate } },
            select: { provider: true, status: true },
        });
        const byStatus = {};
        const byProvider = {};
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
    }
    catch {
        dbUnavailableUntilMs = Date.now() + DB_FALLBACK_COOLDOWN_MS;
        const fallback = aggregateEvents(windowMinutes, now);
        return {
            ...fallback,
            source: "memory_fallback",
        };
    }
}
//# sourceMappingURL=wearable-webhook-metrics.js.map