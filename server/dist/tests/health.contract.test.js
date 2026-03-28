"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const app_1 = require("../app");
async function startServer() {
    const app = (0, app_1.createApp)();
    const server = await new Promise((resolve) => {
        const startedServer = app.listen(0, () => resolve(startedServer));
    });
    const port = server.address().port;
    return {
        server,
        baseUrl: `http://127.0.0.1:${port}`,
    };
}
(0, node_test_1.default)("health live endpoint returns liveness metadata", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const response = await fetch(`${baseUrl}/health/live`);
        const body = (await response.json());
        strict_1.default.equal(response.status, 200);
        strict_1.default.equal(body.status, "ok");
        strict_1.default.equal(body.service, "gms-server");
        strict_1.default.equal(typeof body.timestamp, "string");
        strict_1.default.equal(typeof body.uptimeSec, "number");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("health endpoint exposes structured dependency status", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const response = await fetch(`${baseUrl}/health`);
        const body = (await response.json());
        strict_1.default.ok(response.status === 200 || response.status === 503);
        strict_1.default.ok(body.status === "ok" || body.status === "degraded");
        strict_1.default.ok(body.database === "up" || body.database === "down");
        strict_1.default.ok(body.cache === "up" || body.cache === "down" || body.cache === "fallback");
        strict_1.default.equal(typeof body.dependencies.database.ready, "boolean");
        strict_1.default.equal(typeof body.dependencies.cache.ready, "boolean");
        strict_1.default.equal(typeof body.dependencies.cache.configured, "boolean");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
//# sourceMappingURL=health.contract.test.js.map