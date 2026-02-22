import { PrismaClient } from "@prisma/client";

// Prisma client factory kept separate for Phase 0 wiring without domain usage.
export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}
