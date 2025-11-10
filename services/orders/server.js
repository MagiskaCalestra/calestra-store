const express = require("express");
const { applySecurity } = require("../_shared/security");

const PORT = Number(process.env.ORDERS_PORT || 15200);
const app = express();
applySecurity(app, { corsOrigins: "*" });

app.get("/health", (_, res) => res.json({ ok: true, service: "orders" }));

app.listen(PORT, () => {
  console.log(`[orders] listening on http://localhost:${PORT}`);
});
