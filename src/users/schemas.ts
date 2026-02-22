import { z } from "zod";

// Common UUID path parameter validator for user routes.
export const userIdParamSchema = z.object({
  id: z.string().uuid("User id must be a valid UUID"),
});

// Query validator for basic page-based pagination.
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Payload validator for user status updates.
export const patchUserStatusSchema = z
  .object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .strict();
