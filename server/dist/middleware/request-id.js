"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const crypto_1 = __importDefault(require("crypto"));
// Assigns stable request id for tracing and returns it in response headers.
function requestIdMiddleware(req, res, next) {
    const incomingRequestId = req.header("x-request-id")?.trim();
    const requestId = incomingRequestId && incomingRequestId.length > 0 ? incomingRequestId : crypto_1.default.randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
}
//# sourceMappingURL=request-id.js.map