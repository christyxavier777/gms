import { Role, User } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { hashPassword, verifyPassword } from "./password";
import { LoginInput, RegisterInput } from "./schemas";
import { SafeUser } from "./types";
import { env } from "../config/env";
import { createSession } from "./session";
import { invalidateDashboardCache } from "../dashboard/cache";

const prisma = createPrismaClient();

function toSafeUser(user: User): SafeUser {
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

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const email = input.email.toLowerCase();
  const phone = input.phone.trim();

  const [existingByEmail, existingByPhone] = await prisma.$transaction([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { phone } }),
  ]);

  if (existingByEmail) {
    throw new HttpError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
  }
  if (existingByPhone) {
    throw new HttpError(409, "PHONE_ALREADY_EXISTS", "Phone is already registered");
  }

  const requestedRole = input.role ?? Role.MEMBER;
  if (requestedRole !== Role.MEMBER) {
    const expectedCode =
      requestedRole === Role.ADMIN ? env.roleInviteCodes.admin : env.roleInviteCodes.trainer;

    if (!expectedCode) {
      throw new HttpError(
        400,
        "ROLE_SIGNUP_DISABLED",
        `${requestedRole.toLowerCase()} self-registration is disabled by server configuration`,
      );
    }

    const providedCode = input.inviteCode?.trim() ?? "";
    if (providedCode !== expectedCode) {
      throw new HttpError(403, "INVALID_INVITE_CODE", "Invite code is invalid for selected role");
    }
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      phone,
      passwordHash,
      role: requestedRole,
    },
  });

  await invalidateDashboardCache("user_registered");
  return toSafeUser(user);
}

export async function loginUser(
  input: LoginInput,
  meta: { userAgent?: string | undefined; ipAddress?: string | undefined },
): Promise<{ user: SafeUser; sessionToken: string; expiresAt: Date }> {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new HttpError(403, "ACCOUNT_INACTIVE", "Your account is inactive");
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);
  if (!passwordValid) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const { token, expiresAt } = await createSession({
    userId: user.id,
    ...(meta.userAgent ? { userAgent: meta.userAgent } : {}),
    ...(meta.ipAddress ? { ipAddress: meta.ipAddress } : {}),
  });

  return {
    user: toSafeUser(user),
    sessionToken: token,
    expiresAt,
  };
}

export async function getSafeUserById(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "Authenticated user not found");
  }
  if (user.status !== "ACTIVE") {
    throw new HttpError(403, "ACCOUNT_INACTIVE", "Your account is inactive");
  }
  return toSafeUser(user);
}
