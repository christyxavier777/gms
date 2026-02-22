"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const SALT_ROUNDS = 12;
// Hashes plain passwords before persistence.
function hashPassword(plainPassword) {
    return bcrypt_1.default.hash(plainPassword, SALT_ROUNDS);
}
// Compares plaintext passwords against stored hashes.
function verifyPassword(plainPassword, passwordHash) {
    return bcrypt_1.default.compare(plainPassword, passwordHash);
}
//# sourceMappingURL=password.js.map