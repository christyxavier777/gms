"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Loads environment variables from .env as early as possible.
dotenv_1.default.config({ quiet: true });
function readRequiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
// Centralized, validated runtime configuration for the server process.
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(readRequiredEnv("PORT")),
    databaseUrl: readRequiredEnv("DATABASE_URL"),
};
if (Number.isNaN(exports.env.port) || exports.env.port <= 0) {
    throw new Error("Environment variable PORT must be a positive number.");
}
//# sourceMappingURL=env.js.map