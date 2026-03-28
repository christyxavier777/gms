"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const schemas_1 = require("../auth/schemas");
(0, node_test_1.default)("register schema accepts non-gmail email addresses when the password is strong", () => {
    const payload = schemas_1.registerSchema.parse({
        name: "Jordan Lee",
        email: "jordan.lee@example.com",
        phone: "9876543210",
        password: "StrongPass1",
        role: "MEMBER",
    });
    strict_1.default.equal(payload.email, "jordan.lee@example.com");
});
(0, node_test_1.default)("register schema rejects weak passwords", () => {
    strict_1.default.throws(() => schemas_1.registerSchema.parse({
        name: "Jordan Lee",
        email: "jordan.lee@example.com",
        phone: "9876543210",
        password: "weakpass",
        role: "MEMBER",
    }));
});
(0, node_test_1.default)("login schema accepts standard email addresses", () => {
    const payload = schemas_1.loginSchema.parse({
        email: "coach@fitnessgarage.in",
        password: "any-non-empty-password",
    });
    strict_1.default.equal(payload.email, "coach@fitnessgarage.in");
});
//# sourceMappingURL=auth-schemas.unit.test.js.map