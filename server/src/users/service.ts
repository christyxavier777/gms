import { Prisma, Role, User, UserStatus } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { SafeUser } from "../auth/types";

const prisma = createPrismaClient();

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Returns a paginated list of users for ADMIN-only management views.
export async function listUsers(page: number, pageSize: number): Promise<{
  users: SafeUser[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const skip = (page - 1) * pageSize;
  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count(),
  ]);

  return {
    users: rows.map(toSafeUser),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

// Reads a single user profile in safe response form.
export async function getUserById(id: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }
  return toSafeUser(user);
}

// Updates only lifecycle status for a user.
export async function updateUserStatus(id: string, status: UserStatus): Promise<SafeUser> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });
    return toSafeUser(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    throw error;
  }
}

// Hard-deletes a user account by identifier.
export async function deleteUser(id: string): Promise<void> {
  try {
    await prisma.user.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    throw error;
  }
}

// Phase 2 stub: trainer-to-member assignment check intentionally unimplemented.
export function trainerCanReadMember(_trainerId: string, _memberId: string): boolean {
  return false;
}

// Enforces view access for /users/:id according to Phase 2 constraints.
export function canReadUser(requester: { userId: string; role: Role }, targetUserId: string): boolean {
  if (requester.role === Role.ADMIN) return true;
  if (requester.userId === targetUserId) return true;
  if (requester.role === Role.TRAINER) return trainerCanReadMember(requester.userId, targetUserId);
  return false;
}
