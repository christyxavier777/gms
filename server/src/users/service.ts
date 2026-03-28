import { Prisma, Role, User, UserStatus } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { SafeUser } from "../auth/types";
import { invalidateDashboardCache } from "../dashboard/cache";
import { createPaginationMeta, SortOrder } from "../utils/list-response";

const prisma = createPrismaClient();

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type SafeUserRecord = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

function toSafeUser(user: SafeUserRecord): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listUsers(options: {
  page: number;
  pageSize: number;
  search: string;
  role?: Role | undefined;
  status?: UserStatus | undefined;
  sortBy: "createdAt" | "name" | "email";
  sortOrder: SortOrder;
}): Promise<{
  users: SafeUser[];
  pagination: ReturnType<typeof createPaginationMeta>;
  filters: {
    search: string;
    role: Role | null;
    status: UserStatus | null;
  };
  sort: {
    sortBy: "createdAt" | "name" | "email";
    sortOrder: SortOrder;
  };
}> {
  const skip = (options.page - 1) * options.pageSize;
  const search = options.search.trim();
  const where: Prisma.UserWhereInput = {
    ...(options.role ? { role: options.role } : {}),
    ...(options.status ? { status: options.status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.UserOrderByWithRelationInput[] =
    options.sortBy === "name"
      ? [{ name: options.sortOrder }, { createdAt: "desc" }]
      : options.sortBy === "email"
        ? [{ email: options.sortOrder }, { createdAt: "desc" }]
        : [{ createdAt: options.sortOrder }];
  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: options.pageSize,
      select: safeUserSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: rows.map(toSafeUser),
    pagination: createPaginationMeta(options.page, options.pageSize, total),
    filters: {
      search,
      role: options.role ?? null,
      status: options.status ?? null,
    },
    sort: {
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    },
  };
}

export async function listAccessibleMembers(
  requester: { userId: string; role: Role },
  options: { search: string; limit: number },
): Promise<SafeUser[]> {
  if (requester.role !== Role.ADMIN && requester.role !== Role.TRAINER) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to access member directory data");
  }

  const search = options.search.trim();
  const searchFilter: Prisma.UserWhereInput =
    search.length > 0
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

  const scopeFilter: Prisma.UserWhereInput =
    requester.role === Role.TRAINER
      ? {
          memberAssignments: {
            some: {
              trainerId: requester.userId,
              active: true,
            },
          },
        }
      : {};

  const rows = await prisma.user.findMany({
    where: {
      role: Role.MEMBER,
      ...scopeFilter,
      ...searchFilter,
    },
    orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    take: options.limit,
    select: safeUserSelect,
  });

  return rows.map(toSafeUser);
}

export async function getUserById(id: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  });
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }
  return toSafeUser(user);
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<SafeUser> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: safeUserSelect,
    });
    await invalidateDashboardCache("user_status_updated");
    return toSafeUser(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    throw error;
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await prisma.user.delete({ where: { id } });
    await invalidateDashboardCache("user_deleted");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    throw error;
  }
}

export async function trainerCanReadMember(trainerId: string, memberId: string): Promise<boolean> {
  const assignment = await prisma.trainerMemberAssignment.findFirst({
    where: { trainerId, memberId, active: true },
    select: { id: true },
  });
  return Boolean(assignment);
}

export async function canReadUser(
  requester: { userId: string; role: Role },
  targetUserId: string,
): Promise<boolean> {
  if (requester.role === Role.ADMIN) return true;
  if (requester.userId === targetUserId) return true;
  if (requester.role === Role.TRAINER) return trainerCanReadMember(requester.userId, targetUserId);
  return false;
}


