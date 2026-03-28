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
(0, node_test_1.default)("schedule workspace requires authentication", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const response = await fetch(`${baseUrl}/schedule`);
        strict_1.default.equal(response.status, 401);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("members cannot create scheduled sessions", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "11111111-1111-1111-1111-111111111111",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/schedule`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${memberToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "Morning conditioning",
                sessionType: "CLASS",
                startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                capacity: 10,
            }),
        });
        strict_1.default.equal(response.status, 403);
        const payload = (await response.json());
        strict_1.default.equal(payload.error?.code, "SCHEDULE_SESSION_CREATE_FORBIDDEN");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("scheduled session payload is validated before hitting the service layer", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const trainerToken = (0, jwt_1.issueAccessToken)({
            userId: "22222222-2222-2222-2222-222222222222",
            role: client_1.Role.TRAINER,
        });
        const response = await fetch(`${baseUrl}/schedule`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${trainerToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "AB",
                sessionType: "CLASS",
                startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                capacity: 0,
            }),
        });
        strict_1.default.equal(response.status, 400);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("booking a session is member-only", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const trainerToken = (0, jwt_1.issueAccessToken)({
            userId: "33333333-3333-3333-3333-333333333333",
            role: client_1.Role.TRAINER,
        });
        const response = await fetch(`${baseUrl}/schedule/44444444-4444-4444-4444-444444444444/book`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${trainerToken}`,
            },
        });
        strict_1.default.equal(response.status, 403);
        const payload = (await response.json());
        strict_1.default.equal(payload.error?.code, "SCHEDULE_BOOKING_CREATE_FORBIDDEN");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("trainers cannot create sessions on behalf of another trainer", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const trainerToken = (0, jwt_1.issueAccessToken)({
            userId: "77777777-7777-7777-7777-777777777777",
            role: client_1.Role.TRAINER,
        });
        const response = await fetch(`${baseUrl}/schedule`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${trainerToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "Trainer-led assessment",
                sessionType: "ASSESSMENT",
                trainerId: "88888888-8888-8888-8888-888888888888",
                startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                capacity: 4,
            }),
        });
        strict_1.default.equal(response.status, 403);
        const payload = (await response.json());
        strict_1.default.equal(payload.error?.code, "SCHEDULE_TRAINER_SCOPE_FORBIDDEN");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("schedule booking updates validate status values", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const adminToken = (0, jwt_1.issueAccessToken)({
            userId: "55555555-5555-5555-5555-555555555555",
            role: client_1.Role.ADMIN,
        });
        const response = await fetch(`${baseUrl}/schedule/bookings/66666666-6666-6666-6666-666666666666`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "BOOKED" }),
        });
        strict_1.default.equal(response.status, 400);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
//# sourceMappingURL=schedule.contract.test.js.map