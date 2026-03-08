"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__webhookSignatureInternals = void 0;
exports.verifyWearableWebhookSignature = verifyWearableWebhookSignature;
const crypto_1 = __importDefault(require("crypto"));
const http_error_1 = require("../middleware/http-error");
function normalizeSignature(signatureHeader) {
    const value = signatureHeader.trim();
    const prefixed = value.toLowerCase().startsWith("sha256=") ? value.slice(7) : value;
    return prefixed.trim().toLowerCase();
}
function getProviderSecret(provider, secrets) {
    if (provider === "FITBIT")
        return secrets.fitbit;
    if (provider === "APPLE_WATCH")
        return secrets.appleWatch;
    return secrets.generic;
}
function verifyWearableWebhookSignature(input) {
    if (!input.timestampHeader || !input.signatureHeader) {
        throw new http_error_1.HttpError(401, "WEBHOOK_SIGNATURE_MISSING", "Missing webhook signature headers");
    }
    const timestampSec = Number.parseInt(input.timestampHeader, 10);
    if (!Number.isFinite(timestampSec)) {
        throw new http_error_1.HttpError(401, "WEBHOOK_SIGNATURE_INVALID", "Webhook timestamp header is invalid");
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - timestampSec) > input.toleranceSec) {
        throw new http_error_1.HttpError(401, "WEBHOOK_SIGNATURE_EXPIRED", "Webhook timestamp is outside tolerance window");
    }
    const providerSecret = getProviderSecret(input.provider, input.secrets);
    if (!providerSecret) {
        throw new http_error_1.HttpError(500, "WEBHOOK_SECRET_MISSING", "Webhook secret is not configured for provider");
    }
    const payloadToSign = `${timestampSec}.${input.rawBody.toString("utf8")}`;
    const expected = crypto_1.default.createHmac("sha256", providerSecret).update(payloadToSign).digest("hex");
    const received = normalizeSignature(input.signatureHeader);
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(received, "hex");
    if (expectedBuffer.length !== receivedBuffer.length) {
        throw new http_error_1.HttpError(401, "WEBHOOK_SIGNATURE_INVALID", "Webhook signature is invalid");
    }
    if (!crypto_1.default.timingSafeEqual(expectedBuffer, receivedBuffer)) {
        throw new http_error_1.HttpError(401, "WEBHOOK_SIGNATURE_INVALID", "Webhook signature is invalid");
    }
}
exports.__webhookSignatureInternals = {
    normalizeSignature,
};
//# sourceMappingURL=webhook-signature.js.map