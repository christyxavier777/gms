"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWearableWebhookSignature = requireWearableWebhookSignature;
const env_1 = require("../config/env");
const http_error_1 = require("./http-error");
const webhook_signature_1 = require("../integrations/webhook-signature");
async function requireWearableWebhookSignature(req, _res, next) {
    const provider = req.header("x-wearable-provider");
    if (provider !== "FITBIT" && provider !== "APPLE_WATCH" && provider !== "GENERIC") {
        throw new http_error_1.HttpError(400, "INVALID_WEARABLE_PROVIDER", "x-wearable-provider must be FITBIT, APPLE_WATCH, or GENERIC");
    }
    if (!req.rawBody) {
        throw new http_error_1.HttpError(400, "WEBHOOK_RAW_BODY_MISSING", "Raw webhook body is missing");
    }
    (0, webhook_signature_1.verifyWearableWebhookSignature)({
        provider,
        rawBody: req.rawBody,
        timestampHeader: req.header("x-wearable-timestamp") ?? undefined,
        signatureHeader: req.header("x-wearable-signature") ?? undefined,
        toleranceSec: env_1.env.wearableWebhookToleranceSec,
        secrets: env_1.env.wearableWebhookSecrets,
    });
    next();
}
//# sourceMappingURL=require-wearable-webhook-signature.js.map