import { Prisma, Progress, Role, User } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { SafeProgress } from "./types";

const prisma = createPrismaClient();

function toSafeProgress(progress: Progress): SafeProgress {
  return {
    id: progress.id,
    userId: progress.userId,
    recordedById: progress.recordedById,
    weight: progress.weight,
    bodyFat: progress.bodyFat,
    bmi: progress.bmi,
    notes: progress.notes,
    recordedAt: progress.recordedAt,
    createdAt: progress.createdAt,
    updatedAt: progress.updatedAt,
  };
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
  const [workoutAssigned, dietAssigned] = await prisma.$transaction([
    prisma.workoutPlan.findFirst({
      where: {
        createdById: trainerId,
        assignedToId: memberId,
      },
      select: { id: true },
    }),
    prisma.dietPlan.findFirst({
      where: {
        createdById: trainerId,
        assignedToId: memberId,
      },
      select: { id: true },
    }),
  ]);

  return Boolean(workoutAssigned || dietAssigned);
}

// Creates a progress entry for a member by ADMIN or TRAINER.
export async function createProgressEntry(
  requester: { userId: string; role: Role },
  payload: {
    userId: string;
    weight?: number | null | undefined;
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

  const created = await prisma.progress.create({
    data: {
      userId: payload.userId,
      recordedById: requester.userId,
      weight: payload.weight ?? null,
      bodyFat: payload.bodyFat ?? null,
      bmi: payload.bmi ?? null,
      notes: payload.notes ?? null,
      recordedAt: payload.recordedAt,
    },
  });

  return toSafeProgress(created);
}

// Returns all progress entries for ADMIN, newest first.
export async function listAllProgress(): Promise<SafeProgress[]> {
  const rows = await prisma.progress.findMany({
    orderBy: { recordedAt: "desc" },
  });
  return rows.map(toSafeProgress);
}

// Returns progress entries by member with role-based access checks.
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

// Hard-deletes one progress entry (ADMIN correction flow).
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
