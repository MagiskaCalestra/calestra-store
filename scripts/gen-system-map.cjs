// scripts/gen-system-map.cjs
// Skapar docs/system-map.mmd baserat på dina portar och /health

const fs = require("fs");
const http = require("http");

// Standardportar (kan gärna läsas från .env om du vill)
const PORTS = {
  CORE: 15000,
  INFY: 14500,
  NEXUS: 14000,
  MOCK: 5399,
};

const BASES = {
  CORE: `http://localhost:${PORTS.CORE}`,
  INFY: `http://localhost:${PORTS.INFY}`,
  NEXUS: `http://localhost:${PORTS.NEXUS}`,
  MOCK: `http://localhost:${PORTS.MOCK}`,
};

function check(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve({ up: true, url });
    });
    req.on("error", () => resolve({ up: false, url }));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve({ up: false, url });
    });
  });
}

(async () => {
  const checks = await Promise.all([
    check(`${BASES.CORE}/health`),
    check(`${BASES.INFY}/health`),
    check(`${BASES.NEXUS}/health`),
    check(`${BASES.MOCK}/health`),
  ]);

  const status = {
    CORE: checks[0].up,
    INFY: checks[1].up,
    NEXUS: checks[2].up,
    MOCK: checks[3].up,
  };

  const up = (b) => (b ? "✓" : "✗");

  const lines = [
    "flowchart TB",
    "",
    'subgraph Client["🧑‍💻 Webbläsare (användare)"]',
    '  UI["Store-Classic<br/>(Vite 5175/5288)"]',
    "end",
    "",
    'subgraph Services["★ Backend-tjänster"]',
    `  CORE["c-core<br/>${BASES.CORE}<br/>/health ${up(status.CORE)}"]:::u`,
    `  INFY["infinity<br/>${BASES.INFY}<br/>/progress/summary, /progress ${up(status.INFY)}"]:::u`,
    `  NEXUS["nexus<br/>${BASES.NEXUS}<br/>(router / mellanlager) ${up(status.NEXUS)}"]:::u`,
    `  MOCK["mock-api<br/>${BASES.MOCK}<br/>(dev-fake) ${up(status.MOCK)}"]:::u`,
    "end",
    "",
    "UI -->|via @core/api/index.js| CORE",
    "UI -->|progress meter| INFY",
    "UI -. optional .-> NEXUS",
    "NEXUS -->|proxy| CORE",
    "NEXUS -->|proxy| INFY",
    "",
    "classDef u fill:#153,stroke:#0f5,stroke-width:1.4,color:#fff;",
  ];

  if (!fs.existsSync("docs")) fs.mkdirSync("docs");
  fs.writeFileSync("docs/system-map.mmd", lines.join("\n"), "utf8");

  console.log("[sysmap] Wrote docs/system-map.mmd");
  console.log(`  - c-core   ${status.CORE ? "UP" : "DOWN"}   ${BASES.CORE}`);
  console.log(`  - infinity ${status.INFY ? "UP" : "DOWN"}   ${BASES.INFY}`);
  console.log(`  - nexus    ${status.NEXUS ? "UP" : "DOWN"}   ${BASES.NEXUS}`);
  console.log(`  - mock-api ${status.MOCK ? "UP" : "DOWN"}   ${BASES.MOCK}`);
})();
