-- CreateTable
CREATE TABLE "public"."MembershipPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "perks" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- Seed the canonical membership plan catalog.
INSERT INTO "public"."MembershipPlan" ("id", "name", "priceMinor", "durationDays", "perks", "active", "displayOrder")
VALUES
    ('basic-monthly', 'Basic Monthly', 124900, 30, 'Gym floor access + starter plan', true, 10),
    ('pro-quarterly', 'Pro Quarterly', 349900, 90, 'Trainer check-ins + diet guidance', true, 20),
    ('elite-annual', 'Elite Annual', 699900, 365, 'Priority coaching + premium tracking', true, 30);

-- Preserve old free-text plans by importing them as inactive legacy catalog rows.
INSERT INTO "public"."MembershipPlan" ("id", "name", "priceMinor", "durationDays", "perks", "active", "displayOrder")
SELECT
    CONCAT('legacy-', SUBSTRING(MD5("planName") FROM 1 FOR 24)) AS "id",
    "planName" AS "name",
    0 AS "priceMinor",
    GREATEST(1, MAX((DATE_PART('day', "endDate"::timestamp - "startDate"::timestamp))::INTEGER)) AS "durationDays",
    'Imported legacy subscription plan' AS "perks",
    false AS "active",
    1000 AS "displayOrder"
FROM "public"."Subscription"
WHERE "planName" NOT IN ('Basic Monthly', 'Pro Quarterly', 'Elite Annual')
GROUP BY "planName";

-- AlterTable
ALTER TABLE "public"."Subscription"
ADD COLUMN "planId" TEXT;

-- Backfill the new relation from existing plan names.
UPDATE "public"."Subscription"
SET "planId" = CASE
    WHEN "planName" = 'Basic Monthly' THEN 'basic-monthly'
    WHEN "planName" = 'Pro Quarterly' THEN 'pro-quarterly'
    WHEN "planName" = 'Elite Annual' THEN 'elite-annual'
    ELSE CONCAT('legacy-', SUBSTRING(MD5("planName") FROM 1 FOR 24))
END;

ALTER TABLE "public"."Subscription"
ALTER COLUMN "planId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "MembershipPlan_active_displayOrder_idx" ON "public"."MembershipPlan"("active", "displayOrder");

-- CreateIndex
CREATE INDEX "Subscription_planId_status_idx" ON "public"."Subscription"("planId", "status");

-- AddForeignKey
ALTER TABLE "public"."Subscription"
ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
