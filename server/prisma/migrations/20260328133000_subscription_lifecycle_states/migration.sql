-- Add richer subscription lifecycle states for onboarding activation and scheduled cancellation.
ALTER TYPE "public"."SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING_ACTIVATION';
ALTER TYPE "public"."SubscriptionStatus" ADD VALUE IF NOT EXISTS 'CANCELLED_AT_PERIOD_END';
