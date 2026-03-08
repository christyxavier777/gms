"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const wearable_webhook_metrics_1 = require("../observability/wearable-webhook-metrics");
(0, node_test_1.default)("wearable webhook metrics aggregates status and provider counts", () => {
    (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("RECEIVED", "FITBIT");
    (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("PROCESSED", "FITBIT");
    (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("FAILED", "APPLE_WATCH");
    const snapshot = (0, wearable_webhook_metrics_1.getWearableWebhookAuditSnapshot)(60);
    strict_1.default.ok(snapshot.totalEvents >= 3);
    strict_1.default.ok((snapshot.byStatus.RECEIVED ?? 0) >= 1);
    strict_1.default.ok((snapshot.byStatus.PROCESSED ?? 0) >= 1);
    strict_1.default.ok((snapshot.byProvider.FITBIT?.total ?? 0) >= 2);
});
//# sourceMappingURL=wearable-webhook-metrics.unit.test.js.map