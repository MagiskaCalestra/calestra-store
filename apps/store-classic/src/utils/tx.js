export function tx(t, key, fallback) {
  try {
    const val = t(key, fallback ?? key);
    return typeof val === "string" ? val : fallback ?? key;
  } catch {
    return fallback ?? key;
  }
}
