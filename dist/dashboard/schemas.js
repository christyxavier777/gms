"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recentLimitQuerySchema = void 0;
const zod_1 = require("zod");
// Optional limit query for recent progress sections.
exports.recentLimitQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(5),
});
//# sourceMappingURL=schemas.js.map