const express = require("express");
const { applySecurity } = require("../_shared/security");

const PORT = Number(process.env.MOCK_API_PORT || 5399);
const app = express();
applySecurity(app, { corsOrigins: "*" });

app.get("/health", (_, res) => res.json({ ok: true, service: "mock-api" }));
// (lägg dina mock-routes här)

app.listen(PORT, () => {
  console.log(`[mock-api] listening on http://localhost:${PORT}`);
});
