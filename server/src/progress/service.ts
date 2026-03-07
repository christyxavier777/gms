import { DietCategory, Prisma, Progress, Role, User } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { SafeProgress } from "./types";
import { calculateBmi, categorizeBmi, getDietTemplate } from "./bmi";

const prisma = createPrismaClient();

function toSafeProgress(progress: Progress): SafeProgress {
  return {
    id: progress.id,
    userId: progress.userId,
    recordedById: progress.recordedById,
    weight: progress.weight,
    height: progress.height,
    bodyFat: progress.bodyFat,
    bmi: progress.bmi,
    dietCategory: progress.dietCategory,
    notes: progress.notes,
    recordedAt: progress.recordedAt,
    createdAt: progress.createdAt,
    updatedAt: progress.updatedAt,
  };
}


async function assignDietPlanFromBmi(
  requester: { userId: string; role: Role },
  memberUserId: string,
  category: DietCategory,
): Promise<void> {
  const template = getDietTemplate(category);

  await prisma.dietPlan.create({
    data: {
      title: template.title,
      description: template.description,
      createdById: requester.userId,
      assignedToId: memberUserId,
    },
  });
}

async function assertMemberUser(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }
  if (user.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_PROGRESS_TARGET", "Progress can only be recorded for members");
  }
  return user;
}

async function isTrainerAssignedMember(trainerId: string, memberId: string): Promise<boolean> {
  const [workoutAssigned, dietAssigned, mappedAssignment] = await prisma.$transaction([
    prisma.workoutPlan.findFirst({
      where: { createdById: trainerId, assignedToId: memberId },
      select: { id: true },
    }),
    prisma.dietPlan.findFirst({
      where: { createdById: trainerId, assignedToId: memberId },
      select: { id: true },
    }),
    prisma.trainerMemberAssignment.findFirst({
      where: { trainerId, memberId, active: true },
      select: { id: true },
    }),
  ]);

  return Boolean(workoutAssigned || dietAssigned || mappedAssignment);
}

export async function createProgressEntry(
  requester: { userId: string; role: Role },
  payload: {
    userId: string;
    weight?: number | null | undefined;
    height?: number | null | undefined;
    bodyFat?: number | null | undefined;
    bmi?: number | null | undefined;
    notes?: string | null | undefined;
    recordedAt: Date;
  },
): Promise<SafeProgress> {
  if (requester.role !== Role.ADMIN && requester.role !== Role.TRAINER) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to create progress entries");
  }

  await assertMemberUser(payload.userId);

  if (requester.role === Role.TRAINER) {
    const assigned = await isTrainerAssignedMember(requester.userId, payload.userId);
    if (!assigned) {
      throw new HttpError(403, "FORBIDDEN", "You are not allowed to record progress for this member");
    }
  }

  const derivedBmi =
    payload.weight !== undefined &&
    payload.weight !== null &&
    payload.height !== undefined &&
    payload.height !== null
      ? calculateBmi(payload.weight, payload.height)
      : null;

  const bmiToStore = derivedBmi ?? payload.bmi ?? null;
  const category = bmiToStore ? categorizeBmi(bmiToStore) : null;

  const created = await prisma.progress.create({
    data: {
      userId: payload.userId,
      recordedById: requester.userId,
      weight: payload.weight ?? null,
      height: payload.height ?? null,
      bodyFat: payload.bodyFat ?? null,
      bmi: bmiToStore,
      dietCategory: category,
      notes: payload.notes ?? null,
      recordedAt: payload.recordedAt,
    },
  });

  if (category) {
    await assignDietPlanFromBmi(requester, payload.userId, category);
  }

  return toSafeProgress(created);
}

export async function listAllProgress(): Promise<SafeProgress[]> {
  const rows = await prisma.progress.findMany({ orderBy: { recordedAt: "desc" } });
  return rows.map(toSafeProgress);
}

export async function getProgressByUserId(
  requester: { userId: string; role: Role },
  memberUserId: string,
): Promise<SafeProgress[]> {
  await assertMemberUser(memberUserId);

  if (requester.role === Role.MEMBER && requester.userId !== memberUserId) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to access this member progress");
  }

  if (requester.role === Role.TRAINER) {
    const assigned = await isTrainerAssignedMember(requester.userId, memberUserId);
    if (!assigned) {
      throw new HttpError(403, "FORBIDDEN", "You are not allowed to access this member progress");
    }
  }

  const rows = await prisma.progress.findMany({
    where: { userId: memberUserId },
    orderBy: { recordedAt: "desc" },
  });
  return rows.map(toSafeProgress);
}

export async function deleteProgressEntry(progressId: string): Promise<void> {
  try {
    await prisma.progress.delete({ where: { id: progressId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new HttpError(404, "PROGRESS_NOT_FOUND", "Progress entry not found");
    }
    throw error;
  }
}



