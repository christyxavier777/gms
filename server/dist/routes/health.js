"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const client_1 = require("../prisma/client");
// Health endpoint for uptime and readiness checks.
exports.healthRouter = (0, express_1.Router)();
const prisma = (0, client_1.createPrismaClient)();
exports.healthRouter.get("/health", async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: "ok", database: "up" });
    }
    catch {
        res.status(503).json({ status: "degraded", database: "down" });
    }
});
//# sourceMappingURL=health.js.map