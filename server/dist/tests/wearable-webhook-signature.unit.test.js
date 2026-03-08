"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const http_error_1 = require("../middleware/http-error");
const webhook_signature_1 = require("../integrations/webhook-signature");
const secrets = {
    fitbit: "fitbit-secret",
    appleWatch: "apple-secret",
    generic: "generic-secret",
};
function signedHeaders(rawBody, timestampSec, secret) {
    const payload = `${timestampSec}.${rawBody}`;
    const signature = crypto_1.default.createHmac("sha256", secret).update(payload).digest("hex");
    return { timestamp: String(timestampSec), signature: `sha256=${signature}` };
}
(0, node_test_1.default)("verifyWearableWebhookSignature accepts valid signature", () => {
    const rawBody = JSON.stringify({ memberUserId: "11111111-1111-1111-1111-111111111111", source: "FITBIT" });
    const timestampSec = Math.floor(Date.now() / 1000);
    const headers = signedHeaders(rawBody, timestampSec, secrets.fitbit);
    strict_1.default.doesNotThrow(() => (0, webhook_signature_1.verifyWearableWebhookSignature)({
        provider: "FITBIT",
        rawBody: Buffer.from(rawBody, "utf8"),
        timestampHeader: headers.timestamp,
        signatureHeader: headers.signature,
        toleranceSec: 300,
        secrets,
    }));
});
(0, node_test_1.default)("verifyWearableWebhookSignature rejects invalid signature", () => {
    const rawBody = JSON.stringify({ memberUserId: "11111111-1111-1111-1111-111111111111", source: "FITBIT" });
    const timestampSec = Math.floor(Date.now() / 1000);
    strict_1.default.throws(() => (0, webhook_signature_1.verifyWearableWebhookSignature)({
        provider: "FITBIT",
        rawBody: Buffer.from(rawBody, "utf8"),
        timestampHeader: String(timestampSec),
        signatureHeader: "sha256=deadbeef",
        toleranceSec: 300,
        secrets,
    }), (error) => error instanceof http_error_1.HttpError && error.code === "WEBHOOK_SIGNATURE_INVALID");
});
(0, node_test_1.default)("verifyWearableWebhookSignature rejects stale timestamps", () => {
    const rawBody = JSON.stringify({ memberUserId: "11111111-1111-1111-1111-111111111111", source: "FITBIT" });
    const staleTimestampSec = Math.floor(Date.now() / 1000) - 3600;
    const headers = signedHeaders(rawBody, staleTimestampSec, secrets.fitbit);
    strict_1.default.throws(() => (0, webhook_signature_1.verifyWearableWebhookSignature)({
        provider: "FITBIT",
        rawBody: Buffer.from(rawBody, "utf8"),
        timestampHeader: headers.timestamp,
        signatureHeader: headers.signature,
        toleranceSec: 300,
        secrets,
    }), (error) => error instanceof http_error_1.HttpError && error.code === "WEBHOOK_SIGNATURE_EXPIRED");
});
//# sourceMappingURL=wearable-webhook-signature.unit.test.js.map