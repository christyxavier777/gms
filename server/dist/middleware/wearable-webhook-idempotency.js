"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWearableWebhookIdempotency = requireWearableWebhookIdempotency;
exports.finalizeWearableWebhookEvent = finalizeWearableWebhookEvent;
const env_1 = require("../config/env");
const client_1 = require("../cache/client");
const http_error_1 = require("./http-error");
const logger_1 = require("../utils/logger");
const wearable_webhook_metrics_1 = require("../observability/wearable-webhook-metrics");
const WEBHOOK_DEDUPE_PREFIX = "wearable:webhook:event:";
const IN_FLIGHT_TTL_SEC = 120;
function normalizeEventId(raw) {
    const value = raw.trim();
    if (!/^[a-zA-Z0-9:_-]{8,128}$/.test(value)) {
        throw new http_error_1.HttpError(400, "INVALID_WEBHOOK_EVENT_ID", "x-wearable-event-id format is invalid");
    }
    return value;
}
function webhookDedupeKey(provider, eventId) {
    return `${WEBHOOK_DEDUPE_PREFIX}${provider}:${eventId}`;
}
async function requireWearableWebhookIdempotency(req, _res, next) {
    const provider = req.header("x-wearable-provider");
    if (provider !== "FITBIT" && provider !== "APPLE_WATCH" && provider !== "GENERIC") {
        throw new http_error_1.HttpError(400, "INVALID_WEARABLE_PROVIDER", "x-wearable-provider must be FITBIT, APPLE_WATCH, or GENERIC");
    }
    const eventIdHeader = req.header("x-wearable-event-id");
    if (!eventIdHeader) {
        throw new http_error_1.HttpError(400, "WEBHOOK_EVENT_ID_MISSING", "x-wearable-event-id header is required");
    }
    const eventId = normalizeEventId(eventIdHeader);
    const dedupeKey = webhookDedupeKey(provider, eventId);
    const reserved = await (0, client_1.cacheSetIfAbsent)(dedupeKey, "in_flight", IN_FLIGHT_TTL_SEC);
    if (!reserved) {
        (0, logger_1.logInfo)("wearable_webhook_duplicate", {
            requestId: req.requestId,
            provider,
            eventId,
        });
        (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("DUPLICATE", provider);
        throw new http_error_1.HttpError(409, "DUPLICATE_WEBHOOK_EVENT", "Webhook event already processed or in progress");
    }
    (0, logger_1.logInfo)("wearable_webhook_reserved", {
        requestId: req.requestId,
        provider,
        eventId,
    });
    (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("RESERVED", provider);
    req.wearableWebhook = { provider, eventId, dedupeKey };
    next();
}
async function finalizeWearableWebhookEvent(dedupeKey, success, context) {
    if (success) {
        await (0, client_1.cacheSet)(dedupeKey, "processed", env_1.env.wearableWebhookDedupeTtlSec);
        (0, logger_1.logInfo)("wearable_webhook_finalized", {
            requestId: context?.requestId,
            provider: context?.provider,
            eventId: context?.eventId,
            memberUserId: context?.memberUserId,
            status: "processed",
        });
        if (context?.provider === "FITBIT" || context?.provider === "APPLE_WATCH" || context?.provider === "GENERIC") {
            (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("FINALIZED_PROCESSED", context.provider);
        }
        else {
            (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("FINALIZED_PROCESSED", "UNKNOWN");
        }
        return;
    }
    await (0, client_1.cacheDel)(dedupeKey);
    (0, logger_1.logInfo)("wearable_webhook_finalized", {
        requestId: context?.requestId,
        provider: context?.provider,
        eventId: context?.eventId,
        memberUserId: context?.memberUserId,
        status: "released_for_retry",
    });
    if (context?.provider === "FITBIT" || context?.provider === "APPLE_WATCH" || context?.provider === "GENERIC") {
        (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("FINALIZED_RELEASED", context.provider);
    }
    else {
        (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("FINALIZED_RELEASED", "UNKNOWN");
    }
}
//# sourceMappingURL=wearable-webhook-idempotency.js.map