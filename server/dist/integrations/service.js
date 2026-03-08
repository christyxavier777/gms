"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__wearableInternals = void 0;
exports.syncWearableProgress = syncWearableProgress;
exports.syncWearableProgressForMember = syncWearableProgressForMember;
const client_1 = require("@prisma/client");
const bmi_1 = require("../progress/bmi");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const cache_1 = require("../dashboard/cache");
const prisma = (0, client_2.createPrismaClient)();
function normalizeMetrics(input) {
    const weight = input.metrics?.weightKg ?? input.payload?.weight ?? null;
    const height = input.metrics?.heightM ?? input.payload?.height ?? null;
    const bodyFat = input.metrics?.bodyFatPct ?? input.payload?.bodyFat ?? null;
    const providedBmi = input.metrics?.bmi ?? input.payload?.bmi ?? null;
    const recordedAt = input.recordedAt ?? input.payload?.timestamp ?? new Date();
    if (recordedAt > new Date()) {
        throw new http_error_1.HttpError(400, "INVALID_TIMESTAMP", "recordedAt cannot be in the future");
    }
    const computedBmi = weight !== null && height !== null
        ? (0, bmi_1.calculateBmi)(weight, height)
        : providedBmi;
    const note = input.note?.trim()
        ? `[${input.source}] ${input.note.trim()}`
        : `[${input.source}] Auto-synced wearable entry`;
    if (weight === null && height === null && bodyFat === null && computedBmi === null) {
        throw new http_error_1.HttpError(400, "NO_METRICS", "No valid wearable metrics found in payload");
    }
    return {
        weight,
        height,
        bodyFat,
        bmi: computedBmi,
        recordedAt,
        note,
    };
}
async function assertMember(memberUserId) {
    const member = await prisma.user.findUnique({
        where: { id: memberUserId },
        select: { role: true },
    });
    if (!member)
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
    if (member.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(400, "INVALID_MEMBER", "Wearable sync is only available for members");
    }
}
async function syncWearableProgress(requester, input) {
    if (requester.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "Only members can sync wearable progress");
    }
    await assertMember(requester.userId);
    const normalized = normalizeMetrics(input);
    const dietCategory = normalized.bmi ? (0, bmi_1.categorizeBmi)(normalized.bmi) : null;
    const created = await prisma.progress.create({
        data: {
            userId: requester.userId,
            recordedById: requester.userId,
            weight: normalized.weight,
            height: normalized.height,
            bodyFat: normalized.bodyFat,
            bmi: normalized.bmi,
            dietCategory,
            notes: normalized.note,
            recordedAt: normalized.recordedAt,
        },
        select: {
            id: true,
            recordedAt: true,
            bmi: true,
            dietCategory: true,
        },
    });
    await (0, cache_1.invalidateDashboardCache)("wearable_progress_synced");
    return {
        progressId: created.id,
        recordedAt: created.recordedAt,
        bmi: created.bmi,
        dietCategory: created.dietCategory,
    };
}
async function syncWearableProgressForMember(memberUserId, input) {
    await assertMember(memberUserId);
    const normalized = normalizeMetrics(input);
    const dietCategory = normalized.bmi ? (0, bmi_1.categorizeBmi)(normalized.bmi) : null;
    const created = await prisma.progress.create({
        data: {
            userId: memberUserId,
            recordedById: memberUserId,
            weight: normalized.weight,
            height: normalized.height,
            bodyFat: normalized.bodyFat,
            bmi: normalized.bmi,
            dietCategory,
            notes: normalized.note,
            recordedAt: normalized.recordedAt,
        },
        select: {
            id: true,
            recordedAt: true,
            bmi: true,
            dietCategory: true,
        },
    });
    await (0, cache_1.invalidateDashboardCache)("wearable_progress_webhook_synced");
    return {
        progressId: created.id,
        recordedAt: created.recordedAt,
        bmi: created.bmi,
        dietCategory: created.dietCategory,
    };
}
exports.__wearableInternals = {
    normalizeMetrics,
};
//# sourceMappingURL=service.js.map