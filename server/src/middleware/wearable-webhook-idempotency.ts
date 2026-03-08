import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { cacheDel, cacheSet, cacheSetIfAbsent } from "../cache/client";
import { HttpError } from "./http-error";
import { logInfo } from "../utils/logger";
import { recordWearableWebhookAudit } from "../observability/wearable-webhook-metrics";

const WEBHOOK_DEDUPE_PREFIX = "wearable:webhook:event:";
const IN_FLIGHT_TTL_SEC = 120;

function normalizeEventId(raw: string): string {
  const value = raw.trim();
  if (!/^[a-zA-Z0-9:_-]{8,128}$/.test(value)) {
    throw new HttpError(400, "INVALID_WEBHOOK_EVENT_ID", "x-wearable-event-id format is invalid");
  }
  return value;
}

function webhookDedupeKey(provider: string, eventId: string): string {
  return `${WEBHOOK_DEDUPE_PREFIX}${provider}:${eventId}`;
}

export async function requireWearableWebhookIdempotency(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const provider = req.header("x-wearable-provider");
  if (provider !== "FITBIT" && provider !== "APPLE_WATCH" && provider !== "GENERIC") {
    throw new HttpError(400, "INVALID_WEARABLE_PROVIDER", "x-wearable-provider must be FITBIT, APPLE_WATCH, or GENERIC");
  }

  const eventIdHeader = req.header("x-wearable-event-id");
  if (!eventIdHeader) {
    throw new HttpError(400, "WEBHOOK_EVENT_ID_MISSING", "x-wearable-event-id header is required");
  }
  const eventId = normalizeEventId(eventIdHeader);
  const dedupeKey = webhookDedupeKey(provider, eventId);

  const reserved = await cacheSetIfAbsent(dedupeKey, "in_flight", IN_FLIGHT_TTL_SEC);
  if (!reserved) {
    logInfo("wearable_webhook_duplicate", {
      requestId: req.requestId,
      provider,
      eventId,
    });
    recordWearableWebhookAudit("DUPLICATE", provider, {
      requestId: req.requestId,
      eventId,
    });
    throw new HttpError(409, "DUPLICATE_WEBHOOK_EVENT", "Webhook event already processed or in progress");
  }

  logInfo("wearable_webhook_reserved", {
    requestId: req.requestId,
    provider,
    eventId,
  });
  recordWearableWebhookAudit("RESERVED", provider, {
    requestId: req.requestId,
    eventId,
  });
  req.wearableWebhook = { provider, eventId, dedupeKey };
  next();
}

export async function finalizeWearableWebhookEvent(
  dedupeKey: string,
  success: boolean,
  context?: {
    requestId?: string | undefined;
    provider?: string | undefined;
    eventId?: string | undefined;
    memberUserId?: string | undefined;
  },
): Promise<void> {
  if (success) {
    await cacheSet(dedupeKey, "processed", env.wearableWebhookDedupeTtlSec);
    logInfo("wearable_webhook_finalized", {
      requestId: context?.requestId,
      provider: context?.provider,
      eventId: context?.eventId,
      memberUserId: context?.memberUserId,
      status: "processed",
    });
    if (context?.provider === "FITBIT" || context?.provider === "APPLE_WATCH" || context?.provider === "GENERIC") {
      recordWearableWebhookAudit("FINALIZED_PROCESSED", context.provider, {
        requestId: context?.requestId,
        eventId: context?.eventId,
        memberUserId: context?.memberUserId,
      });
    } else {
      recordWearableWebhookAudit("FINALIZED_PROCESSED", "UNKNOWN", {
        requestId: context?.requestId,
        eventId: context?.eventId,
        memberUserId: context?.memberUserId,
      });
    }
    return;
  }
  await cacheDel(dedupeKey);
  logInfo("wearable_webhook_finalized", {
    requestId: context?.requestId,
    provider: context?.provider,
    eventId: context?.eventId,
    memberUserId: context?.memberUserId,
    status: "released_for_retry",
  });
  if (context?.provider === "FITBIT" || context?.provider === "APPLE_WATCH" || context?.provider === "GENERIC") {
    recordWearableWebhookAudit("FINALIZED_RELEASED", context.provider, {
      requestId: context?.requestId,
      eventId: context?.eventId,
      memberUserId: context?.memberUserId,
    });
  } else {
    recordWearableWebhookAudit("FINALIZED_RELEASED", "UNKNOWN", {
      requestId: context?.requestId,
      eventId: context?.eventId,
      memberUserId: context?.memberUserId,
    });
  }
}
