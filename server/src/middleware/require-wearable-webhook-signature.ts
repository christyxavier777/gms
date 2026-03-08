import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { HttpError } from "./http-error";
import { verifyWearableWebhookSignature } from "../integrations/webhook-signature";
import { logInfo } from "../utils/logger";

export async function requireWearableWebhookSignature(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const provider = req.header("x-wearable-provider");
  if (provider !== "FITBIT" && provider !== "APPLE_WATCH" && provider !== "GENERIC") {
    throw new HttpError(400, "INVALID_WEARABLE_PROVIDER", "x-wearable-provider must be FITBIT, APPLE_WATCH, or GENERIC");
  }

  if (!req.rawBody) {
    throw new HttpError(400, "WEBHOOK_RAW_BODY_MISSING", "Raw webhook body is missing");
  }

  verifyWearableWebhookSignature({
    provider,
    rawBody: req.rawBody,
    timestampHeader: req.header("x-wearable-timestamp") ?? undefined,
    signatureHeader: req.header("x-wearable-signature") ?? undefined,
    toleranceSec: env.wearableWebhookToleranceSec,
    secrets: env.wearableWebhookSecrets,
  });

  logInfo("wearable_webhook_signature_valid", {
    requestId: req.requestId,
    provider,
    eventId: req.header("x-wearable-event-id") ?? null,
  });

  next();
}
