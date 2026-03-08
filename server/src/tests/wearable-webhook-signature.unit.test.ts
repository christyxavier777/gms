import crypto from "crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { HttpError } from "../middleware/http-error";
import { verifyWearableWebhookSignature } from "../integrations/webhook-signature";

const secrets = {
  fitbit: "fitbit-secret",
  appleWatch: "apple-secret",
  generic: "generic-secret",
};

function signedHeaders(rawBody: string, timestampSec: number, secret: string): { timestamp: string; signature: string } {
  const payload = `${timestampSec}.${rawBody}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return { timestamp: String(timestampSec), signature: `sha256=${signature}` };
}

test("verifyWearableWebhookSignature accepts valid signature", () => {
  const rawBody = JSON.stringify({ memberUserId: "11111111-1111-1111-1111-111111111111", source: "FITBIT" });
  const timestampSec = Math.floor(Date.now() / 1000);
  const headers = signedHeaders(rawBody, timestampSec, secrets.fitbit);

  assert.doesNotThrow(() =>
    verifyWearableWebhookSignature({
      provider: "FITBIT",
      rawBody: Buffer.from(rawBody, "utf8"),
      timestampHeader: headers.timestamp,
      signatureHeader: headers.signature,
      toleranceSec: 300,
      secrets,
    }),
  );
});

test("verifyWearableWebhookSignature rejects invalid signature", () => {
  const rawBody = JSON.stringify({ memberUserId: "11111111-1111-1111-1111-111111111111", source: "FITBIT" });
  const timestampSec = Math.floor(Date.now() / 1000);

  assert.throws(
    () =>
      verifyWearableWebhookSignature({
        provider: "FITBIT",
        rawBody: Buffer.from(rawBody, "utf8"),
        timestampHeader: String(timestampSec),
        signatureHeader: "sha256=deadbeef",
        toleranceSec: 300,
        secrets,
      }),
    (error) => error instanceof HttpError && error.code === "WEBHOOK_SIGNATURE_INVALID",
  );
});

test("verifyWearableWebhookSignature rejects stale timestamps", () => {
  const rawBody = JSON.stringify({ memberUserId: "11111111-1111-1111-1111-111111111111", source: "FITBIT" });
  const staleTimestampSec = Math.floor(Date.now() / 1000) - 3600;
  const headers = signedHeaders(rawBody, staleTimestampSec, secrets.fitbit);

  assert.throws(
    () =>
      verifyWearableWebhookSignature({
        provider: "FITBIT",
        rawBody: Buffer.from(rawBody, "utf8"),
        timestampHeader: headers.timestamp,
        signatureHeader: headers.signature,
        toleranceSec: 300,
        secrets,
      }),
    (error) => error instanceof HttpError && error.code === "WEBHOOK_SIGNATURE_EXPIRED",
  );
});
