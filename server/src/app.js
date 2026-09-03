import express from "express";
import cors from "cors";
import routes from "./routes.js";
import { requestLoggingMiddleware } from "./shared/observability/request-logging.middleware.js";
import { rateLimitMiddleware } from "./shared/rate-limit/rate-limit.middleware.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLoggingMiddleware);
app.use(rateLimitMiddleware);

app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", routes);

app.get("/", (_req, res) => {
  res.send("BFF is running");
});

export default app;
