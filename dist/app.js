"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const routes_1 = require("./routes");
const not_found_1 = require("./middleware/not-found");
const error_handler_1 = require("./middleware/error-handler");
const sanitize_input_1 = require("./middleware/sanitize-input");
const request_logger_1 = require("./middleware/request-logger");
const rate_limit_1 = require("./middleware/rate-limit");
const helmet = require("helmet");
// Creates the HTTP application and wires cross-cutting middleware.
function createApp() {
    const app = (0, express_1.default)();
    app.disable("x-powered-by");
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "same-site" },
    }));
    app.use(request_logger_1.requestLoggerMiddleware);
    app.use(express_1.default.json({ limit: env_1.env.jsonBodyLimit }));
    app.use(express_1.default.urlencoded({ extended: false, limit: env_1.env.jsonBodyLimit }));
    app.use(sanitize_input_1.sanitizeInputMiddleware);
    app.use("/auth", rate_limit_1.authRateLimiter);
    app.use(rate_limit_1.mutationRateLimiter);
    app.use(routes_1.routes);
    app.use(not_found_1.notFoundMiddleware);
    app.use(error_handler_1.errorHandlerMiddleware);
    return app;
}
//# sourceMappingURL=app.js.map