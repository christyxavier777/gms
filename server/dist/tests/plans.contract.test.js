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
(0, node_test_1.default)("members cannot create workout plans", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "11111111-1111-1111-1111-111111111111",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/workout-plans`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${memberToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "Upper body strength",
                description: "Push and pull split",
            }),
        });
        strict_1.default.equal(response.status, 403);
        const payload = (await response.json());
        strict_1.default.equal(payload.error?.code, "WORKOUT_PLAN_CREATE_FORBIDDEN");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("members cannot create diet plans", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "22222222-2222-2222-2222-222222222222",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/diet-plans`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${memberToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "Recovery meals",
                description: "High-protein daily meal plan",
            }),
        });
        strict_1.default.equal(response.status, 403);
        const payload = (await response.json());
        strict_1.default.equal(payload.error?.code, "DIET_PLAN_CREATE_FORBIDDEN");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
//# sourceMappingURL=plans.contract.test.js.map