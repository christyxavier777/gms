import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { createProgressSchema, progressIdParamSchema, progressUserIdParamSchema } from "../progress/schemas";
import {
  createProgressEntry,
  deleteProgressEntry,
  getProgressByUserId,
  listAllProgress,
} from "../progress/service";

// Fitness progress routes.
export const progressRouter = Router();

progressRouter.post("/progress", requireAuth, requireRole(Role.ADMIN, Role.TRAINER), async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const payload = createProgressSchema.parse(req.body);
    const progress = await createProgressEntry(req.auth, payload);
    res.status(201).json({ progress });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});

progressRouter.get("/progress", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const progress = await listAllProgress();
  res.status(200).json({ progress });
});

progressRouter.get("/progress/:userId", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = progressUserIdParamSchema.parse(req.params);
    const progress = await getProgressByUserId(req.auth, params.userId);
    res.status(200).json({ progress });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});

progressRouter.delete("/progress/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  try {
    const params = progressIdParamSchema.parse(req.params);
    await deleteProgressEntry(params.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});
