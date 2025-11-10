const express = require("express");
const { applySecurity } = require("../_shared/security");

const PORT = Number(process.env.NEXUS_PORT || 14000);
const app = express();
applySecurity(app, { corsOrigins: "*" });

app.get("/health", (_, res) => res.json({ ok: true, service: "nexus" }));

app.listen(PORT, () => {
  console.log(`[nexus] listening on http://localhost:${PORT}`);
});
