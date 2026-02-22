"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getSafeUserById = getSafeUserById;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const password_1 = require("./password");
const jwt_1 = require("./jwt");
const prisma = (0, client_2.createPrismaClient)();
function toSafeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
// Registers a new member account.
async function registerUser(input) {
    const email = input.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new http_error_1.HttpError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
    }
    const passwordHash = await (0, password_1.hashPassword)(input.password);
    const user = await prisma.user.create({
        data: {
            name: input.name,
            email,
            passwordHash,
            role: client_1.Role.MEMBER,
        },
    });
    return toSafeUser(user);
}
// Authenticates user credentials and returns a signed JWT.
async function loginUser(input) {
    const email = input.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new http_error_1.HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
    const passwordValid = await (0, password_1.verifyPassword)(input.password, user.passwordHash);
    if (!passwordValid) {
        throw new http_error_1.HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
    return (0, jwt_1.issueAccessToken)({ userId: user.id, role: user.role });
}
// Returns the safe profile for an authenticated user.
async function getSafeUserById(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "Authenticated user not found");
    }
    return toSafeUser(user);
}
//# sourceMappingURL=service.js.map