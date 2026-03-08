"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationsRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const schemas_1 = require("../integrations/schemas");
const service_1 = require("../integrations/service");
const http_error_1 = require("../middleware/http-error");
const rate_limit_1 = require("../middleware/rate-limit");
const require_auth_1 = require("../middleware/require-auth");
const require_role_1 = require("../middleware/require-role");
const require_wearable_webhook_signature_1 = require("../middleware/require-wearable-webhook-signature");
const logger_1 = require("../utils/logger");
const wearable_webhook_metrics_1 = require("../observability/wearable-webhook-metrics");
const wearable_webhook_idempotency_1 = require("../middleware/wearable-webhook-idempotency");
exports.integrationsRouter = (0, express_1.Router)();
exports.integrationsRouter.post("/integrations/wearables/sync", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.MEMBER), rate_limit_1.wearableSyncRateLimiter, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const payload = schemas_1.wearableSyncSchema.parse(req.body);
        const synced = await (0, service_1.syncWearableProgress)(req.auth, payload);
        res.status(201).json({ synced });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Wearable payload is invalid", error.flatten());
        }
        throw error;
    }
});
exports.integrationsRouter.post("/integrations/wearables/webhook", rate_limit_1.wearableSyncRateLimiter, require_wearable_webhook_signature_1.requireWearableWebhookSignature, wearable_webhook_idempotency_1.requireWearableWebhookIdempotency, async (req, res) => {
    let dedupeKey = req.wearableWebhook?.dedupeKey;
    const provider = req.wearableWebhook?.provider;
    const eventId = req.wearableWebhook?.eventId;
    try {
        (0, logger_1.logInfo)("wearable_webhook_received", {
            requestId: req.requestId,
            provider,
            eventId,
        });
        if (provider) {
            (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("RECEIVED", provider, {
                requestId: req.requestId,
                eventId,
            });
        }
        const payload = schemas_1.wearableWebhookSyncSchema.parse(req.body);
        const synced = await (0, service_1.syncWearableProgressForMember)(payload.memberUserId, payload);
        if (dedupeKey) {
            await (0, wearable_webhook_idempotency_1.finalizeWearableWebhookEvent)(dedupeKey, true, {
                requestId: req.requestId,
                provider,
                eventId,
                memberUserId: payload.memberUserId,
            });
        }
        (0, logger_1.logInfo)("wearable_webhook_processed", {
            requestId: req.requestId,
            provider,
            eventId,
            memberUserId: payload.memberUserId,
            progressId: synced.progressId,
        });
        if (provider) {
            (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("PROCESSED", provider, {
                requestId: req.requestId,
                eventId,
                memberUserId: payload.memberUserId,
            });
        }
        res.status(201).json({ synced });
    }
    catch (error) {
        if (dedupeKey) {
            await (0, wearable_webhook_idempotency_1.finalizeWearableWebhookEvent)(dedupeKey, false, {
                requestId: req.requestId,
                provider,
                eventId,
                memberUserId: typeof req.body?.memberUserId === "string" ? req.body.memberUserId : undefined,
            });
        }
        (0, logger_1.logError)("wearable_webhook_failed", {
            requestId: req.requestId,
            provider,
            eventId,
            memberUserId: typeof req.body?.memberUserId === "string" ? req.body.memberUserId : undefined,
            errorCode: error instanceof http_error_1.HttpError ? error.code : "UNKNOWN_ERROR",
            message: error instanceof Error ? error.message : "unknown",
        });
        if (provider) {
            (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("FAILED", provider, {
                requestId: req.requestId,
                eventId,
                memberUserId: typeof req.body?.memberUserId === "string" ? req.body.memberUserId : undefined,
                errorCode: error instanceof http_error_1.HttpError ? error.code : "UNKNOWN_ERROR",
                message: error instanceof Error ? error.message : "unknown",
            });
        }
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Wearable webhook payload is invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=integrations.js.map