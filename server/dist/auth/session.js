"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionCookieName = getSessionCookieName;
exports.extractSessionToken = extractSessionToken;
exports.createSession = createSession;
exports.validateSession = validateSession;
exports.revokeSession = revokeSession;
exports.listUserSessions = listUserSessions;
exports.revokeUserSessions = revokeUserSessions;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const client_2 = require("../cache/client");
const prisma = (0, client_1.createPrismaClient)();
const SESSION_COOKIE = "gms_session";
const SESSION_TTL_DAYS = 7;
const SESSION_REVOKE_PREFIX = "session:revoked:";
const sessionValidationSelect = {
    userId: true,
    revokedAt: true,
    expiresAt: true,
    user: {
        select: {
            role: true,
            status: true,
        },
    },
};
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
function revokedCacheKey(tokenHash) {
    return `${SESSION_REVOKE_PREFIX}${tokenHash}`;
}
function parseCookieHeader(cookieHeader) {
    if (!cookieHeader)
        return {};
    return cookieHeader
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce((acc, part) => {
        const idx = part.indexOf("=");
        if (idx <= 0)
            return acc;
        acc[part.slice(0, idx)] = decodeURIComponent(part.slice(idx + 1));
        return acc;
    }, {});
}
function getSessionCookieName() {
    return SESSION_COOKIE;
}
function extractSessionToken(cookieHeader) {
    const cookies = parseCookieHeader(cookieHeader);
    return cookies[SESSION_COOKIE] ?? null;
}
function getTokenHash(token) {
    return token ? hashToken(token) : null;
}
async function createSession(params) {
    const token = crypto_1.default.randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    await prisma.session.create({
        data: {
            userId: params.userId,
            tokenHash: hashToken(token),
            userAgent: params.userAgent?.slice(0, 512) ?? null,
            ipAddress: params.ipAddress?.slice(0, 128) ?? null,
            expiresAt,
        },
    });
    return { token, expiresAt };
}
async function validateSession(sessionToken) {
    const tokenHash = hashToken(sessionToken);
    const revokedCached = await (0, client_2.cacheGet)(revokedCacheKey(tokenHash));
    if (revokedCached === "1") {
        throw new http_error_1.HttpError(401, "INVALID_SESSION", "Session is invalid or expired");
    }
    const session = await prisma.session.findUnique({
        where: { tokenHash },
        select: sessionValidationSelect,
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
        if (session?.revokedAt) {
            const ttlSec = Math.max(60, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
            await (0, client_2.cacheSet)(revokedCacheKey(tokenHash), "1", ttlSec);
        }
        throw new http_error_1.HttpError(401, "INVALID_SESSION", "Session is invalid or expired");
    }
    if (session.user.status !== "ACTIVE") {
        throw new http_error_1.HttpError(403, "ACCOUNT_INACTIVE", "Account is inactive");
    }
    return { userId: session.userId, role: session.user.role };
}
async function revokeSession(sessionToken) {
    const tokenHash = hashToken(sessionToken);
    const existing = await prisma.session.findUnique({
        where: { tokenHash },
        select: { expiresAt: true, revokedAt: true },
    });
    await prisma.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
    });
    if (existing) {
        const ttlSec = Math.max(60, Math.floor((existing.expiresAt.getTime() - Date.now()) / 1000));
        await (0, client_2.cacheSet)(revokedCacheKey(tokenHash), "1", ttlSec);
    }
}
async function listUserSessions(params) {
    const currentTokenHash = getTokenHash(params.currentSessionToken);
    const now = new Date();
    const sessions = await prisma.session.findMany({
        where: {
            userId: params.userId,
            revokedAt: null,
            expiresAt: { gt: now },
        },
        orderBy: [{ createdAt: "desc" }],
        select: {
            id: true,
            tokenHash: true,
            userAgent: true,
            ipAddress: true,
            createdAt: true,
            expiresAt: true,
        },
    });
    return sessions.map((session) => ({
        id: session.id,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isCurrent: currentTokenHash === session.tokenHash,
    }));
}
async function revokeUserSessions(params) {
    const excludeTokenHash = getTokenHash(params.excludeSessionToken);
    const now = new Date();
    const where = {
        userId: params.userId,
        revokedAt: null,
        expiresAt: { gt: now },
        ...(excludeTokenHash ? { NOT: { tokenHash: excludeTokenHash } } : {}),
    };
    const sessionsToRevoke = await prisma.session.findMany({
        where,
        select: {
            tokenHash: true,
            expiresAt: true,
        },
    });
    if (sessionsToRevoke.length === 0) {
        return { revokedCount: 0 };
    }
    await prisma.session.updateMany({
        where,
        data: { revokedAt: now },
    });
    await Promise.all(sessionsToRevoke.map((session) => {
        const ttlSec = Math.max(60, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
        return (0, client_2.cacheSet)(revokedCacheKey(session.tokenHash), "1", ttlSec);
    }));
    return { revokedCount: sessionsToRevoke.length };
}
//# sourceMappingURL=session.js.map