import { env } from "../config/env";
import { logError, logInfo } from "../utils/logger";

type CacheEntry = {
  expiresAt: number;
  value: string;
};

type WindowCounter = {
  count: number;
  retryAfterSec: number;
};

export type CacheHealthSnapshot = {
  status: "up" | "down" | "fallback";
  configured: boolean;
  ready: boolean;
  mode: "redis" | "memory_fallback";
  latencyMs: number | null;
  detail?: string;
};

const memoryStore = new Map<string, CacheEntry>();

let redisClient: any = null;

function getRedisClient(): any | null {
  if (redisClient) return redisClient;
  if (!env.redisUrl) return null;

  try {
    // Optional runtime dependency. Falls back to in-memory cache if missing.
    const RedisCtor = require("ioredis");
    redisClient = new RedisCtor(env.redisUrl, { lazyConnect: true });
    redisClient.on("error", (error: unknown) => {
      logError("cache_redis_error", {
        error: error instanceof Error ? error.message : "unknown",
      });
    });
    return redisClient;
  } catch {
    return null;
  }
}

function getMemory(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function setMemory(key: string, value: string, ttlSec: number): void {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

function retryAfterFromExpiry(expiresAt: number, fallbackSec: number): number {
  const seconds = Math.ceil((expiresAt - Date.now()) / 1000);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : fallbackSec;
}

function incrMemory(key: string, windowSec: number): WindowCounter {
  const now = Date.now();
  const current = memoryStore.get(key);
  if (!current || current.expiresAt <= now) {
    setMemory(key, "1", windowSec);
    return {
      count: 1,
      retryAfterSec: windowSec,
    };
  }

  const next = Number.parseInt(current.value, 10) + 1;
  memoryStore.set(key, { value: String(next), expiresAt: current.expiresAt });
  return {
    count: next,
    retryAfterSec: retryAfterFromExpiry(current.expiresAt, windowSec),
  };
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = getRedisClient();
  if (redis) {
    try {
      if (redis.status === "wait") await redis.connect();
      return (await redis.get(key)) ?? null;
    } catch {
      // Continue with memory fallback.
    }
  }
  return getMemory(key);
}

export async function cacheSet(key: string, value: string, ttlSec: number): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      if (redis.status === "wait") await redis.connect();
      await redis.set(key, value, "EX", ttlSec);
      return;
    } catch {
      // Continue with memory fallback.
    }
  }
  setMemory(key, value, ttlSec);
}

export async function cacheSetIfAbsent(key: string, value: string, ttlSec: number): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    try {
      if (redis.status === "wait") await redis.connect();
      const result = await redis.set(key, value, "EX", ttlSec, "NX");
      return result === "OK";
    } catch {
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

export async function cacheDel(key: string): Promise<number> {
  const redis = getRedisClient();
  if (redis) {
    try {
      if (redis.status === "wait") await redis.connect();
      return await redis.del(key);
    } catch {
      // Continue with memory fallback.
    }
  }

  if (memoryStore.has(key)) {
    memoryStore.delete(key);
    return 1;
  }
  return 0;
}

export async function cacheDelByPrefix(prefix: string): Promise<number> {
  const redis = getRedisClient();
  let deleted = 0;

  if (redis) {
    try {
      if (redis.status === "wait") await redis.connect();
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
        cursor = nextCursor;
        if (Array.isArray(keys) && keys.length > 0) {
          deleted += await redis.del(...keys);
        }
      } while (cursor !== "0");
      return deleted;
    } catch {
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

export async function cacheIncrWindow(key: string, windowSec: number): Promise<WindowCounter> {
  const redis = getRedisClient();
  if (redis) {
    try {
      if (redis.status === "wait") await redis.connect();
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSec);
      }
      const ttl = await redis.ttl(key);
      return {
        count,
        retryAfterSec: typeof ttl === "number" && ttl > 0 ? ttl : windowSec,
      };
    } catch {
      // Continue with memory fallback.
    }
  }

  return incrMemory(key, windowSec);
}

export async function getCacheHealth(): Promise<CacheHealthSnapshot> {
  if (!env.redisUrl) {
    return {
      status: "fallback",
      configured: false,
      ready: true,
      mode: "memory_fallback",
      latencyMs: null,
      detail: "REDIS_URL is not configured; using in-memory cache fallback.",
    };
  }

  const redis = getRedisClient();
  if (!redis) {
    return {
      status: "down",
      configured: true,
      ready: false,
      mode: "memory_fallback",
      latencyMs: null,
      detail: "Redis driver is unavailable; runtime will fall back to in-memory cache.",
    };
  }

  const startedAt = Date.now();

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    await redis.ping();

    return {
      status: "up",
      configured: true,
      ready: true,
      mode: "redis",
      latencyMs: Date.now() - startedAt,
      detail: "Redis responded to PING.",
    };
  } catch (error) {
    return {
      status: "down",
      configured: true,
      ready: false,
      mode: "memory_fallback",
      latencyMs: Date.now() - startedAt,
      detail:
        error instanceof Error
          ? `Redis health check failed: ${error.message}`
          : "Redis health check failed.",
    };
  }
}

export function logCacheUnavailableIfNeeded(): void {
  if (!env.redisUrl) {
    logInfo("cache_mode", { mode: "memory_fallback" });
    return;
  }
  if (!getRedisClient()) {
    logInfo("cache_mode", { mode: "memory_fallback", reason: "redis_driver_missing" });
  } else {
    logInfo("cache_mode", { mode: "redis" });
  }
}
