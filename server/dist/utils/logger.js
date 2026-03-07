"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInfo = logInfo;
exports.logError = logError;
function emit(level, event, payload = {}) {
    const record = {
        ts: new Date().toISOString(),
        level,
        event,
        ...payload,
    };
    const line = JSON.stringify(record);
    if (level === "error") {
        console.error(line);
        return;
    }
    console.log(line);
}
function logInfo(event, payload = {}) {
    emit("info", event, payload);
}
function logError(event, payload = {}) {
    emit("error", event, payload);
}
//# sourceMappingURL=logger.js.map