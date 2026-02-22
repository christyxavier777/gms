import { Prisma, Role, User, DietPlan } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { SafePlan } from "./types";

const prisma = createPrismaClient();

function toSafeDietPlan(plan: DietPlan): SafePlan {
  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    assignedToId: plan.assignedToId,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

function canManageDietPlan(requester: { userId: string; role: Role }, plan: DietPlan): boolean {
  if (requester.role === Role.ADMIN) return true;
  if (requester.role === Role.TRAINER && plan.createdById === requester.userId) return true;
  return false;
}

function canReadDietPlan(requester: { userId: string; role: Role }, plan: DietPlan): boolean {
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

// Creates a diet plan owned by ADMIN or TRAINER.
export async function createDietPlan(
  requester: { userId: string; role: Role },
  payload: { title: string; description: string },
): Promise<SafePlan> {
  if (requester.role !== Role.ADMIN && requester.role !== Role.TRAINER) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to create diet plans");
  }

  const plan = await prisma.dietPlan.create({
    data: {
      title: payload.title,
      description: payload.description,
      createdById: requester.userId,
    },
  });

  return toSafeDietPlan(plan);
}

// Lists diet plans scoped to the caller role.
export async function listDietPlans(requester: { userId: string; role: Role }): Promise<SafePlan[]> {
  let where: Prisma.DietPlanWhereInput = {};
  if (requester.role === Role.TRAINER) {
    where = { createdById: requester.userId };
  } else if (requester.role === Role.MEMBER) {
    where = { assignedToId: requester.userId };
  }

  const plans = await prisma.dietPlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return plans.map(toSafeDietPlan);
}

// Reads a single diet plan with role-based visibility.
export async function getDietPlanById(
  requester: { userId: string; role: Role },
  planId: string,
): Promise<SafePlan> {
  const plan = await prisma.dietPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new HttpError(404, "DIET_PLAN_NOT_FOUND", "Diet plan not found");
  }
  if (!canReadDietPlan(requester, plan)) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to access this diet plan");
  }
  return toSafeDietPlan(plan);
}

// Updates diet plan title/description with ownership checks.
export async function updateDietPlan(
  requester: { userId: string; role: Role },
  planId: string,
  payload: { title?: string | undefined; description?: string | undefined },
): Promise<SafePlan> {
  const plan = await prisma.dietPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new HttpError(404, "DIET_PLAN_NOT_FOUND", "Diet plan not found");
  }
  if (!canManageDietPlan(requester, plan)) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to modify this diet plan");
  }

  const updated = await prisma.dietPlan.update({
    where: { id: planId },
    data: {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
    },
  });

  return toSafeDietPlan(updated);
}

// Hard-deletes diet plans under ownership/admin constraints.
export async function deleteDietPlan(
  requester: { userId: string; role: Role },
  planId: string,
): Promise<void> {
  const plan = await prisma.dietPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new HttpError(404, "DIET_PLAN_NOT_FOUND", "Diet plan not found");
  }
  if (!canManageDietPlan(requester, plan)) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to delete this diet plan");
  }
  await prisma.dietPlan.delete({ where: { id: planId } });
}

// Assigns/reassigns one diet plan to one member.
export async function assignDietPlan(
  requester: { userId: string; role: Role },
  planId: string,
  memberId: string,
): Promise<SafePlan> {
  const plan = await prisma.dietPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new HttpError(404, "DIET_PLAN_NOT_FOUND", "Diet plan not found");
  }
  if (!canManageDietPlan(requester, plan)) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to assign this diet plan");
  }

  await assertAssignableMember(memberId);

  const updated = await prisma.dietPlan.update({
    where: { id: planId },
    data: { assignedToId: memberId },
  });
  return toSafeDietPlan(updated);
}
