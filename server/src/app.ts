import express from "express";
import { env } from "./config/env";
import { routes } from "./routes";
import { notFoundMiddleware } from "./middleware/not-found";
import { errorHandlerMiddleware } from "./middleware/error-handler";
import { sanitizeInputMiddleware } from "./middleware/sanitize-input";
import { requestLoggerMiddleware } from "./middleware/request-logger";
import { authRateLimiter, mutationRateLimiter } from "./middleware/rate-limit";
import { requestIdMiddleware } from "./middleware/request-id";
import { performanceMetricsMiddleware } from "./middleware/perf-metrics";

const helmet = require("helmet");

// Creates the HTTP application and wires cross-cutting middleware.
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use((req, res, next) => {
    const origin = req.header("origin");
    const allowedOrigins = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);

    if (origin && allowedOrigins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    res.header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-Id");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");

    if (req.method === "OPTIONS") {
      res.status(204).send();
      return;
    }

    next();
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "same-site" },
    }),
  );
  app.use(performanceMetricsMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(express.json({ limit: env.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: env.jsonBodyLimit }));
  app.use(sanitizeInputMiddleware);
  app.use("/auth", authRateLimiter);
  app.use(mutationRateLimiter);
  app.use(routes);
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
