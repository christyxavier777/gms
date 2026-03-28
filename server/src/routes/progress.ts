import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import {
  createProgressSchema,
  listProgressQuerySchema,
  progressIdParamSchema,
  progressUserIdParamSchema,
} from "../progress/schemas";
import {
  createProgressEntry,
  deleteProgressEntry,
  getProgressByUserId,
  listAllProgress,
} from "../progress/service";

// Fitness progress routes.
export const progressRouter = Router();

progressRouter.post("/progress", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    if (req.auth.role !== Role.ADMIN && req.auth.role !== Role.TRAINER) {
      throw new HttpError(
        403,
        "PROGRESS_CREATE_FORBIDDEN",
        "You are not allowed to create progress entries",
      );
    }
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

progressRouter.get("/progress", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    if (req.auth.role !== Role.ADMIN) {
      throw new HttpError(403, "FORBIDDEN", "You are not allowed to access this resource");
    }
    const query = listProgressQuerySchema.parse(req.query);
    const result = await listAllProgress(query);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
    }
    throw error;
  }
});

progressRouter.get("/progress/:userId", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = progressUserIdParamSchema.parse(req.params);
    const query = listProgressQuerySchema.parse(req.query);
    const result = await getProgressByUserId(req.auth, params.userId, query);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request parameters are invalid", error.flatten());
    }
    throw error;
  }
});

progressRouter.delete("/progress/:id", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    if (req.auth.role !== Role.ADMIN) {
      throw new HttpError(403, "FORBIDDEN", "You are not allowed to access this resource");
    }
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
