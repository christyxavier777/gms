"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const password_1 = require("../auth/password");
const client_2 = require("../prisma/client");
const prisma = (0, client_2.createPrismaClient)();
async function seedAdmin() {
    console.log("[seed-admin] start");
    const email = env_1.env.adminSeed.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        const passwordHash = await (0, password_1.hashPassword)(env_1.env.adminSeed.password);
        await prisma.user.update({
            where: { id: existing.id },
            data: {
                name: env_1.env.adminSeed.name,
                role: client_1.Role.ADMIN,
                passwordHash,
            },
        });
        console.log(`[seed-admin] updated admin user: ${email}`);
    }
    else {
        const passwordHash = await (0, password_1.hashPassword)(env_1.env.adminSeed.password);
        await prisma.user.create({
            data: {
                name: env_1.env.adminSeed.name,
                email,
                passwordHash,
                role: client_1.Role.ADMIN,
            },
        });
        console.log(`[seed-admin] created admin user: ${email}`);
    }
    console.log("[seed-admin] done");
}
seedAdmin()
    .catch((error) => {
    console.error("[seed-admin] failed", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-admin.js.map