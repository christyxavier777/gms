"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getSafeUserById = getSafeUserById;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const password_1 = require("./password");
const env_1 = require("../config/env");
const session_1 = require("./session");
const prisma = (0, client_2.createPrismaClient)();
function toSafeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
async function registerUser(input) {
    const email = input.email.toLowerCase();
    const phone = input.phone.trim();
    const [existingByEmail, existingByPhone] = await prisma.$transaction([
        prisma.user.findUnique({ where: { email } }),
        prisma.user.findUnique({ where: { phone } }),
    ]);
    if (existingByEmail) {
        throw new http_error_1.HttpError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
    }
    if (existingByPhone) {
        throw new http_error_1.HttpError(409, "PHONE_ALREADY_EXISTS", "Phone is already registered");
    }
    const requestedRole = input.role ?? client_1.Role.MEMBER;
    if (requestedRole !== client_1.Role.MEMBER) {
        const expectedCode = requestedRole === client_1.Role.ADMIN ? env_1.env.roleInviteCodes.admin : env_1.env.roleInviteCodes.trainer;
        if (!expectedCode) {
            throw new http_error_1.HttpError(400, "ROLE_SIGNUP_DISABLED", `${requestedRole.toLowerCase()} self-registration is disabled by server configuration`);
        }
        const providedCode = input.inviteCode?.trim() ?? "";
        if (providedCode !== expectedCode) {
            throw new http_error_1.HttpError(403, "INVALID_INVITE_CODE", "Invite code is invalid for selected role");
        }
    }
    const passwordHash = await (0, password_1.hashPassword)(input.password);
    const user = await prisma.user.create({
        data: {
            name: input.name,
            email,
            phone,
            passwordHash,
            role: requestedRole,
        },
    });
    return toSafeUser(user);
}
async function loginUser(input, meta) {
    const email = input.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new http_error_1.HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
    if (user.status !== "ACTIVE") {
        throw new http_error_1.HttpError(403, "ACCOUNT_INACTIVE", "Your account is inactive");
    }
    const passwordValid = await (0, password_1.verifyPassword)(input.password, user.passwordHash);
    if (!passwordValid) {
        throw new http_error_1.HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
    const { token, expiresAt } = await (0, session_1.createSession)({
        userId: user.id,
        ...(meta.userAgent ? { userAgent: meta.userAgent } : {}),
        ...(meta.ipAddress ? { ipAddress: meta.ipAddress } : {}),
    });
    return {
        user: toSafeUser(user),
        sessionToken: token,
        expiresAt,
    };
}
async function getSafeUserById(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "Authenticated user not found");
    }
    if (user.status !== "ACTIVE") {
        throw new http_error_1.HttpError(403, "ACCOUNT_INACTIVE", "Your account is inactive");
    }
    return toSafeUser(user);
}
//# sourceMappingURL=service.js.map