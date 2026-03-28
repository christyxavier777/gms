-- CreateEnum
CREATE TYPE "public"."ScheduleSessionType" AS ENUM ('CLASS', 'PERSONAL_TRAINING', 'ASSESSMENT', 'RECOVERY');

-- CreateEnum
CREATE TYPE "public"."ScheduleBookingStatus" AS ENUM ('BOOKED', 'ATTENDED', 'MISSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."ScheduleSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sessionType" "public"."ScheduleSessionType" NOT NULL DEFAULT 'CLASS',
    "location" TEXT,
    "trainerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduleBooking" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "public"."ScheduleBookingStatus" NOT NULL DEFAULT 'BOOKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleSession_trainerId_startsAt_idx" ON "public"."ScheduleSession"("trainerId", "startsAt");

-- CreateIndex
CREATE INDEX "ScheduleSession_startsAt_endsAt_idx" ON "public"."ScheduleSession"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ScheduleBooking_memberId_status_idx" ON "public"."ScheduleBooking"("memberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleBooking_sessionId_memberId_key" ON "public"."ScheduleBooking"("sessionId", "memberId");

-- AddForeignKey
ALTER TABLE "public"."ScheduleSession" ADD CONSTRAINT "ScheduleSession_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleSession" ADD CONSTRAINT "ScheduleSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleBooking" ADD CONSTRAINT "ScheduleBooking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."ScheduleSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleBooking" ADD CONSTRAINT "ScheduleBooking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
