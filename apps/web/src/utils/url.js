// Utility: merge query params (add/overwrite) safely
export function mergeQuery(baseUrl, extraParams = {}) {
  try {
    const u = new URL(baseUrl, window.location.origin);
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v != null && v !== "") u.searchParams.set(k, String(v));
    });
    return u.toString();
  } catch {
    return baseUrl;
  }
}

// Very small allowlist for external redirects (tighten as needed)
export function isAllowedHost(href) {
  try {
    const u = new URL(href);
    return [
      "www.youtube.com",
      "youtube.com",
      "www.instagram.com",
      "instagram.com",
      "ads.google.com",
      "www.temu.com",
      "temu.com",
      "vercel.com",
      "www.vercel.com",
    ].includes(u.host);
  } catch {
    return false;
  }
}
