-- CreateEnum
CREATE TYPE "public"."WearableWebhookProvider" AS ENUM ('FITBIT', 'APPLE_WATCH', 'GENERIC', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."WearableWebhookAuditStatus" AS ENUM (
    'SIGNATURE_VALID',
    'RESERVED',
    'DUPLICATE',
    'RECEIVED',
    'PROCESSED',
    'FAILED',
    'REJECTED',
    'FINALIZED_PROCESSED',
    'FINALIZED_RELEASED'
);

-- CreateTable
CREATE TABLE "public"."WearableWebhookAuditEvent" (
    "id" TEXT NOT NULL,
    "provider" "public"."WearableWebhookProvider" NOT NULL,
    "status" "public"."WearableWebhookAuditStatus" NOT NULL,
    "requestId" TEXT,
    "eventId" TEXT,
    "memberUserId" TEXT,
    "errorCode" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WearableWebhookAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WearableWebhookAuditEvent_createdAt_idx" ON "public"."WearableWebhookAuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "WearableWebhookAuditEvent_provider_createdAt_idx" ON "public"."WearableWebhookAuditEvent"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "WearableWebhookAuditEvent_status_createdAt_idx" ON "public"."WearableWebhookAuditEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WearableWebhookAuditEvent_provider_eventId_createdAt_idx" ON "public"."WearableWebhookAuditEvent"("provider", "eventId", "createdAt");
