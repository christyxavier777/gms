import { Role, UserStatus } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { deleteUser, getUserById, listUsers, canReadUser, updateUserStatus } from "../users/service";
import { listUsersQuerySchema, patchUserStatusSchema, userIdParamSchema } from "../users/schemas";

// User lifecycle management routes with strict role controls.
export const usersRouter = Router();

usersRouter.get("/users", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  try {
    const query = listUsersQuerySchema.parse(req.query);
    const result = await listUsers(query.page, query.pageSize);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
    }
    throw error;
  }
});

usersRouter.get("/users/:id", requireAuth, async (req, res) => {
  try {
    const params = userIdParamSchema.parse(req.params);

    if (!req.auth) {
      throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    }

    const allowed = canReadUser(req.auth, params.id);
    if (!allowed) {
      throw new HttpError(403, "FORBIDDEN", "You are not allowed to access this resource");
    }

    const user = await getUserById(params.id);
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});

usersRouter.patch("/users/:id/status", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  try {
    const params = userIdParamSchema.parse(req.params);
    const payload = patchUserStatusSchema.parse(req.body);
    const user = await updateUserStatus(params.id, payload.status as UserStatus);
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});

usersRouter.delete("/users/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  try {
    const params = userIdParamSchema.parse(req.params);
    if (!req.auth) {
      throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    }
    if (req.auth.userId === params.id) {
      throw new HttpError(400, "ADMIN_SELF_DELETE_BLOCKED", "Admin cannot delete own account");
    }

    await deleteUser(params.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});
