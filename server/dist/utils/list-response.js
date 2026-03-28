"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginationMeta = createPaginationMeta;
function createPaginationMeta(page, pageSize, total) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}
//# sourceMappingURL=list-response.js.map