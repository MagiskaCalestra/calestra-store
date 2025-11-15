import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-origin" } }));
app.use(cors({ origin: ["http://localhost:5175","http://localhost:5288"], credentials: false }));
app.use(rateLimit({ windowMs: 60_000, max: 300 }));

app.get("/status", (_, res) => res.json({ ok: true, service: process.env.SERVICE || "unknown" }));

const PORT = process.env.PORT || 14000;
app.listen(PORT, () => console.log(`[${process.env.SERVICE || "svc"}] listening on port ${PORT}`));
