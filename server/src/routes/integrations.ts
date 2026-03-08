import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { wearableSyncSchema } from "../integrations/schemas";
import { syncWearableProgress } from "../integrations/service";
import { HttpError } from "../middleware/http-error";
import { wearableSyncRateLimiter } from "../middleware/rate-limit";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";

export const integrationsRouter = Router();

integrationsRouter.post(
  "/integrations/wearables/sync",
  requireAuth,
  requireRole(Role.MEMBER),
  wearableSyncRateLimiter,
  async (req, res) => {
    try {
      if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
      const payload = wearableSyncSchema.parse(req.body);
      const synced = await syncWearableProgress(req.auth, payload);
      res.status(201).json({ synced });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new HttpError(400, "VALIDATION_ERROR", "Wearable payload is invalid", error.flatten());
      }
      throw error;
    }
  },
);
