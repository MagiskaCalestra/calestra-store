const express = require("express");
const { applySecurity } = require("../_shared/security");

const PORT = Number(process.env.INFINITY_PORT || 14500);
const app = express();
applySecurity(app, { corsOrigins: "*" });

app.get("/health", (_, res) => res.json({ ok: true, service: "infinity" }));

app.listen(PORT, () => {
  console.log(`[infinity] listening on http://localhost:${PORT}`);
});
