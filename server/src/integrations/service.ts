import { DietCategory, Role } from "@prisma/client";
import { calculateBmi, categorizeBmi } from "../progress/bmi";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { invalidateDashboardCache } from "../dashboard/cache";
import { WearableSyncInput } from "./schemas";

const prisma = createPrismaClient();

function normalizeMetrics(input: WearableSyncInput): {
  weight: number | null;
  height: number | null;
  bodyFat: number | null;
  bmi: number | null;
  recordedAt: Date;
  note: string | null;
} {
  const weight = input.metrics?.weightKg ?? input.payload?.weight ?? null;
  const height = input.metrics?.heightM ?? input.payload?.height ?? null;
  const bodyFat = input.metrics?.bodyFatPct ?? input.payload?.bodyFat ?? null;
  const providedBmi = input.metrics?.bmi ?? input.payload?.bmi ?? null;
  const recordedAt = input.recordedAt ?? input.payload?.timestamp ?? new Date();

  if (recordedAt > new Date()) {
    throw new HttpError(400, "INVALID_TIMESTAMP", "recordedAt cannot be in the future");
  }

  const computedBmi =
    weight !== null && height !== null
      ? calculateBmi(weight, height)
      : providedBmi;

  const note = input.note?.trim()
    ? `[${input.source}] ${input.note.trim()}`
    : `[${input.source}] Auto-synced wearable entry`;

  if (weight === null && height === null && bodyFat === null && computedBmi === null) {
    throw new HttpError(400, "NO_METRICS", "No valid wearable metrics found in payload");
  }

  return {
    weight,
    height,
    bodyFat,
    bmi: computedBmi,
    recordedAt,
    note,
  };
}

async function assertMember(memberUserId: string): Promise<void> {
  const member = await prisma.user.findUnique({
    where: { id: memberUserId },
    select: { role: true },
  });

  if (!member) throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  if (member.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_MEMBER", "Wearable sync is only available for members");
  }
}

export async function syncWearableProgress(
  requester: { userId: string; role: Role },
  input: WearableSyncInput,
): Promise<{ progressId: string; recordedAt: Date; bmi: number | null; dietCategory: DietCategory | null }> {
  if (requester.role !== Role.MEMBER) {
    throw new HttpError(403, "FORBIDDEN", "Only members can sync wearable progress");
  }

  await assertMember(requester.userId);
  const normalized = normalizeMetrics(input);
  const dietCategory = normalized.bmi ? categorizeBmi(normalized.bmi) : null;

  const created = await prisma.progress.create({
    data: {
      userId: requester.userId,
      recordedById: requester.userId,
      weight: normalized.weight,
      height: normalized.height,
      bodyFat: normalized.bodyFat,
      bmi: normalized.bmi,
      dietCategory,
      notes: normalized.note,
      recordedAt: normalized.recordedAt,
    },
    select: {
      id: true,
      recordedAt: true,
      bmi: true,
      dietCategory: true,
    },
  });

  await invalidateDashboardCache("wearable_progress_synced");
  return {
    progressId: created.id,
    recordedAt: created.recordedAt,
    bmi: created.bmi,
    dietCategory: created.dietCategory,
  };
}

export async function syncWearableProgressForMember(
  memberUserId: string,
  input: WearableSyncInput,
): Promise<{ progressId: string; recordedAt: Date; bmi: number | null; dietCategory: DietCategory | null }> {
  await assertMember(memberUserId);
  const normalized = normalizeMetrics(input);
  const dietCategory = normalized.bmi ? categorizeBmi(normalized.bmi) : null;

  const created = await prisma.progress.create({
    data: {
      userId: memberUserId,
      recordedById: memberUserId,
      weight: normalized.weight,
      height: normalized.height,
      bodyFat: normalized.bodyFat,
      bmi: normalized.bmi,
      dietCategory,
      notes: normalized.note,
      recordedAt: normalized.recordedAt,
    },
    select: {
      id: true,
      recordedAt: true,
      bmi: true,
      dietCategory: true,
    },
  });

  await invalidateDashboardCache("wearable_progress_webhook_synced");
  return {
    progressId: created.id,
    recordedAt: created.recordedAt,
    bmi: created.bmi,
    dietCategory: created.dietCategory,
  };
}

export const __wearableInternals = {
  normalizeMetrics,
};
