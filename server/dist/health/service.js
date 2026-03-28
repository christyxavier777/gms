"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseHealth = getDatabaseHealth;
exports.buildLivenessReport = buildLivenessReport;
exports.buildReadinessReport = buildReadinessReport;
exports.getReadinessReport = getReadinessReport;
const client_1 = require("../prisma/client");
const client_2 = require("../cache/client");
const prisma = (0, client_1.createPrismaClient)();
const SERVICE_NAME = "gms-server";
async function getDatabaseHealth() {
    const startedAt = Date.now();
    try {
        await prisma.$queryRaw `SELECT 1`;
        return {
            status: "up",
            ready: true,
            latencyMs: Date.now() - startedAt,
            detail: "PostgreSQL responded to SELECT 1.",
        };
    }
    catch (error) {
        return {
            status: "down",
            ready: false,
            latencyMs: Date.now() - startedAt,
            detail: error instanceof Error
                ? `PostgreSQL health check failed: ${error.message}`
                : "PostgreSQL health check failed.",
        };
    }
}
function buildLivenessReport(now = new Date()) {
    return {
        status: "ok",
        service: SERVICE_NAME,
        timestamp: now.toISOString(),
        uptimeSec: Math.max(0, Math.floor(process.uptime())),
    };
}
function buildReadinessReport(dependencies, now = new Date()) {
    const ready = dependencies.database.ready && dependencies.cache.ready;
    return {
        status: ready ? "ok" : "degraded",
        service: SERVICE_NAME,
        timestamp: now.toISOString(),
        dependencies,
    };
}
async function getReadinessReport() {
    const [database, cache] = await Promise.all([getDatabaseHealth(), (0, client_2.getCacheHealth)()]);
    return buildReadinessReport({ database, cache });
}
//# sourceMappingURL=service.js.map