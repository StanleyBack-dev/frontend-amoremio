import { randomUUID } from "node:crypto";
import { logEvent, summarizePayload } from "./logger.js";
import { recordHttpRequest } from "./metrics-store.js";

function getDurationMs(startNs) {
  const durationNs = process.hrtime.bigint() - startNs;
  return Number(durationNs) / 1_000_000;
}

function resolveRoute(req) {
  const [path] = (req.originalUrl || req.url || "").split("?");
  return path || "/";
}

export function requestLoggingMiddleware(req, res, next) {
  const requestId = req.headers["x-request-id"] || randomUUID();
  const startedAtNs = process.hrtime.bigint();

  req.requestId = String(requestId);
  res.setHeader("x-request-id", req.requestId);

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.locals.responseBody = undefined;

  res.json = (body) => {
    res.locals.responseBody = body;
    return originalJson(body);
  };

  res.send = (body) => {
    res.locals.responseBody = body;
    return originalSend(body);
  };

  logEvent("info", "http.request.received", {
    requestId: req.requestId,
    method: req.method,
    route: resolveRoute(req),
    query: req.query,
    params: req.params,
    body: summarizePayload(req.body),
    headers: {
      "x-user-id": req.headers["x-user-id"],
      "user-agent": req.headers["user-agent"],
    },
  });

  res.on("finish", () => {
    const durationMs = Number(getDurationMs(startedAtNs).toFixed(2));
    const route = resolveRoute(req);

    recordHttpRequest({
      requestId: req.requestId,
      method: req.method,
      route,
      statusCode: res.statusCode,
      durationMs,
    });

    logEvent("info", "http.request.completed", {
      requestId: req.requestId,
      method: req.method,
      route,
      statusCode: res.statusCode,
      durationMs,
      response: summarizePayload(res.locals.responseBody),
    });
  });

  next();
}
