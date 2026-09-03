import { config } from "../../config/env.js";

const state = {
  startedAt: new Date().toISOString(),
  http: {
    total: 0,
    byMethod: {},
    byRoute: {},
    byStatus: {},
    latencyMs: {
      total: 0,
      count: 0,
      min: null,
      max: null,
    },
  },
  graphql: {
    total: 0,
    success: 0,
    error: 0,
    retries: 0,
    byOperation: {},
    latencyMs: {
      total: 0,
      count: 0,
      min: null,
      max: null,
    },
  },
  cache: {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
  },
  recentEvents: [],
};

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function addLatency(target, durationMs) {
  target.total += durationMs;
  target.count += 1;
  target.min =
    target.min === null ? durationMs : Math.min(target.min, durationMs);
  target.max =
    target.max === null ? durationMs : Math.max(target.max, durationMs);
}

function pushRecentEvent(event, payload) {
  state.recentEvents.push({
    timestamp: new Date().toISOString(),
    event,
    payload,
  });

  const maxEvents = Math.max(20, config.observabilityRecentEventsLimit);
  if (state.recentEvents.length > maxEvents) {
    state.recentEvents.splice(0, state.recentEvents.length - maxEvents);
  }
}

export function recordHttpRequest({
  method,
  route,
  statusCode,
  durationMs,
  requestId,
}) {
  state.http.total += 1;
  increment(state.http.byMethod, method || "UNKNOWN");
  increment(state.http.byRoute, route || "UNKNOWN");
  increment(state.http.byStatus, String(statusCode || "UNKNOWN"));
  addLatency(state.http.latencyMs, durationMs);

  pushRecentEvent("http.request.completed", {
    requestId,
    method,
    route,
    statusCode,
    durationMs,
  });
}

export function recordGraphqlStart({ operationName, requestId }) {
  state.graphql.total += 1;
  increment(state.graphql.byOperation, operationName || "anonymous");

  pushRecentEvent("graphql.request.started", {
    requestId,
    operationName,
  });
}

export function recordGraphqlRetry({
  operationName,
  requestId,
  attempt,
  delayMs,
}) {
  state.graphql.retries += 1;

  pushRecentEvent("graphql.request.retry", {
    requestId,
    operationName,
    attempt,
    delayMs,
  });
}

export function recordGraphqlCompleted({
  operationName,
  requestId,
  status,
  durationMs,
  errorMessage,
}) {
  if (status === "success") {
    state.graphql.success += 1;
  } else {
    state.graphql.error += 1;
  }

  addLatency(state.graphql.latencyMs, durationMs);

  pushRecentEvent("graphql.request.completed", {
    requestId,
    operationName,
    status,
    durationMs,
    errorMessage,
  });
}

export function recordCacheEvent({ action, namespace, key, ttlMs, prefix }) {
  if (action === "hit") {
    state.cache.hits += 1;
  }

  if (action === "miss") {
    state.cache.misses += 1;
  }

  if (action === "set") {
    state.cache.sets += 1;
  }

  if (action === "invalidate") {
    state.cache.invalidations += 1;
  }

  pushRecentEvent("cache.event", {
    action,
    namespace,
    key,
    ttlMs,
    prefix,
  });
}

function withAverages(latency) {
  return {
    ...latency,
    average:
      latency.count > 0
        ? Number((latency.total / latency.count).toFixed(2))
        : 0,
  };
}

export function getMetricsSnapshot() {
  return {
    startedAt: state.startedAt,
    now: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    http: {
      ...state.http,
      latencyMs: withAverages(state.http.latencyMs),
    },
    graphql: {
      ...state.graphql,
      latencyMs: withAverages(state.graphql.latencyMs),
    },
    cache: {
      ...state.cache,
      hitRate:
        state.cache.hits + state.cache.misses > 0
          ? Number(
              (
                (state.cache.hits / (state.cache.hits + state.cache.misses)) *
                100
              ).toFixed(2),
            )
          : 0,
    },
    recentEvents: [...state.recentEvents],
  };
}
