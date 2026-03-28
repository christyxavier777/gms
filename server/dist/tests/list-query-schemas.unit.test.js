"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const schemas_1 = require("../users/schemas");
const schemas_2 = require("../payments/schemas");
const schemas_3 = require("../subscriptions/schemas");
const schemas_4 = require("../progress/schemas");
(0, node_test_1.default)("list users query schema applies defaults and accepts role filters", () => {
    const query = schemas_1.listUsersQuerySchema.parse({
        search: "member",
        role: "MEMBER",
        status: "ACTIVE",
    });
    strict_1.default.equal(query.page, 1);
    strict_1.default.equal(query.pageSize, 20);
    strict_1.default.equal(query.search, "member");
    strict_1.default.equal(query.role, "MEMBER");
    strict_1.default.equal(query.status, "ACTIVE");
    strict_1.default.equal(query.sortBy, "createdAt");
    strict_1.default.equal(query.sortOrder, "desc");
});
(0, node_test_1.default)("list payments query schema rejects oversized pages", () => {
    strict_1.default.throws(() => schemas_2.listPaymentsQuerySchema.parse({
        pageSize: 101,
    }));
});
(0, node_test_1.default)("list subscriptions query schema accepts status and sort overrides", () => {
    const query = schemas_3.listSubscriptionsQuerySchema.parse({
        status: "CANCELLED_AT_PERIOD_END",
        sortBy: "endDate",
        sortOrder: "asc",
    });
    strict_1.default.equal(query.status, "CANCELLED_AT_PERIOD_END");
    strict_1.default.equal(query.sortBy, "endDate");
    strict_1.default.equal(query.sortOrder, "asc");
});
(0, node_test_1.default)("list progress query schema validates diet category filters", () => {
    const query = schemas_4.listProgressQuerySchema.parse({
        search: "coach",
        dietCategory: "NORMAL",
    });
    strict_1.default.equal(query.search, "coach");
    strict_1.default.equal(query.dietCategory, "NORMAL");
    strict_1.default.throws(() => schemas_4.listProgressQuerySchema.parse({
        dietCategory: "INVALID",
    }));
});
//# sourceMappingURL=list-query-schemas.unit.test.js.map