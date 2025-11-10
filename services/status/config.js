// helpers
function num(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

// porta
const STATUS_PORT = num(process.env.STATUS_PORT || process.env.PORT, 15300);

// vilka tjänster som pingas
const TARGETS = [
  { name: "mock-api", url: "http://localhost:5399/health" },
  { name: "nexus",    url: "http://localhost:14000/health" },
  { name: "c-core",   url: "http://localhost:15000/health" },
  { name: "infinity", url: "http://localhost:14500/health" },
  { name: "finance",  url: "http://localhost:15100/health" },
  { name: "orders",   url: "http://localhost:15200/health" }
];

module.exports = { STATUS_PORT, TARGETS };
