"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUserById = getUserById;
exports.updateUserStatus = updateUserStatus;
exports.deleteUser = deleteUser;
exports.trainerCanReadMember = trainerCanReadMember;
exports.canReadUser = canReadUser;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const prisma = (0, client_2.createPrismaClient)();
function toSafeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
// Returns a paginated list of users for ADMIN-only management views.
async function listUsers(page, pageSize) {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await prisma.$transaction([
        prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
        }),
        prisma.user.count(),
    ]);
    return {
        users: rows.map(toSafeUser),
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
    };
}
// Reads a single user profile in safe response form.
async function getUserById(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    return toSafeUser(user);
}
// Updates only lifecycle status for a user.
async function updateUserStatus(id, status) {
    try {
        const user = await prisma.user.update({
            where: { id },
            data: { status },
        });
        return toSafeUser(user);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
        }
        throw error;
    }
}
// Hard-deletes a user account by identifier.
async function deleteUser(id) {
    try {
        await prisma.user.delete({ where: { id } });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
        }
        throw error;
    }
}
// Phase 2 stub: trainer-to-member assignment check intentionally unimplemented.
function trainerCanReadMember(_trainerId, _memberId) {
    return false;
}
// Enforces view access for /users/:id according to Phase 2 constraints.
function canReadUser(requester, targetUserId) {
    if (requester.role === client_1.Role.ADMIN)
        return true;
    if (requester.userId === targetUserId)
        return true;
    if (requester.role === client_1.Role.TRAINER)
        return trainerCanReadMember(requester.userId, targetUserId);
    return false;
}
//# sourceMappingURL=service.js.map