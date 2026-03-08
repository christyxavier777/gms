"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const client_1 = require("@prisma/client");
const app_1 = require("../app");
const jwt_1 = require("../auth/jwt");
const wearable_webhook_metrics_1 = require("../observability/wearable-webhook-metrics");
async function startServer() {
    const app = (0, app_1.createApp)();
    const server = await new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    return { server, baseUrl: `http://127.0.0.1:${port}` };
}
(0, node_test_1.default)("wearable audit endpoint is admin-only", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "11111111-1111-1111-1111-111111111111",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/dashboard/admin/integrations/wearables/audit`, {
            headers: { Authorization: `Bearer ${memberToken}` },
        });
        strict_1.default.equal(response.status, 403);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("wearable audit endpoint returns aggregated snapshot for admins", async () => {
    const { server, baseUrl } = await startServer();
    try {
        (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("RECEIVED", "FITBIT");
        (0, wearable_webhook_metrics_1.recordWearableWebhookAudit)("PROCESSED", "FITBIT");
        const adminToken = (0, jwt_1.issueAccessToken)({
            userId: "00000000-0000-0000-0000-000000000000",
            role: client_1.Role.ADMIN,
        });
        const response = await fetch(`${baseUrl}/dashboard/admin/integrations/wearables/audit?windowMinutes=60`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        strict_1.default.equal(response.status, 200);
        const body = (await response.json());
        strict_1.default.equal(typeof body.audit.windowMinutes, "number");
        strict_1.default.equal(typeof body.audit.totalEvents, "number");
        strict_1.default.ok((body.audit.byStatus.RECEIVED ?? 0) >= 1);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
//# sourceMappingURL=dashboard-wearable-audit.contract.test.js.map