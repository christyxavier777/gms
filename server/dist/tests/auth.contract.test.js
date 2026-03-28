"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const client_1 = require("@prisma/client");
const jwt_1 = require("../auth/jwt");
const env_1 = require("../config/env");
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
(0, node_test_1.default)("login throttling returns auth-specific retry metadata", async () => {
    const { server, baseUrl } = await startServer();
    try {
        let response = null;
        const body = JSON.stringify({
            email: "throttle.contract",
            password: "x",
        });
        for (let attempt = 0; attempt <= env_1.env.authRateLimitMax; attempt += 1) {
            response = await fetch(`${baseUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
            });
        }
        strict_1.default.ok(response);
        strict_1.default.equal(response.status, 429);
        strict_1.default.equal(response.headers.get("X-RateLimit-Remaining"), "0");
        const retryAfter = Number(response.headers.get("Retry-After"));
        strict_1.default.equal(Number.isFinite(retryAfter) && retryAfter > 0, true);
        const payload = (await response.json());
        strict_1.default.equal(payload.error.code, "AUTH_LOGIN_THROTTLED");
        strict_1.default.equal(payload.error.details?.throttleScope, "login");
        strict_1.default.equal(payload.error.details?.limit, env_1.env.authRateLimitMax);
        strict_1.default.equal(payload.error.details?.retryAfterSeconds, retryAfter);
        strict_1.default.equal(typeof payload.error.details?.windowSeconds, "number");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("login validation failures still expose remaining throttle headers", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "visibility.contract",
                password: "x",
            }),
        });
        strict_1.default.equal(response.status, 400);
        strict_1.default.equal(response.headers.get("X-RateLimit-Limit"), String(env_1.env.authRateLimitMax));
        strict_1.default.equal(response.headers.get("X-RateLimit-Remaining"), String(env_1.env.authRateLimitMax - 1));
        strict_1.default.equal(Number.isFinite(Number(response.headers.get("X-RateLimit-Reset"))), true);
        const payload = (await response.json());
        strict_1.default.equal(payload.error.code, "VALIDATION_ERROR");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("session visibility endpoint requires authentication", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const response = await fetch(`${baseUrl}/me/sessions`);
        strict_1.default.equal(response.status, 401);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("revoke other sessions requires a cookie-backed session context", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const accessToken = (0, jwt_1.issueAccessToken)({
            userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/me/sessions/revoke-others`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        strict_1.default.equal(response.status, 400);
        const payload = (await response.json());
        strict_1.default.equal(payload.error?.code, "SESSION_CONTEXT_REQUIRED");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
//# sourceMappingURL=auth.contract.test.js.map