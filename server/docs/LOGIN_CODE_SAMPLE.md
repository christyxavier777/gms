# Login Code Sample

This is a document-ready sample based on the actual login flow in this project.

Original source files:
- `server/src/auth/schemas.ts`
- `server/src/auth/service.ts`
- `server/src/routes/auth.ts`

```ts
import { z } from "zod";
import { Router } from "express";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { verifyPassword } from "../auth/password";
import { createSession, getSessionCookieName } from "../auth/session";
import { env } from "../config/env";

const prisma = createPrismaClient();
const authRouter = Router();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email must be valid"),
  password: z.string().min(1, "Password is required").max(128),
});

async function loginUser(input: { email: string; password: string }) {
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

  const session = await createSession({ userId: user.id });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
    sessionToken: session.token,
    expiresAt: session.expiresAt,
  };
}

authRouter.post("/login", async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const session = await loginUser(payload);

    res.cookie(getSessionCookieName(), session.sessionToken, {
      httpOnly: true,
      secure: env.cookie.secure,
      sameSite: env.cookie.sameSite,
      expires: session.expiresAt,
      path: "/",
    });

    res.status(200).json({ user: session.user });
  } catch (error) {
    throw error;
  }
});
```

Suggested caption:

`Sample code for user login with credential validation, password verification, and session cookie creation.`
