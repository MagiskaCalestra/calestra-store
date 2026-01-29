import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT || 14010);

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
      // allow curl/server-to-server/no-origin
      if (!origin) return cb(null, true);
      if (ORIGINS.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "finance-service", port: PORT });
});

/**
 * GET /summary?mode=test|live&range=day|7d
 * (v1 minimal payload så Admin kan rendera utan att krascha)
 */
app.get("/summary", (req, res) => {
  const mode = String(req.query.mode || process.env.FINANCE_MODE_DEFAULT || "test");
  const range = String(req.query.range || "day");

  const dailyTarget = Number(process.env.DAILY_TARGET_SEK || 65000);

  // V1: dummy-siffror (byt senare till riktiga)
  const today = {
    gross: 0,
    tax: 0,
    net: 0,
    currency: "SEK",
    target: dailyTarget,
    progress: 0
  };

  const sevenDays = {
    gross: 0,
    tax: 0,
    net: 0,
    currency: "SEK"
  };

  res.json({
    ok: true,
    mode,
    range,
    today,
    sevenDays
  });
});

app.listen(PORT, () => {
  console.log(`[finance-service] listening on http://127.0.0.1:${PORT}`);
  console.log(`[finance-service] allowed origins: ${ORIGINS.join(", ")}`);
});
