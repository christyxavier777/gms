"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWearableWebhookIdempotency = requireWearableWebhookIdempotency;
exports.finalizeWearableWebhookEvent = finalizeWearableWebhookEvent;
const env_1 = require("../config/env");
const client_1 = require("../cache/client");
const http_error_1 = require("./http-error");
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
        throw new http_error_1.HttpError(409, "DUPLICATE_WEBHOOK_EVENT", "Webhook event already processed or in progress");
    }
    req.wearableWebhook = { provider, eventId, dedupeKey };
    next();
}
async function finalizeWearableWebhookEvent(dedupeKey, success) {
    if (success) {
        await (0, client_1.cacheSet)(dedupeKey, "processed", env_1.env.wearableWebhookDedupeTtlSec);
        return;
    }
    await (0, client_1.cacheDel)(dedupeKey);
}
//# sourceMappingURL=wearable-webhook-idempotency.js.map