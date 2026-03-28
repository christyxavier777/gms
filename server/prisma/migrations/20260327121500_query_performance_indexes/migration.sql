-- CreateIndex
CREATE INDEX "User_role_status_createdAt_idx" ON "public"."User"("role", "status", "createdAt");

-- CreateIndex
CREATE INDEX "User_role_status_name_idx" ON "public"."User"("role", "status", "name");

-- CreateIndex
CREATE INDEX "WorkoutPlan_createdById_assignedToId_idx" ON "public"."WorkoutPlan"("createdById", "assignedToId");

-- CreateIndex
CREATE INDEX "WorkoutPlan_assignedToId_createdAt_idx" ON "public"."WorkoutPlan"("assignedToId", "createdAt");

-- CreateIndex
CREATE INDEX "DietPlan_createdById_assignedToId_idx" ON "public"."DietPlan"("createdById", "assignedToId");

-- CreateIndex
CREATE INDEX "DietPlan_assignedToId_createdAt_idx" ON "public"."DietPlan"("assignedToId", "createdAt");

-- CreateIndex
CREATE INDEX "Subscription_userId_createdAt_idx" ON "public"."Subscription"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Subscription_status_createdAt_idx" ON "public"."Subscription"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Subscription_status_startDate_idx" ON "public"."Subscription"("status", "startDate");

-- CreateIndex
CREATE INDEX "Subscription_status_endDate_idx" ON "public"."Subscription"("status", "endDate");

-- CreateIndex
CREATE INDEX "Progress_dietCategory_recordedAt_idx" ON "public"."Progress"("dietCategory", "recordedAt");

-- CreateIndex
CREATE INDEX "Progress_createdAt_idx" ON "public"."Progress"("createdAt");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_expiresAt_createdAt_idx" ON "public"."Session"("userId", "revokedAt", "expiresAt", "createdAt");

-- CreateIndex
CREATE INDEX "TrainerMemberAssignment_trainerId_active_idx" ON "public"."TrainerMemberAssignment"("trainerId", "active");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "public"."Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "public"."Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_updatedAt_idx" ON "public"."Payment"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ScheduleBooking_memberId_updatedAt_idx" ON "public"."ScheduleBooking"("memberId", "updatedAt");
