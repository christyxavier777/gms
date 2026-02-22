"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const health_1 = require("./health");
const auth_1 = require("./auth");
const me_1 = require("./me");
const users_1 = require("./users");
const workout_plans_1 = require("./workout-plans");
const diet_plans_1 = require("./diet-plans");
const subscriptions_1 = require("./subscriptions");
// Registers all application routes in one place.
exports.routes = (0, express_1.Router)();
exports.routes.use(health_1.healthRouter);
exports.routes.use("/auth", auth_1.authRouter);
exports.routes.use(me_1.meRouter);
exports.routes.use(users_1.usersRouter);
exports.routes.use(workout_plans_1.workoutPlansRouter);
exports.routes.use(diet_plans_1.dietPlansRouter);
exports.routes.use(subscriptions_1.subscriptionsRouter);
//# sourceMappingURL=index.js.map