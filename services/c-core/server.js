const path = require("path");
const express = require("express");
const { applySecurity } = require("../_shared/security");

const PORT = Number(process.env.C_CORE_PORT || 15000);
const app = express();
applySecurity(app, { corsOrigins: ["http://localhost:5175","http://localhost:5288","http://localhost:5173","http://localhost:5174"] });

app.get("/health", (_, res) => res.json({ ok: true, service: "c-core" }));

// exempel-API
app.get("/progress/summary", (_, res) => {
  res.json({ ok:true, total: 0, updatedAt: Date.now() });
});

app.listen(PORT, () => {
  console.log(`[c-core] listening on http://localhost:${PORT}`);
});
