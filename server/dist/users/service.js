"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.listAccessibleMembers = listAccessibleMembers;
exports.getUserById = getUserById;
exports.updateUserStatus = updateUserStatus;
exports.deleteUser = deleteUser;
exports.trainerCanReadMember = trainerCanReadMember;
exports.canReadUser = canReadUser;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const cache_1 = require("../dashboard/cache");
const list_response_1 = require("../utils/list-response");
const prisma = (0, client_2.createPrismaClient)();
const safeUserSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
};
function toSafeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
async function listUsers(options) {
    const skip = (options.page - 1) * options.pageSize;
    const search = options.search.trim();
    const where = {
        ...(options.role ? { role: options.role } : {}),
        ...(options.status ? { status: options.status } : {}),
        ...(search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } },
                ],
            }
            : {}),
    };
    const orderBy = options.sortBy === "name"
        ? [{ name: options.sortOrder }, { createdAt: "desc" }]
        : options.sortBy === "email"
            ? [{ email: options.sortOrder }, { createdAt: "desc" }]
            : [{ createdAt: options.sortOrder }];
    const [rows, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            orderBy,
            skip,
            take: options.pageSize,
            select: safeUserSelect,
        }),
        prisma.user.count({ where }),
    ]);
    return {
        users: rows.map(toSafeUser),
        pagination: (0, list_response_1.createPaginationMeta)(options.page, options.pageSize, total),
        filters: {
            search,
            role: options.role ?? null,
            status: options.status ?? null,
        },
        sort: {
            sortBy: options.sortBy,
            sortOrder: options.sortOrder,
        },
    };
}
async function listAccessibleMembers(requester, options) {
    if (requester.role !== client_1.Role.ADMIN && requester.role !== client_1.Role.TRAINER) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access member directory data");
    }
    const search = options.search.trim();
    const searchFilter = search.length > 0
        ? {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ],
        }
        : {};
    const scopeFilter = requester.role === client_1.Role.TRAINER
        ? {
            memberAssignments: {
                some: {
                    trainerId: requester.userId,
                    active: true,
                },
            },
        }
        : {};
    const rows = await prisma.user.findMany({
        where: {
            role: client_1.Role.MEMBER,
            ...scopeFilter,
            ...searchFilter,
        },
        orderBy: [{ name: "asc" }, { createdAt: "desc" }],
        take: options.limit,
        select: safeUserSelect,
    });
    return rows.map(toSafeUser);
}
async function getUserById(id) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: safeUserSelect,
    });
    if (!user) {
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    return toSafeUser(user);
}
async function updateUserStatus(id, status) {
    try {
        const user = await prisma.user.update({
            where: { id },
            data: { status },
            select: safeUserSelect,
        });
        await (0, cache_1.invalidateDashboardCache)("user_status_updated");
        return toSafeUser(user);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
        }
        throw error;
    }
}
async function deleteUser(id) {
    try {
        await prisma.user.delete({ where: { id } });
        await (0, cache_1.invalidateDashboardCache)("user_deleted");
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
        }
        throw error;
    }
}
async function trainerCanReadMember(trainerId, memberId) {
    const assignment = await prisma.trainerMemberAssignment.findFirst({
        where: { trainerId, memberId, active: true },
        select: { id: true },
    });
    return Boolean(assignment);
}
async function canReadUser(requester, targetUserId) {
    if (requester.role === client_1.Role.ADMIN)
        return true;
    if (requester.userId === targetUserId)
        return true;
    if (requester.role === client_1.Role.TRAINER)
        return trainerCanReadMember(requester.userId, targetUserId);
    return false;
}
//# sourceMappingURL=service.js.map