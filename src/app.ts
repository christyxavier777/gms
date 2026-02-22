import express from "express";
import { env } from "./config/env";
import { routes } from "./routes";
import { notFoundMiddleware } from "./middleware/not-found";
import { errorHandlerMiddleware } from "./middleware/error-handler";
import { sanitizeInputMiddleware } from "./middleware/sanitize-input";
import { requestLoggerMiddleware } from "./middleware/request-logger";
import { authRateLimiter, mutationRateLimiter } from "./middleware/rate-limit";

const helmet = require("helmet");

// Creates the HTTP application and wires cross-cutting middleware.
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "same-site" },
    }),
  );
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
