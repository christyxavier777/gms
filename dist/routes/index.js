"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const health_1 = require("./health");
// Registers all application routes in one place.
exports.routes = (0, express_1.Router)();
exports.routes.use(health_1.healthRouter);
//# sourceMappingURL=index.js.map