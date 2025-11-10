// c-core/server/index.js
// Progress Orchestrator – PUBLIC (non-monetary) + ADMIN (monetary)
// Kör: node server/index.js  (kräver Node 18+)

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5175;

// ---- Säkerhet / tokens ----
const INGEST_TOKEN = process.env.INGEST_TOKEN || "ingest_dev_token";
const ADMIN_TOKEN  = process.env.ADMIN_TOKEN  || "admin_dev_token";

// ---- Fil-baserad lagring (byt till Postgres i produktion) ----
const DATA_FILE = path.resolve("./progress_ledger.json");
function readState() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")); }
  catch { return { ledger: [], base_currency: "SEK", goals: defaultGoals(), updated_at: null }; }
}
function writeState(next) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2));
}

function defaultGoals() {
  return [
    // globalt mål (allt)
    { goal_id: "core_global", channel: "all", target_units: 1_000_000, title: "Core Goal" },
    // butik
    { goal_id: "store_main", channel: "store", target_units: 500_000, title: "Store Goal" }
  ];
}

// ---- “Display”-mappning (privat → publik) --------------------
// Vi blandar flera signaler och returnerar endast "units" (Lumens).
// - amount_base_cents vägs 1.0x (privat, men påverkar)
// - 1 order = +120 units
// - 1 supporter = +300 units (om event.meta.first_time === true)
// - tags kan ge bonus (t.ex. "support")
function unitsFromEvent(e) {
  const base = Math.max(0, e.amount_base_cents || 0);
  const wAmount   = base * 0.10;            // 10% av örena → units (heltal)
  const wOrder    = e.type.includes("PURCHASE") ? 120 : 0;
  const wSupport  = e.meta?.first_time ? 300 : 0;
  const tagBonus  = Array.isArray(e.tags) && e.tags.includes("support") ? 1.15 : 1.0;

  // rundat och skalfaktor för att undvika att man baklutar pengar
  const units = Math.floor((wAmount + wOrder + wSupport) * tagBonus);

  return units; // detta exponeras publikt, pengar aldrig
}

// ---- Milestones (dekoration + effekter) -----------------------
const MILESTONES = [
  { id: "m1", pct: 25, title: "First spark",   reward: "launch badge",       eta: "wk 42", effect: "pulse",     palette: ["#5F79FF","#9AA6FF"] },
  { id: "m2", pct: 50, title: "Community",     reward: "private dev log",    eta: "wk 45", effect: "aurora",    palette: ["#6E86FF","#BBD0FF"] },
  { id: "m3", pct: 75, title: "Maker drop",    reward: "digital Maker pack", eta: "wk 48", effect: "sparks",    palette: ["#9AA6FF","#DCE2FF"] },
  { id: "m4", pct:100, title: "Release step",  reward: "supporter credits",  eta: "Q1",    effect: "fireworks", palette: ["#A7B3FF","#FFFFFF"] },
];

// ---- Hjälp: ackumulera per kanal → units & pengar -------------
function aggregate(ledger, { channel = "all" } = {}) {
  let sumUnits = 0;
  let sumBase  = 0;
  let orders = 0, supporters = 0, items = 0;

  for (const e of ledger) {
    if (channel !== "all" && e.channel !== channel) continue;
    const sign = e.type === "REFUND" ? -1 : 1;

    sumUnits += sign * unitsFromEvent(e);
    sumBase  += sign * (e.amount_base_cents || 0);

    if (e.type.includes("PURCHASE")) orders += sign * 1;
    if (e.meta?.first_time) supporters += sign * 1;
    if (typeof e.meta?.items === "number") items += sign * e.meta.items;
  }
  if (sumUnits < 0) sumUnits = 0;

  return { sumUnits, sumBase, orders, supporters, items };
}

// ---- SSE (server-sent events) ---------------------------------
const sseClients = new Set();
app.get("/progress/public/stream", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });
  res.flushHeaders();

  const client = { res };
  sseClients.add(client);

  res.write(`event: hello\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  req.on("close", () => sseClients.delete(client));
});
function sseBroadcast(evt, data) {
  const payload = `event: ${evt}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of sseClients) c.res.write(payload);
}

// ---- PUBLIC: total (pengalös) --------------------------------
app.get("/progress/public", (req, res) => {
  const channel = (req.query.channel || "all").toString();
  const state = readState();
  const { sumUnits, orders, supporters, items } = aggregate(state.ledger, { channel });

  const goal = state.goals.find(g => g.channel === channel) ||
               state.goals.find(g => g.channel === "all");

  const targetUnits = Math.max(1, goal?.target_units || 1_000_000);
  const percent = Math.min(100, (sumUnits / targetUnits) * 100);

  res.json({
    channel,
    percent,
    current_units: sumUnits,
    target_units: targetUnits,
    breakdown: { orders, supporters, items },
    milestones: MILESTONES,
    updated_at: state.updated_at
  });
});

// ---- ADMIN: totals (med pengar) -------------------------------
app.get("/progress/admin", (req, res) => {
  if ((req.headers.authorization || "") !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const channel = (req.query.channel || "all").toString();
  const state = readState();
  const { sumUnits, sumBase, orders, supporters, items } = aggregate(state.ledger, { channel });

  res.json({
    channel,
    base_currency: state.base_currency || "SEK",
    amount_base_cents: sumBase,
    current_units: sumUnits,
    breakdown: { orders, supporters, items },
    goals: state.goals,
    milestones: MILESTONES,
    updated_at: state.updated_at
  });
});

// ---- INGEST (idempotent) -------------------------------------
app.post("/progress/events", (req, res) => {
  if ((req.headers.authorization || "") !== `Bearer ${INGEST_TOKEN}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const payload = req.body || {};
  if (!payload.event_id) {
    return res.status(400).json({ error: "missing event_id" });
  }

  const state = readState();
  const exists = state.ledger.find(e => e.event_id === payload.event_id);
  if (exists) return res.status(200).json({ ok: true, idempotent: true });

  // Grundvalidering
  const now = new Date().toISOString();
  const entry = {
    event_id: payload.event_id,
    source: payload.source || "unknown",
    type: payload.type || "PURCHASE_CAPTURED",
    occurred_at: payload.occurred_at || now,
    ingested_at: now,
    currency: payload.currency || "EUR",
    amount_cents: Number(payload.amount_cents || 0),
    fx_rate_to_base: Number(payload.fx_rate_to_base || 1),
    base_currency: payload.base_currency || "SEK",
    amount_base_cents: Number(payload.amount_base_cents ?? Math.round((payload.amount_cents || 0) * (payload.fx_rate_to_base || 1))),
    channel: payload.channel || "store",
    tags: payload.tags || [],
    account_id: payload.account_id || null,
    meta: payload.meta || {}
  };

  state.ledger.push(entry);
  state.updated_at = now;
  writeState(state);

  // Broadcast till live-klienter (pengalöst)
  const { sumUnits } = aggregate(state.ledger, { channel: "all" });
  const goal = state.goals.find(g => g.channel === "all");
  const targetUnits = Math.max(1, goal?.target_units || 1_000_000);
  const percent = Math.min(100, (sumUnits / targetUnits) * 100);

  sseBroadcast("progress", {
    channel: "all",
    percent,
    delta_units: unitsFromEvent(entry),
    tag_hint: entry.tags?.[0] || null,
    effect_hint: milestoneEffectFor(percent)
  });

  return res.status(201).json({ ok: true });
});

function milestoneEffectFor(percent) {
  let out = null;
  for (const m of MILESTONES) {
    if (percent >= m.pct) out = m.effect;
  }
  return out;
}

// ---- ADMIN: set goal targets / channels -----------------------
app.post("/progress/admin/goals", (req, res) => {
  if ((req.headers.authorization || "") !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const state = readState();
  const { goal_id, channel, target_units, title } = req.body || {};
  if (!goal_id) return res.status(400).json({ error: "missing goal_id" });

  const idx = state.goals.findIndex(g => g.goal_id === goal_id);
  const next = { goal_id, channel: channel || "all", target_units: Number(target_units || 1_000_000), title: title || "Goal" };
  if (idx === -1) state.goals.push(next); else state.goals[idx] = next;

  state.updated_at = new Date().toISOString();
  writeState(state);
  res.json({ ok: true, goal: next });
});

app.listen(PORT, () => {
  console.log(`C-Core Progress listening on :${PORT}`);
});
