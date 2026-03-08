import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { wearableSyncSchema, wearableWebhookSyncSchema } from "../integrations/schemas";
import { syncWearableProgress, syncWearableProgressForMember } from "../integrations/service";
import { HttpError } from "../middleware/http-error";
import { wearableSyncRateLimiter } from "../middleware/rate-limit";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { requireWearableWebhookSignature } from "../middleware/require-wearable-webhook-signature";

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

integrationsRouter.post(
  "/integrations/wearables/webhook",
  wearableSyncRateLimiter,
  requireWearableWebhookSignature,
  async (req, res) => {
    try {
      const payload = wearableWebhookSyncSchema.parse(req.body);
      const synced = await syncWearableProgressForMember(payload.memberUserId, payload);
      res.status(201).json({ synced });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new HttpError(400, "VALIDATION_ERROR", "Wearable webhook payload is invalid", error.flatten());
      }
      throw error;
    }
  },
);
