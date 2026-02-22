"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const routes_1 = require("./routes");
const not_found_1 = require("./middleware/not-found");
const error_handler_1 = require("./middleware/error-handler");
// Creates the HTTP application and wires cross-cutting middleware.
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(routes_1.routes);
    app.use(not_found_1.notFoundMiddleware);
    app.use(error_handler_1.errorHandlerMiddleware);
    return app;
}
//# sourceMappingURL=app.js.map