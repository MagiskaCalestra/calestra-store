import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const SERVICE = "mock-api";
const PORT = Number(process.env.PORT || "14000");

const app = express();
app.use(helmet());
app.use(cors({ origin: ["http://localhost:5175","http://localhost:5288"], credentials: false }));
app.use(rateLimit({ windowMs: 60_000, max: 300 }));

app.get("/status", (req, res) => res.json({ ok: true, service: SERVICE }));

app.listen(PORT, () => console.log(`[${SERVICE}] listening on http://localhost:${PORT}`));
