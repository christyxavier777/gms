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
(0, node_test_1.default)("payment creation validates invalid UPI handles before reaching the service layer", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "11111111-1111-1111-1111-111111111111",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/payments/upi`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${memberToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: "11111111-1111-1111-1111-111111111111",
                amount: 499,
                upiId: "bad-handle",
            }),
        });
        strict_1.default.equal(response.status, 400);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("payment creation validates oversized proof references before reaching the service layer", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "11111111-1111-1111-1111-111111111111",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/payments/upi`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${memberToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: "11111111-1111-1111-1111-111111111111",
                amount: 499,
                upiId: "member@okaxis",
                proofReference: "x".repeat(501),
            }),
        });
        strict_1.default.equal(response.status, 400);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("payment review updates remain admin-only", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "22222222-2222-2222-2222-222222222222",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/payments/33333333-3333-3333-3333-333333333333/status`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${memberToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: "SUCCESS",
                verificationNotes: "Looks good",
            }),
        });
        strict_1.default.equal(response.status, 403);
        const payload = (await response.json());
        strict_1.default.equal(payload.error?.code, "PAYMENT_REVIEW_FORBIDDEN");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("members cannot create payments for another user", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "66666666-6666-6666-6666-666666666666",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/payments/upi`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${memberToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: "77777777-7777-7777-7777-777777777777",
                amount: 499,
                upiId: "member@okaxis",
            }),
        });
        strict_1.default.equal(response.status, 403);
        const payload = (await response.json());
        strict_1.default.equal(payload.error?.code, "PAYMENT_CREATE_FORBIDDEN");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("payment review note length is validated before hitting the service layer", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const adminToken = (0, jwt_1.issueAccessToken)({
            userId: "44444444-4444-4444-4444-444444444444",
            role: client_1.Role.ADMIN,
        });
        const response = await fetch(`${baseUrl}/payments/55555555-5555-5555-5555-555555555555/status`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: "FAILED",
                verificationNotes: "x".repeat(241),
            }),
        });
        strict_1.default.equal(response.status, 400);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
//# sourceMappingURL=payments.contract.test.js.map