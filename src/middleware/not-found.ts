import { Request, Response, NextFunction } from "express";

// Handles requests that do not match any route.
export function notFoundMiddleware(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
