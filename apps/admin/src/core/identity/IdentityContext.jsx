const AUTH_BASE = "/api/auth";

const res = await fetch(`${AUTH_BASE}/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: String(email || "").trim() }),
});
