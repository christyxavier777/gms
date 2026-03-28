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
(0, node_test_1.default)("members cannot create progress entries", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "11111111-1111-1111-1111-111111111111",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/progress`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${memberToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: "11111111-1111-1111-1111-111111111111",
                weight: 72,
                height: 1.75,
                recordedAt: new Date().toISOString(),
            }),
        });
        strict_1.default.equal(response.status, 403);
        const payload = (await response.json());
        strict_1.default.equal(payload.error?.code, "PROGRESS_CREATE_FORBIDDEN");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
//# sourceMappingURL=progress.contract.test.js.map