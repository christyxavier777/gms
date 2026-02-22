"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const health_1 = require("./health");
const auth_1 = require("./auth");
const me_1 = require("./me");
const users_1 = require("./users");
// Registers all application routes in one place.
exports.routes = (0, express_1.Router)();
exports.routes.use(health_1.healthRouter);
exports.routes.use("/auth", auth_1.authRouter);
exports.routes.use(me_1.meRouter);
exports.routes.use(users_1.usersRouter);
//# sourceMappingURL=index.js.map