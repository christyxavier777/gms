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
import { logError, logInfo } from "../utils/logger";
import { recordWearableWebhookAudit } from "../observability/wearable-webhook-metrics";
import {
  finalizeWearableWebhookEvent,
  requireWearableWebhookIdempotency,
} from "../middleware/wearable-webhook-idempotency";

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
  requireWearableWebhookIdempotency,
  async (req, res) => {
    let dedupeKey: string | undefined = req.wearableWebhook?.dedupeKey;
    const provider = req.wearableWebhook?.provider;
    const eventId = req.wearableWebhook?.eventId;
    try {
      logInfo("wearable_webhook_received", {
        requestId: req.requestId,
        provider,
        eventId,
      });
      if (provider) {
        recordWearableWebhookAudit("RECEIVED", provider);
      }

      const payload = wearableWebhookSyncSchema.parse(req.body);
      const synced = await syncWearableProgressForMember(payload.memberUserId, payload);
      if (dedupeKey) {
        await finalizeWearableWebhookEvent(dedupeKey, true, {
          requestId: req.requestId,
          provider,
          eventId,
          memberUserId: payload.memberUserId,
        });
      }
      logInfo("wearable_webhook_processed", {
        requestId: req.requestId,
        provider,
        eventId,
        memberUserId: payload.memberUserId,
        progressId: synced.progressId,
      });
      if (provider) {
        recordWearableWebhookAudit("PROCESSED", provider);
      }
      res.status(201).json({ synced });
    } catch (error) {
      if (dedupeKey) {
        await finalizeWearableWebhookEvent(dedupeKey, false, {
          requestId: req.requestId,
          provider,
          eventId,
          memberUserId: typeof req.body?.memberUserId === "string" ? req.body.memberUserId : undefined,
        });
      }
      logError("wearable_webhook_failed", {
        requestId: req.requestId,
        provider,
        eventId,
        memberUserId: typeof req.body?.memberUserId === "string" ? req.body.memberUserId : undefined,
        errorCode: error instanceof HttpError ? error.code : "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "unknown",
      });
      if (provider) {
        recordWearableWebhookAudit("FAILED", provider);
      }
      if (error instanceof ZodError) {
        throw new HttpError(400, "VALIDATION_ERROR", "Wearable webhook payload is invalid", error.flatten());
      }
      throw error;
    }
  },
);
