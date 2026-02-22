"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrismaClient = createPrismaClient;
const client_1 = require("@prisma/client");
// Prisma client factory kept separate for Phase 0 wiring without domain usage.
function createPrismaClient() {
    return new client_1.PrismaClient();
}
//# sourceMappingURL=client.js.map