"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheSetIfAbsent = cacheSetIfAbsent;
exports.cacheDel = cacheDel;
exports.cacheDelByPrefix = cacheDelByPrefix;
exports.cacheIncrWindow = cacheIncrWindow;
exports.logCacheUnavailableIfNeeded = logCacheUnavailableIfNeeded;
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const memoryStore = new Map();
let redisClient = null;
function getRedisClient() {
    if (redisClient)
        return redisClient;
    if (!env_1.env.redisUrl)
        return null;
    try {
        // Optional runtime dependency. Falls back to in-memory cache if missing.
        const RedisCtor = require("ioredis");
        redisClient = new RedisCtor(env_1.env.redisUrl, { lazyConnect: true });
        redisClient.on("error", (error) => {
            (0, logger_1.logError)("cache_redis_error", {
                error: error instanceof Error ? error.message : "unknown",
            });
        });
        return redisClient;
    }
    catch {
        return null;
    }
}
function getMemory(key) {
    const entry = memoryStore.get(key);
    if (!entry)
        return null;
    if (entry.expiresAt <= Date.now()) {
        memoryStore.delete(key);
        return null;
    }
    return entry.value;
}
function setMemory(key, value, ttlSec) {
    memoryStore.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}
function incrMemory(key, windowSec) {
    const now = Date.now();
    const current = memoryStore.get(key);
    if (!current || current.expiresAt <= now) {
        setMemory(key, "1", windowSec);
        return 1;
    }
    const next = Number.parseInt(current.value, 10) + 1;
    memoryStore.set(key, { value: String(next), expiresAt: current.expiresAt });
    return next;
}
async function cacheGet(key) {
    const redis = getRedisClient();
    if (redis) {
        try {
            if (redis.status === "wait")
                await redis.connect();
            return (await redis.get(key)) ?? null;
        }
        catch {
            // Continue with memory fallback.
        }
    }
    return getMemory(key);
}
async function cacheSet(key, value, ttlSec) {
    const redis = getRedisClient();
    if (redis) {
        try {
            if (redis.status === "wait")
                await redis.connect();
            await redis.set(key, value, "EX", ttlSec);
            return;
        }
        catch {
            // Continue with memory fallback.
        }
    }
    setMemory(key, value, ttlSec);
}
async function cacheSetIfAbsent(key, value, ttlSec) {
    const redis = getRedisClient();
    if (redis) {
        try {
            if (redis.status === "wait")
                await redis.connect();
            const result = await redis.set(key, value, "EX", ttlSec, "NX");
            return result === "OK";
        }
        catch {
            // Continue with memory fallback.
        }
    }
    const existing = getMemory(key);
    if (existing !== null) {
        return false;
    }
    setMemory(key, value, ttlSec);
    return true;
}
async function cacheDel(key) {
    const redis = getRedisClient();
    if (redis) {
        try {
            if (redis.status === "wait")
                await redis.connect();
            return await redis.del(key);
        }
        catch {
            // Continue with memory fallback.
        }
    }
    if (memoryStore.has(key)) {
        memoryStore.delete(key);
        return 1;
    }
    return 0;
}
async function cacheDelByPrefix(prefix) {
    const redis = getRedisClient();
    let deleted = 0;
    if (redis) {
        try {
            if (redis.status === "wait")
                await redis.connect();
            let cursor = "0";
            do {
                const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
                cursor = nextCursor;
                if (Array.isArray(keys) && keys.length > 0) {
                    deleted += await redis.del(...keys);
                }
            } while (cursor !== "0");
            return deleted;
        }
        catch {
            // Continue with memory fallback.
        }
    }
    for (const key of memoryStore.keys()) {
        if (key.startsWith(prefix)) {
            memoryStore.delete(key);
            deleted += 1;
        }
    }
    return deleted;
}
async function cacheIncrWindow(key, windowSec) {
    const redis = getRedisClient();
    if (redis) {
        try {
            if (redis.status === "wait")
                await redis.connect();
            const count = await redis.incr(key);
            if (count === 1) {
                await redis.expire(key, windowSec);
            }
            return count;
        }
        catch {
            // Continue with memory fallback.
        }
    }
    return incrMemory(key, windowSec);
}
function logCacheUnavailableIfNeeded() {
    if (!env_1.env.redisUrl) {
        (0, logger_1.logInfo)("cache_mode", { mode: "memory_fallback" });
        return;
    }
    if (!getRedisClient()) {
        (0, logger_1.logInfo)("cache_mode", { mode: "memory_fallback", reason: "redis_driver_missing" });
    }
    else {
        (0, logger_1.logInfo)("cache_mode", { mode: "redis" });
    }
}
//# sourceMappingURL=client.js.map