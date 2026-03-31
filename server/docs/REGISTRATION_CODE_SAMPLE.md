# User Registration Code Sample

This is a document-ready sample based on the actual registration flow in this project.

Original source files:
- `server/src/auth/schemas.ts`
- `server/src/auth/service.ts`
- `server/src/routes/auth.ts`

```ts
import { z } from "zod";
import { Role, User } from "@prisma/client";
import { Router } from "express";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { hashPassword } from "../auth/password";

const prisma = createPrismaClient();
const authRouter = Router();

const phoneRegex = /^\d{10}$/;
const passwordHasUppercase = /[A-Z]/;
const passwordHasLowercase = /[a-z]/;
const passwordHasDigit = /\d/;

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Email must be valid"),
  phone: z.string().trim().regex(phoneRegex, "Phone must be exactly 10 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .refine(
      (value) =>
        passwordHasUppercase.test(value) &&
        passwordHasLowercase.test(value) &&
        passwordHasDigit.test(value),
      "Password must include uppercase, lowercase, and a number",
    ),
  role: z.enum(["ADMIN", "TRAINER", "MEMBER"]).default("MEMBER"),
  inviteCode: z.string().trim().max(64).optional(),
});

type RegisterInput = z.infer<typeof registerSchema>;

function toSafeUser(user: User) {
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

async function registerUser(input: RegisterInput) {
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

  return toSafeUser(user);
}

authRouter.post("/register", async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);
    const user = await registerUser(payload);
    res.status(201).json({ user });
  } catch (error) {
    throw error;
  }
});
```

Suggested caption:

`Sample code for user registration with input validation, duplicate checks, password hashing, and database insertion.`
