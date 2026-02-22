import { NextFunction, Request, Response } from "express";

function sanitizeValue(value: unknown, trimStrings: boolean): unknown {
  if (typeof value === "string") {
    const noNullBytes = value.replace(/\u0000/g, "");
    return trimStrings ? noNullBytes.trim() : noNullBytes;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry, trimStrings));
  }

  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const target: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(source)) {
      target[key] = sanitizeValue(nested, trimStrings);
    }
    return target;
  }

  return value;
}

// Sanitizes request params/query/body to prevent control-byte abuse.
export function sanitizeInputMiddleware(req: Request, _res: Response, next: NextFunction): void {
  for (const key of Object.keys(req.params)) {
    req.params[key] = sanitizeValue(req.params[key], true) as string;
  }
  const queryRecord = req.query as Record<string, unknown>;
  for (const key of Object.keys(queryRecord)) {
    queryRecord[key] = sanitizeValue(queryRecord[key], true);
  }
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body, false);
  }
  next();
}
