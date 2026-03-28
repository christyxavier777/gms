-- AlterTable
ALTER TABLE "public"."Payment"
ADD COLUMN "amountMinor" INTEGER,
ADD COLUMN "reviewedById" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "verificationNotes" TEXT;

-- Backfill amountMinor from legacy float amount before dropping the old column.
UPDATE "public"."Payment"
SET "amountMinor" = ROUND("amount" * 100)::INTEGER;

ALTER TABLE "public"."Payment"
ALTER COLUMN "amountMinor" SET NOT NULL;

ALTER TABLE "public"."Payment"
DROP COLUMN "amount";

-- CreateTable
CREATE TABLE "public"."PaymentEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "fromStatus" "public"."PaymentStatus",
    "toStatus" "public"."PaymentStatus" NOT NULL,
    "changedById" TEXT,
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- Seed an initial immutable event row for existing payments.
INSERT INTO "public"."PaymentEvent" ("id", "paymentId", "fromStatus", "toStatus", "changedById", "verificationNotes", "createdAt")
SELECT CONCAT('legacy-', SUBSTRING(MD5("id" || "createdAt"::TEXT) FROM 1 FOR 24)), "id", NULL, "status", NULL, NULL, "createdAt"
FROM "public"."Payment";

-- CreateIndex
CREATE INDEX "Payment_reviewedById_status_idx" ON "public"."Payment"("reviewedById", "status");

-- CreateIndex
CREATE INDEX "PaymentEvent_paymentId_createdAt_idx" ON "public"."PaymentEvent"("paymentId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentEvent_changedById_createdAt_idx" ON "public"."PaymentEvent"("changedById", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentEvent" ADD CONSTRAINT "PaymentEvent_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
