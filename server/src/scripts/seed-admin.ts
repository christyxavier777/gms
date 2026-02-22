import { Role } from "@prisma/client";
import { env } from "../config/env";
import { hashPassword } from "../auth/password";
import { createPrismaClient } from "../prisma/client";

const prisma = createPrismaClient();

async function seedAdmin(): Promise<void> {
  console.log("[seed-admin] start");

  const email = env.adminSeed.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const passwordHash = await hashPassword(env.adminSeed.password);
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: env.adminSeed.name,
        role: Role.ADMIN,
        passwordHash,
      },
    });
    console.log(`[seed-admin] updated admin user: ${email}`);
  } else {
    const passwordHash = await hashPassword(env.adminSeed.password);
    await prisma.user.create({
      data: {
        name: env.adminSeed.name,
        email,
        passwordHash,
        role: Role.ADMIN,
      },
    });
    console.log(`[seed-admin] created admin user: ${email}`);
  }

  console.log("[seed-admin] done");
}

seedAdmin()
  .catch((error: unknown) => {
    console.error("[seed-admin] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
