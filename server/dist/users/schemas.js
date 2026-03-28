"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchUserStatusSchema = exports.accessibleMembersQuerySchema = exports.listUsersQuerySchema = exports.userIdParamSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
// Common UUID path parameter validator for user routes.
exports.userIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("User id must be a valid UUID"),
});
// Query validator for basic page-based pagination.
exports.listUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().trim().max(100).default(""),
    role: zod_1.z.enum([client_1.Role.ADMIN, client_1.Role.TRAINER, client_1.Role.MEMBER]).optional(),
    status: zod_1.z.enum([client_1.UserStatus.ACTIVE, client_1.UserStatus.INACTIVE]).optional(),
    sortBy: zod_1.z.enum(["createdAt", "name", "email"]).default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
exports.accessibleMembersQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().max(100).optional().default(""),
    limit: zod_1.z.coerce.number().int().min(1).max(200).default(100),
});
// Payload validator for user status updates.
exports.patchUserStatusSchema = zod_1.z
    .object({
    status: zod_1.z.enum(["ACTIVE", "INACTIVE"]),
})
    .strict();
//# sourceMappingURL=schemas.js.map