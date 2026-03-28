import { Role, UserStatus } from "@prisma/client";
import { z } from "zod";

// Common UUID path parameter validator for user routes.
export const userIdParamSchema = z.object({
  id: z.string().uuid("User id must be a valid UUID"),
});

// Query validator for basic page-based pagination.
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).default(""),
  role: z.enum([Role.ADMIN, Role.TRAINER, Role.MEMBER]).optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE]).optional(),
  sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const accessibleMembersQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

// Payload validator for user status updates.
export const patchUserStatusSchema = z
  .object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .strict();
