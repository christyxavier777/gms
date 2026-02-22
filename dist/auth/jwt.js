"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueAccessToken = issueAccessToken;
exports.verifyAccessToken = verifyAccessToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
// Creates signed JWT access tokens for authenticated users.
function issueAccessToken(payload) {
    const expiresIn = env_1.env.jwtExpiresIn;
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, {
        expiresIn,
    });
}
// Verifies and decodes JWT tokens used by request auth middleware.
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
}
//# sourceMappingURL=jwt.js.map