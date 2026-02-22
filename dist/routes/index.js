"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const health_1 = require("./health");
const auth_1 = require("./auth");
const me_1 = require("./me");
// Registers all application routes in one place.
exports.routes = (0, express_1.Router)();
exports.routes.use(health_1.healthRouter);
exports.routes.use("/auth", auth_1.authRouter);
exports.routes.use(me_1.meRouter);
//# sourceMappingURL=index.js.map