import crypto from "crypto";
import { HttpError } from "../middleware/http-error";

export type WearableProvider = "FITBIT" | "APPLE_WATCH" | "GENERIC";

type VerifyInput = {
  provider: WearableProvider;
  rawBody: Buffer;
  timestampHeader: string | undefined;
  signatureHeader: string | undefined;
  toleranceSec: number;
  secrets: {
    fitbit: string;
    appleWatch: string;
    generic: string;
  };
};

function normalizeSignature(signatureHeader: string): string {
  const value = signatureHeader.trim();
  const prefixed = value.toLowerCase().startsWith("sha256=") ? value.slice(7) : value;
  return prefixed.trim().toLowerCase();
}

function getProviderSecret(
  provider: WearableProvider,
  secrets: VerifyInput["secrets"],
): string {
  if (provider === "FITBIT") return secrets.fitbit;
  if (provider === "APPLE_WATCH") return secrets.appleWatch;
  return secrets.generic;
}

export function verifyWearableWebhookSignature(input: VerifyInput): void {
  if (!input.timestampHeader || !input.signatureHeader) {
    throw new HttpError(401, "WEBHOOK_SIGNATURE_MISSING", "Missing webhook signature headers");
  }

  const timestampSec = Number.parseInt(input.timestampHeader, 10);
  if (!Number.isFinite(timestampSec)) {
    throw new HttpError(401, "WEBHOOK_SIGNATURE_INVALID", "Webhook timestamp header is invalid");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - timestampSec) > input.toleranceSec) {
    throw new HttpError(401, "WEBHOOK_SIGNATURE_EXPIRED", "Webhook timestamp is outside tolerance window");
  }

  const providerSecret = getProviderSecret(input.provider, input.secrets);
  if (!providerSecret) {
    throw new HttpError(500, "WEBHOOK_SECRET_MISSING", "Webhook secret is not configured for provider");
  }

  const payloadToSign = `${timestampSec}.${input.rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", providerSecret).update(payloadToSign).digest("hex");
  const received = normalizeSignature(input.signatureHeader);

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  if (expectedBuffer.length !== receivedBuffer.length) {
    throw new HttpError(401, "WEBHOOK_SIGNATURE_INVALID", "Webhook signature is invalid");
  }

  if (!crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new HttpError(401, "WEBHOOK_SIGNATURE_INVALID", "Webhook signature is invalid");
  }
}

export const __webhookSignatureInternals = {
  normalizeSignature,
};
