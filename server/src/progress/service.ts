import { DietCategory, Prisma, Role } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { SafeProgress } from "./types";
import { calculateBmi, categorizeBmi, getDietTemplate } from "./bmi";
import { invalidateDashboardCache } from "../dashboard/cache";
import { createPaginationMeta, SortOrder } from "../utils/list-response";

const prisma = createPrismaClient();

const progressDetailInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
    },
  },
  recordedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.ProgressInclude;

type ProgressWithRelations = Prisma.ProgressGetPayload<{
  include: typeof progressDetailInclude;
}>;

function toSafeProgress(progress: ProgressWithRelations): SafeProgress {
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
    member: {
      id: progress.user.id,
      name: progress.user.name,
      email: progress.user.email,
      phone: progress.user.phone,
      status: progress.user.status,
    },
    recorder: {
      id: progress.recordedBy.id,
      name: progress.recordedBy.name,
      email: progress.recordedBy.email,
      role: progress.recordedBy.role,
    },
  };
}

function buildProgressWhere(clauses: Prisma.ProgressWhereInput[]): Prisma.ProgressWhereInput {
  const nonEmptyClauses = clauses.filter((clause) => Object.keys(clause).length > 0);

  if (nonEmptyClauses.length === 0) {
    return {};
  }

  return { AND: nonEmptyClauses };
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

async function assertMemberUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }
  if (user.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_PROGRESS_TARGET", "Progress can only be recorded for members");
  }
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
    throw new HttpError(
      403,
      "PROGRESS_CREATE_FORBIDDEN",
      "You are not allowed to create progress entries",
    );
  }

  await assertMemberUser(payload.userId);

  if (requester.role === Role.TRAINER) {
    const assigned = await isTrainerAssignedMember(requester.userId, payload.userId);
    if (!assigned) {
      throw new HttpError(
        403,
        "PROGRESS_TRAINER_MEMBER_SCOPE_FORBIDDEN",
        "You are not allowed to record progress for this member",
      );
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
    include: progressDetailInclude,
  });

  if (category) {
    await assignDietPlanFromBmi(requester, payload.userId, category);
  }

  await invalidateDashboardCache("progress_created");
  return toSafeProgress(created);
}

export async function listAllProgress(query: {
  page: number;
  pageSize: number;
  search: string;
  dietCategory?: DietCategory | undefined;
  sortBy: "recordedAt" | "createdAt";
  sortOrder: SortOrder;
}): Promise<{
  progress: SafeProgress[];
  pagination: ReturnType<typeof createPaginationMeta>;
  filters: {
    search: string;
    dietCategory: DietCategory | null;
  };
  sort: {
    sortBy: "recordedAt" | "createdAt";
    sortOrder: SortOrder;
  };
}> {
  const search = query.search.trim();
  const where = buildProgressWhere([
    query.dietCategory ? { dietCategory: query.dietCategory } : {},
    search.length > 0
      ? {
          OR: [
            { notes: { contains: search, mode: "insensitive" } },
            {
              user: {
                is: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            },
            {
              recordedBy: {
                is: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {},
  ]);
  const skip = (query.page - 1) * query.pageSize;
  const orderBy: Prisma.ProgressOrderByWithRelationInput[] =
    query.sortBy === "createdAt"
      ? [{ createdAt: query.sortOrder }, { recordedAt: "desc" }]
      : [{ recordedAt: query.sortOrder }, { createdAt: "desc" }];
  const [rows, total] = await prisma.$transaction([
    prisma.progress.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
      include: progressDetailInclude,
    }),
    prisma.progress.count({ where }),
  ]);

  return {
    progress: rows.map(toSafeProgress),
    pagination: createPaginationMeta(query.page, query.pageSize, total),
    filters: {
      search,
      dietCategory: query.dietCategory ?? null,
    },
    sort: {
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  };
}

export async function getProgressByUserId(
  requester: { userId: string; role: Role },
  memberUserId: string,
  query: {
    page: number;
    pageSize: number;
    search: string;
    dietCategory?: DietCategory | undefined;
    sortBy: "recordedAt" | "createdAt";
    sortOrder: SortOrder;
  },
): Promise<{
  progress: SafeProgress[];
  pagination: ReturnType<typeof createPaginationMeta>;
  filters: {
    search: string;
    dietCategory: DietCategory | null;
  };
  sort: {
    sortBy: "recordedAt" | "createdAt";
    sortOrder: SortOrder;
  };
}> {
  await assertMemberUser(memberUserId);

  if (requester.role === Role.MEMBER && requester.userId !== memberUserId) {
    throw new HttpError(
      403,
      "PROGRESS_MEMBER_SCOPE_FORBIDDEN",
      "You are not allowed to access this member progress",
    );
  }

  if (requester.role === Role.TRAINER) {
    const assigned = await isTrainerAssignedMember(requester.userId, memberUserId);
    if (!assigned) {
      throw new HttpError(
        403,
        "PROGRESS_TRAINER_MEMBER_SCOPE_FORBIDDEN",
        "You are not allowed to access this member progress",
      );
    }
  }

  const search = query.search.trim();
  const where = buildProgressWhere([
    { userId: memberUserId },
    query.dietCategory ? { dietCategory: query.dietCategory } : {},
    search.length > 0
      ? {
          OR: [
            { notes: { contains: search, mode: "insensitive" } },
            {
              recordedBy: {
                is: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {},
  ]);
  const skip = (query.page - 1) * query.pageSize;
  const orderBy: Prisma.ProgressOrderByWithRelationInput[] =
    query.sortBy === "createdAt"
      ? [{ createdAt: query.sortOrder }, { recordedAt: "desc" }]
      : [{ recordedAt: query.sortOrder }, { createdAt: "desc" }];
  const [rows, total] = await prisma.$transaction([
    prisma.progress.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
      include: progressDetailInclude,
    }),
    prisma.progress.count({ where }),
  ]);

  return {
    progress: rows.map(toSafeProgress),
    pagination: createPaginationMeta(query.page, query.pageSize, total),
    filters: {
      search,
      dietCategory: query.dietCategory ?? null,
    },
    sort: {
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  };
}

export async function deleteProgressEntry(progressId: string): Promise<void> {
  try {
    await prisma.progress.delete({ where: { id: progressId } });
    await invalidateDashboardCache("progress_deleted");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new HttpError(404, "PROGRESS_NOT_FOUND", "Progress entry not found");
    }
    throw error;
  }
}





