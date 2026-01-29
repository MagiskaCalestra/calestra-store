import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT || 14090);

// In-memory (v1). Sen kan vi byta till sqlite/json-file utan att ändra klienter.
const events = [];

const ORIGINS = String(
  process.env.CORS_ORIGINS ||
    "http://localhost:5179,http://localhost:5180,http://localhost:5175,http://localhost:5176,http://localhost:5288,http://localhost:5289"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (ORIGINS.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "256kb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "analytics-service", port: PORT, count: events.length });
});

// POST /events
// body: { app:"store|web|admin", env:"green|blue", type:"page|click|purchase|error", name:"...", value?:number, meta?:object }
app.post("/events", (req, res) => {
  const e = req.body || {};
  const item = {
    at: new Date().toISOString(),
    app: String(e.app || "unknown").slice(0, 20),
    env: String(e.env || "unknown").slice(0, 20),
    type: String(e.type || "event").slice(0, 30),
    name: String(e.name || "").slice(0, 120),
    value: Number.isFinite(e.value) ? e.value : undefined,
    meta: e.meta && typeof e.meta === "object" ? e.meta : undefined
  };
  events.push(item);
  res.json({ ok: true });
});

// GET /summary?range=day
app.get("/summary", (req, res) => {
  const range = String(req.query.range || "day");
  // v1: enkel summering
  const byType = {};
  for (const e of events) byType[e.type] = (byType[e.type] || 0) + 1;

  res.json({
    ok: true,
    range,
    total: events.length,
    byType,
    last: events.slice(-20)
  });
});

app.listen(PORT, () => {
  console.log(`[analytics-service] listening on http://localhost:${PORT}`);
  console.log(`[analytics-service] Allowed origins: ${ORIGINS.join(", ")}`);
});
