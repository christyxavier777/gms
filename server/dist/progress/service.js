"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgressEntry = createProgressEntry;
exports.listAllProgress = listAllProgress;
exports.getProgressByUserId = getProgressByUserId;
exports.deleteProgressEntry = deleteProgressEntry;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const bmi_1 = require("./bmi");
const cache_1 = require("../dashboard/cache");
const list_response_1 = require("../utils/list-response");
const prisma = (0, client_2.createPrismaClient)();
const progressDetailInclude = {
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
        },
    },
    recordedBy: {
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    },
};
function toSafeProgress(progress) {
    return {
        id: progress.id,
        userId: progress.userId,
        recordedById: progress.recordedById,
        weight: progress.weight,
        height: progress.height,
        bodyFat: progress.bodyFat,
        bmi: progress.bmi,
        dietCategory: progress.dietCategory,
        notes: progress.notes,
        recordedAt: progress.recordedAt,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
        member: {
            id: progress.user.id,
            name: progress.user.name,
            email: progress.user.email,
            phone: progress.user.phone,
            status: progress.user.status,
        },
        recorder: {
            id: progress.recordedBy.id,
            name: progress.recordedBy.name,
            email: progress.recordedBy.email,
            role: progress.recordedBy.role,
        },
    };
}
function buildProgressWhere(clauses) {
    const nonEmptyClauses = clauses.filter((clause) => Object.keys(clause).length > 0);
    if (nonEmptyClauses.length === 0) {
        return {};
    }
    return { AND: nonEmptyClauses };
}
async function assignDietPlanFromBmi(requester, memberUserId, category) {
    const template = (0, bmi_1.getDietTemplate)(category);
    await prisma.dietPlan.create({
        data: {
            title: template.title,
            description: template.description,
            createdById: requester.userId,
            assignedToId: memberUserId,
        },
    });
}
async function assertMemberUser(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!user) {
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    if (user.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(400, "INVALID_PROGRESS_TARGET", "Progress can only be recorded for members");
    }
}
async function isTrainerAssignedMember(trainerId, memberId) {
    const [workoutAssigned, dietAssigned, mappedAssignment] = await prisma.$transaction([
        prisma.workoutPlan.findFirst({
            where: { createdById: trainerId, assignedToId: memberId },
            select: { id: true },
        }),
        prisma.dietPlan.findFirst({
            where: { createdById: trainerId, assignedToId: memberId },
            select: { id: true },
        }),
        prisma.trainerMemberAssignment.findFirst({
            where: { trainerId, memberId, active: true },
            select: { id: true },
        }),
    ]);
    return Boolean(workoutAssigned || dietAssigned || mappedAssignment);
}
async function createProgressEntry(requester, payload) {
    if (requester.role !== client_1.Role.ADMIN && requester.role !== client_1.Role.TRAINER) {
        throw new http_error_1.HttpError(403, "PROGRESS_CREATE_FORBIDDEN", "You are not allowed to create progress entries");
    }
    await assertMemberUser(payload.userId);
    if (requester.role === client_1.Role.TRAINER) {
        const assigned = await isTrainerAssignedMember(requester.userId, payload.userId);
        if (!assigned) {
            throw new http_error_1.HttpError(403, "PROGRESS_TRAINER_MEMBER_SCOPE_FORBIDDEN", "You are not allowed to record progress for this member");
        }
    }
    const derivedBmi = payload.weight !== undefined &&
        payload.weight !== null &&
        payload.height !== undefined &&
        payload.height !== null
        ? (0, bmi_1.calculateBmi)(payload.weight, payload.height)
        : null;
    const bmiToStore = derivedBmi ?? payload.bmi ?? null;
    const category = bmiToStore ? (0, bmi_1.categorizeBmi)(bmiToStore) : null;
    const created = await prisma.progress.create({
        data: {
            userId: payload.userId,
            recordedById: requester.userId,
            weight: payload.weight ?? null,
            height: payload.height ?? null,
            bodyFat: payload.bodyFat ?? null,
            bmi: bmiToStore,
            dietCategory: category,
            notes: payload.notes ?? null,
            recordedAt: payload.recordedAt,
        },
        include: progressDetailInclude,
    });
    if (category) {
        await assignDietPlanFromBmi(requester, payload.userId, category);
    }
    await (0, cache_1.invalidateDashboardCache)("progress_created");
    return toSafeProgress(created);
}
async function listAllProgress(query) {
    const search = query.search.trim();
    const where = buildProgressWhere([
        query.dietCategory ? { dietCategory: query.dietCategory } : {},
        search.length > 0
            ? {
                OR: [
                    { notes: { contains: search, mode: "insensitive" } },
                    {
                        user: {
                            is: {
                                OR: [
                                    { name: { contains: search, mode: "insensitive" } },
                                    { email: { contains: search, mode: "insensitive" } },
                                    { phone: { contains: search, mode: "insensitive" } },
                                ],
                            },
                        },
                    },
                    {
                        recordedBy: {
                            is: {
                                OR: [
                                    { name: { contains: search, mode: "insensitive" } },
                                    { email: { contains: search, mode: "insensitive" } },
                                ],
                            },
                        },
                    },
                ],
            }
            : {},
    ]);
    const skip = (query.page - 1) * query.pageSize;
    const orderBy = query.sortBy === "createdAt"
        ? [{ createdAt: query.sortOrder }, { recordedAt: "desc" }]
        : [{ recordedAt: query.sortOrder }, { createdAt: "desc" }];
    const [rows, total] = await prisma.$transaction([
        prisma.progress.findMany({
            where,
            orderBy,
            skip,
            take: query.pageSize,
            include: progressDetailInclude,
        }),
        prisma.progress.count({ where }),
    ]);
    return {
        progress: rows.map(toSafeProgress),
        pagination: (0, list_response_1.createPaginationMeta)(query.page, query.pageSize, total),
        filters: {
            search,
            dietCategory: query.dietCategory ?? null,
        },
        sort: {
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        },
    };
}
async function getProgressByUserId(requester, memberUserId, query) {
    await assertMemberUser(memberUserId);
    if (requester.role === client_1.Role.MEMBER && requester.userId !== memberUserId) {
        throw new http_error_1.HttpError(403, "PROGRESS_MEMBER_SCOPE_FORBIDDEN", "You are not allowed to access this member progress");
    }
    if (requester.role === client_1.Role.TRAINER) {
        const assigned = await isTrainerAssignedMember(requester.userId, memberUserId);
        if (!assigned) {
            throw new http_error_1.HttpError(403, "PROGRESS_TRAINER_MEMBER_SCOPE_FORBIDDEN", "You are not allowed to access this member progress");
        }
    }
    const search = query.search.trim();
    const where = buildProgressWhere([
        { userId: memberUserId },
        query.dietCategory ? { dietCategory: query.dietCategory } : {},
        search.length > 0
            ? {
                OR: [
                    { notes: { contains: search, mode: "insensitive" } },
                    {
                        recordedBy: {
                            is: {
                                OR: [
                                    { name: { contains: search, mode: "insensitive" } },
                                    { email: { contains: search, mode: "insensitive" } },
                                ],
                            },
                        },
                    },
                ],
            }
            : {},
    ]);
    const skip = (query.page - 1) * query.pageSize;
    const orderBy = query.sortBy === "createdAt"
        ? [{ createdAt: query.sortOrder }, { recordedAt: "desc" }]
        : [{ recordedAt: query.sortOrder }, { createdAt: "desc" }];
    const [rows, total] = await prisma.$transaction([
        prisma.progress.findMany({
            where,
            orderBy,
            skip,
            take: query.pageSize,
            include: progressDetailInclude,
        }),
        prisma.progress.count({ where }),
    ]);
    return {
        progress: rows.map(toSafeProgress),
        pagination: (0, list_response_1.createPaginationMeta)(query.page, query.pageSize, total),
        filters: {
            search,
            dietCategory: query.dietCategory ?? null,
        },
        sort: {
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        },
    };
}
async function deleteProgressEntry(progressId) {
    try {
        await prisma.progress.delete({ where: { id: progressId } });
        await (0, cache_1.invalidateDashboardCache)("progress_deleted");
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new http_error_1.HttpError(404, "PROGRESS_NOT_FOUND", "Progress entry not found");
        }
        throw error;
    }
}
//# sourceMappingURL=service.js.map