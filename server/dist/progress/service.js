"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgressEntry = createProgressEntry;
exports.listAllProgress = listAllProgress;
exports.getProgressByUserId = getProgressByUserId;
exports.deleteProgressEntry = deleteProgressEntry;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const prisma = (0, client_2.createPrismaClient)();
function toSafeProgress(progress) {
    return {
        id: progress.id,
        userId: progress.userId,
        recordedById: progress.recordedById,
        weight: progress.weight,
        bodyFat: progress.bodyFat,
        bmi: progress.bmi,
        notes: progress.notes,
        recordedAt: progress.recordedAt,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
    };
}
async function assertMemberUser(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    if (user.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(400, "INVALID_PROGRESS_TARGET", "Progress can only be recorded for members");
    }
    return user;
}
async function isTrainerAssignedMember(trainerId, memberId) {
    const [workoutAssigned, dietAssigned] = await prisma.$transaction([
        prisma.workoutPlan.findFirst({
            where: {
                createdById: trainerId,
                assignedToId: memberId,
            },
            select: { id: true },
        }),
        prisma.dietPlan.findFirst({
            where: {
                createdById: trainerId,
                assignedToId: memberId,
            },
            select: { id: true },
        }),
    ]);
    return Boolean(workoutAssigned || dietAssigned);
}
// Creates a progress entry for a member by ADMIN or TRAINER.
async function createProgressEntry(requester, payload) {
    if (requester.role !== client_1.Role.ADMIN && requester.role !== client_1.Role.TRAINER) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to create progress entries");
    }
    await assertMemberUser(payload.userId);
    if (requester.role === client_1.Role.TRAINER) {
        const assigned = await isTrainerAssignedMember(requester.userId, payload.userId);
        if (!assigned) {
            throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to record progress for this member");
        }
    }
    const created = await prisma.progress.create({
        data: {
            userId: payload.userId,
            recordedById: requester.userId,
            weight: payload.weight ?? null,
            bodyFat: payload.bodyFat ?? null,
            bmi: payload.bmi ?? null,
            notes: payload.notes ?? null,
            recordedAt: payload.recordedAt,
        },
    });
    return toSafeProgress(created);
}
// Returns all progress entries for ADMIN, newest first.
async function listAllProgress() {
    const rows = await prisma.progress.findMany({
        orderBy: { recordedAt: "desc" },
    });
    return rows.map(toSafeProgress);
}
// Returns progress entries by member with role-based access checks.
async function getProgressByUserId(requester, memberUserId) {
    await assertMemberUser(memberUserId);
    if (requester.role === client_1.Role.MEMBER && requester.userId !== memberUserId) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access this member progress");
    }
    if (requester.role === client_1.Role.TRAINER) {
        const assigned = await isTrainerAssignedMember(requester.userId, memberUserId);
        if (!assigned) {
            throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access this member progress");
        }
    }
    const rows = await prisma.progress.findMany({
        where: { userId: memberUserId },
        orderBy: { recordedAt: "desc" },
    });
    return rows.map(toSafeProgress);
}
// Hard-deletes one progress entry (ADMIN correction flow).
async function deleteProgressEntry(progressId) {
    try {
        await prisma.progress.delete({ where: { id: progressId } });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new http_error_1.HttpError(404, "PROGRESS_NOT_FOUND", "Progress entry not found");
        }
        throw error;
    }
}
//# sourceMappingURL=service.js.map