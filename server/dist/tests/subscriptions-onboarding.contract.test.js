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
(0, node_test_1.default)("member onboarding subscription endpoint requires authentication", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const response = await fetch(`${baseUrl}/me/subscription/onboarding`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId: "pro-quarterly" }),
        });
        strict_1.default.equal(response.status, 401);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("member onboarding subscription endpoint is member-only", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const trainerToken = (0, jwt_1.issueAccessToken)({
            userId: "22222222-2222-2222-2222-222222222222",
            role: client_1.Role.TRAINER,
        });
        const response = await fetch(`${baseUrl}/me/subscription/onboarding`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${trainerToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ planId: "pro-quarterly" }),
        });
        strict_1.default.equal(response.status, 403);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("member onboarding subscription endpoint validates required plan identifiers before hitting the service layer", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "33333333-3333-3333-3333-333333333333",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/me/subscription/onboarding`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${memberToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ planId: "" }),
        });
        strict_1.default.equal(response.status, 400);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
//# sourceMappingURL=subscriptions-onboarding.contract.test.js.map