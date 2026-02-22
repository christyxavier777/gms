import express from "express";
import { routes } from "./routes";
import { notFoundMiddleware } from "./middleware/not-found";
import { errorHandlerMiddleware } from "./middleware/error-handler";

// Creates the HTTP application and wires cross-cutting middleware.
export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(routes);
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
