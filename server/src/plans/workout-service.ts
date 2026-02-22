import { Prisma, Role, User, WorkoutPlan } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { SafePlan } from "./types";

const prisma = createPrismaClient();

function toSafeWorkoutPlan(plan: WorkoutPlan): SafePlan {
  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    assignedToId: plan.assignedToId,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

function canManageWorkoutPlan(requester: { userId: string; role: Role }, plan: WorkoutPlan): boolean {
  if (requester.role === Role.ADMIN) return true;
  if (requester.role === Role.TRAINER && plan.createdById === requester.userId) return true;
  return false;
}

function canReadWorkoutPlan(requester: { userId: string; role: Role }, plan: WorkoutPlan): boolean {
  if (requester.role === Role.ADMIN) return true;
  if (requester.role === Role.TRAINER && plan.createdById === requester.userId) return true;
  if (requester.role === Role.MEMBER && plan.assignedToId === requester.userId) return true;
  return false;
}

async function assertAssignableMember(memberId: string): Promise<User> {
  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member) {
    throw new HttpError(404, "USER_NOT_FOUND", "Assigned user not found");
  }
  if (member.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_ASSIGNMENT_TARGET", "Plans can only be assigned to members");
  }
  return member;
}

// Creates a workout plan owned by ADMIN or TRAINER.
export async function createWorkoutPlan(
  requester: { userId: string; role: Role },
  payload: { title: string; description: string },
): Promise<SafePlan> {
  if (requester.role !== Role.ADMIN && requester.role !== Role.TRAINER) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to create workout plans");
  }

  const plan = await prisma.workoutPlan.create({
    data: {
      title: payload.title,
      description: payload.description,
      createdById: requester.userId,
    },
  });

  return toSafeWorkoutPlan(plan);
}

// Lists workout plans scoped to the caller role.
export async function listWorkoutPlans(requester: { userId: string; role: Role }): Promise<SafePlan[]> {
  let where: Prisma.WorkoutPlanWhereInput = {};
  if (requester.role === Role.TRAINER) {
    where = { createdById: requester.userId };
  } else if (requester.role === Role.MEMBER) {
    where = { assignedToId: requester.userId };
  }

  const plans = await prisma.workoutPlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return plans.map(toSafeWorkoutPlan);
}

// Reads a single workout plan with role-based visibility.
export async function getWorkoutPlanById(
  requester: { userId: string; role: Role },
  planId: string,
): Promise<SafePlan> {
  const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new HttpError(404, "WORKOUT_PLAN_NOT_FOUND", "Workout plan not found");
  }
  if (!canReadWorkoutPlan(requester, plan)) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to access this workout plan");
  }
  return toSafeWorkoutPlan(plan);
}

// Updates workout plan title/description with ownership checks.
export async function updateWorkoutPlan(
  requester: { userId: string; role: Role },
  planId: string,
  payload: { title?: string | undefined; description?: string | undefined },
): Promise<SafePlan> {
  const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new HttpError(404, "WORKOUT_PLAN_NOT_FOUND", "Workout plan not found");
  }
  if (!canManageWorkoutPlan(requester, plan)) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to modify this workout plan");
  }

  const updated = await prisma.workoutPlan.update({
    where: { id: planId },
    data: {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
    },
  });

  return toSafeWorkoutPlan(updated);
}

// Hard-deletes workout plans under ownership/admin constraints.
export async function deleteWorkoutPlan(
  requester: { userId: string; role: Role },
  planId: string,
): Promise<void> {
  const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new HttpError(404, "WORKOUT_PLAN_NOT_FOUND", "Workout plan not found");
  }
  if (!canManageWorkoutPlan(requester, plan)) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to delete this workout plan");
  }
  await prisma.workoutPlan.delete({ where: { id: planId } });
}

// Assigns/reassigns one workout plan to one member.
export async function assignWorkoutPlan(
  requester: { userId: string; role: Role },
  planId: string,
  memberId: string,
): Promise<SafePlan> {
  const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new HttpError(404, "WORKOUT_PLAN_NOT_FOUND", "Workout plan not found");
  }
  if (!canManageWorkoutPlan(requester, plan)) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to assign this workout plan");
  }

  await assertAssignableMember(memberId);

  const updated = await prisma.workoutPlan.update({
    where: { id: planId },
    data: { assignedToId: memberId },
  });
  return toSafeWorkoutPlan(updated);
}
