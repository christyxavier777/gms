import { Role, User } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { hashPassword, verifyPassword } from "./password";
import { issueAccessToken } from "./jwt";
import { LoginInput, RegisterInput } from "./schemas";
import { SafeUser } from "./types";

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

// Registers a new member account.
export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const email = input.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new HttpError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      role: Role.MEMBER,
    },
  });

  return toSafeUser(user);
}

// Authenticates user credentials and returns a signed JWT.
export async function loginUser(input: LoginInput): Promise<string> {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);
  if (!passwordValid) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  return issueAccessToken({ userId: user.id, role: user.role });
}

// Returns the safe profile for an authenticated user.
export async function getSafeUserById(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "Authenticated user not found");
  }
  return toSafeUser(user);
}
