type LogLevel = "info" | "error";

type LogPayload = Record<string, unknown>;

function emit(level: LogLevel, event: string, payload: LogPayload = {}): void {
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

export function logInfo(event: string, payload: LogPayload = {}): void {
  emit("info", event, payload);
}

export function logError(event: string, payload: LogPayload = {}): void {
  emit("error", event, payload);
}

