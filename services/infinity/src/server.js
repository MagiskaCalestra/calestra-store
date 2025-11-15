// services/infinity/src/server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";

const SERVICE = "infinity";
const PORT = process.env.PORT || "14580";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5175", "http://localhost:5288"],
    credentials: false,
  })
);
app.use(helmet());

function loadJson(fileName) {
  const file = path.join(process.cwd(), "data", fileName);
  const text = fs.readFileSync(file, "utf-8");
  return JSON.parse(text);
}

app.get("/status", (req, res) => {
  res.json({ ok: true, service: SERVICE });
});

// Produktenpunkt som butiken använder
app.get("/products", (req, res) => {
  try {
    const data = loadJson("products.json");
    res.json(data);
  } catch (err) {
    console.error("[infinity] /products error:", err);
    res.status(500).json({ ok: false, error: "products_failed" });
  }
});

// Kapital/progress-ändpunkt som butiken och webben kan dela
app.get("/progress/summary", (req, res) => {
  try {
    const data = loadJson("progress.json");
    res.json(data);
  } catch (err) {
    console.error("[infinity] /progress/summary error:", err);
    res.status(500).json({ ok: false, error: "progress_failed" });
  }
});

app.listen(PORT, () => {
  console.log(`[${SERVICE}] listening on http://localhost:${PORT}`);
});
