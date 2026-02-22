"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInputMiddleware = sanitizeInputMiddleware;
function sanitizeValue(value, trimStrings) {
    if (typeof value === "string") {
        const noNullBytes = value.replace(/\u0000/g, "");
        return trimStrings ? noNullBytes.trim() : noNullBytes;
    }
    if (Array.isArray(value)) {
        return value.map((entry) => sanitizeValue(entry, trimStrings));
    }
    if (value !== null && typeof value === "object") {
        const source = value;
        const target = {};
        for (const [key, nested] of Object.entries(source)) {
            target[key] = sanitizeValue(nested, trimStrings);
        }
        return target;
    }
    return value;
}
// Sanitizes request params/query/body to prevent control-byte abuse.
function sanitizeInputMiddleware(req, _res, next) {
    for (const key of Object.keys(req.params)) {
        req.params[key] = sanitizeValue(req.params[key], true);
    }
    const queryRecord = req.query;
    for (const key of Object.keys(queryRecord)) {
        queryRecord[key] = sanitizeValue(queryRecord[key], true);
    }
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeValue(req.body, false);
    }
    next();
}
//# sourceMappingURL=sanitize-input.js.map