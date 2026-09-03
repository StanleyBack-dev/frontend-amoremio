function toPositiveInt(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export function buildListInput(query, allowedKeys = []) {
  const input = {};

  for (const key of allowedKeys) {
    const value = query[key];
    if (typeof value === "string" && value.trim()) {
      input[key] = value.trim();
    }
  }

  const page = toPositiveInt(query.page);
  if (page) {
    input.page = page;
  }

  const limit = toPositiveInt(query.limit);
  if (limit) {
    input.limit = limit;
  }

  return input;
}
