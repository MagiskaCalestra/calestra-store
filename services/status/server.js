const express = require("express");
const fetch = require("node-fetch");
const { applySecurity } = require("../_shared/security");
const { STATUS_PORT, TARGETS } = require("./config");

const app = express();
applySecurity(app, { corsOrigins: "*" });

app.get("/status.json", async (_, res) => {
  const out = { ok: true, services: {}, ts: Date.now() };
  await Promise.all(TARGETS.map(async t => {
    try {
      const r = await fetch(t.url, { timeout: 2500 });
      out.services[t.name] = { ok: r.ok, status: r.status };
      if (!r.ok) out.ok = false;
    } catch (e) {
      out.services[t.name] = { ok: false, status: 0, error: "fetch failed" };
      out.ok = false;
    }
  }));
  res.json(out);
});

app.listen(STATUS_PORT, () => {
  console.log(`[status] listening on http://localhost:${STATUS_PORT}  (JSON: /status.json)`);
});
