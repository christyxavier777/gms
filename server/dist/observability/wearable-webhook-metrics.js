"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordWearableWebhookAudit = recordWearableWebhookAudit;
exports.getWearableWebhookAuditSnapshot = getWearableWebhookAuditSnapshot;
const MAX_EVENTS = 10000;
const RETENTION_MS = 24 * 60 * 60 * 1000;
const events = [];
function prune(nowMs) {
    const minTs = nowMs - RETENTION_MS;
    while (events.length > 0 && (events[0]?.ts ?? 0) < minTs) {
        events.shift();
    }
    while (events.length > MAX_EVENTS) {
        events.shift();
    }
}
function recordWearableWebhookAudit(status, provider) {
    const now = Date.now();
    events.push({ ts: now, status, provider });
    prune(now);
}
function getWearableWebhookAuditSnapshot(windowMinutes) {
    const now = Date.now();
    prune(now);
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
//# sourceMappingURL=wearable-webhook-metrics.js.map