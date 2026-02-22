"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchUserStatusSchema = exports.listUsersQuerySchema = exports.userIdParamSchema = void 0;
const zod_1 = require("zod");
// Common UUID path parameter validator for user routes.
exports.userIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("User id must be a valid UUID"),
});
// Query validator for basic page-based pagination.
exports.listUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
// Payload validator for user status updates.
exports.patchUserStatusSchema = zod_1.z
    .object({
    status: zod_1.z.enum(["ACTIVE", "INACTIVE"]),
})
    .strict();
//# sourceMappingURL=schemas.js.map