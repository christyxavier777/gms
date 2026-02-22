"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const client_1 = require("./prisma/client");
const app = (0, app_1.createApp)();
void client_1.createPrismaClient;
const server = app.listen(env_1.env.port, () => {
    console.log(`[bootstrap] environment loaded: NODE_ENV=${env_1.env.nodeEnv}`);
    console.log(`[bootstrap] prisma client generation validated (Phase 0, no DB connection)`);
    console.log(`[bootstrap] server listening on http://localhost:${env_1.env.port}`);
});
process.on("SIGTERM", () => {
    console.log("[shutdown] SIGTERM received, closing resources");
    server.close(() => {
        console.log("[shutdown] server stopped cleanly");
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map