"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const client_1 = require("../cache/client");
(0, node_test_1.default)("cacheSetIfAbsent allows first write and blocks duplicates", async () => {
    const key = `test:idempotency:${Date.now()}:a`;
    const first = await (0, client_1.cacheSetIfAbsent)(key, "1", 60);
    const second = await (0, client_1.cacheSetIfAbsent)(key, "2", 60);
    const stored = await (0, client_1.cacheGet)(key);
    strict_1.default.equal(first, true);
    strict_1.default.equal(second, false);
    strict_1.default.equal(stored, "1");
    await (0, client_1.cacheDel)(key);
});
(0, node_test_1.default)("cacheDel removes reserved idempotency key", async () => {
    const key = `test:idempotency:${Date.now()}:b`;
    await (0, client_1.cacheSetIfAbsent)(key, "in_flight", 60);
    const removed = await (0, client_1.cacheDel)(key);
    const missing = await (0, client_1.cacheGet)(key);
    strict_1.default.equal(removed, 1);
    strict_1.default.equal(missing, null);
});
//# sourceMappingURL=cache-idempotency.unit.test.js.map