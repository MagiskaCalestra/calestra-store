// D:\WebProjects\Calestra\apps\admin\src\pages\system\QAPanel.jsx
import React from "react";

const FLAGS_KEY = "cc.admin.flags.v1";

function readFlags() {
  try {
    const raw = localStorage.getItem(FLAGS_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return {
      // Testlansering: håll det säkert. Summaries är valfria.
      enableFinanceSummary: !!v.enableFinanceSummary,
      enableAnalyticsSummary: !!v.enableAnalyticsSummary,
      showRaw: v.showRaw !== false, // default true (bra för felsök)
    };
  } catch {
    return { enableFinanceSummary: false, enableAnalyticsSummary: false, showRaw: true };
  }
}

function writeFlags(next) {
  try {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(next, null, 2));
  } catch {}
}

function ms(n) {
  if (typeof n !== "number") return "—";
  return `${Math.round(n)} ms`;
}

function safeText(x, limit = 2400) {
  const s = String(x ?? "");
  return s.length > limit ? s.slice(0, limit) + "\n…(truncated)" : s;
}

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const txt = await res.text().catch(() => "");
  try {
    return JSON.parse(txt);
  } catch {
    return { message: txt };
  }
}

async function fetchWithTimeout(url, { timeoutMs = 2500, ...opts } = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

function Pill({ kind, children }) {
  const cls =
    kind === "ok"
      ? "pill pill-ok"
      : kind === "fail"
      ? "pill pill-fail"
      : kind === "skip"
      ? "pill pill-skip"
      : "pill pill-soft";
  return <span className={cls}>{children}</span>;
}

/**
 * QA PANEL PRINCIP:
 * - RÖD = blockerar testlansering (Orders måste vara OK)
 * - GRÖN = OK
 * - GUL/SKIP = valfritt / inte kopplat ännu (ska aldrig krascha admin)
 */
export default function QAPanel() {
  const [flags, setFlags] = React.useState(() => readFlags());

  const [running, setRunning] = React.useState(false);
  const [finishedAt, setFinishedAt] = React.useState("");
  const [totalMs, setTotalMs] = React.useState(null);
  const [rows, setRows] = React.useState([]);

  const envName = React.useMemo(() => {
    try {
      return String(import.meta?.env?.VITE_APP_ENV || "green");
    } catch {
      return "green";
    }
  }, []);

  function updateFlag(key, value) {
    const next = { ...flags, [key]: value };
    setFlags(next);
    writeFlags(next);
  }

  function open(url) {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {}
  }

  function copy(text) {
    try {
      navigator.clipboard.writeText(String(text));
    } catch {}
  }

  async function runOne(test) {
    const t0 = performance.now();
    const base = {
      id: test.id,
      title: test.title,
      desc: test.desc,
      url: test.url,
      kind: "soft", // ok/fail/skip/soft
      ms: null,
      http: null,
      note: "",
      raw: "",
    };

    // hard skip by flag
    if (typeof test.enabled === "function" && !test.enabled(flags)) {
      return {
        ...base,
        kind: "skip",
        ms: performance.now() - t0,
        note: "Avstängd via feature-flag (valfritt för testlansering).",
      };
    }

    try {
      const res = await fetchWithTimeout(test.url, {
        method: test.method || "GET",
        headers: { Accept: "application/json" },
        timeoutMs: test.timeoutMs || 2500,
      });

      base.ms = performance.now() - t0;
      base.http = res.status;

      // SKIP on expected “not yet implemented”
      if (test.skipOn && test.skipOn.includes(res.status)) {
        const txt = await res.text().catch(() => "");
        return {
          ...base,
          kind: "skip",
          note: `Endpoint saknas ännu (HTTP ${res.status}). Detta är OK under testlansering.`,
          raw: flags.showRaw ? safeText(txt) : "",
        };
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return {
          ...base,
          kind: "fail",
          note: test.blocker ? "BLOCKER: måste fixas innan test." : `Fel (HTTP ${res.status}).`,
          raw: flags.showRaw ? safeText(txt) : "",
        };
      }

      // OK
      // försök JSON, men visa även text om JSON saknas
      const data = await safeJson(res);
      return {
        ...base,
        kind: "ok",
        note: `HTTP ${res.status}`,
        raw: flags.showRaw ? safeText(JSON.stringify(data, null, 2)) : "",
      };
    } catch (e) {
      base.ms = performance.now() - t0;
      const msg = String(e?.message || e);

      return {
        ...base,
        kind: test.blocker ? "fail" : "skip",
        note: test.blocker
          ? `BLOCKER: fetch failed (${msg})`
          : `Fetch failed (${msg}). Valfritt/inte kopplat ännu.`,
        raw: flags.showRaw ? safeText(msg) : "",
      };
    }
  }

  const tests = React.useMemo(() => {
    // Orders = BLOCKERS
    const list = [
      {
        id: "O0",
        title: "Orders /health via proxy",
        desc: "Måste vara OK för testlansering. Om denna faller: stoppa och fixa direkt.",
        url: "/svc/orders/health",
        blocker: true,
        timeoutMs: 1800,
      },
      {
        id: "O1",
        title: "Orders /api/orders via proxy",
        desc: "Admin läser orders från server. Detta är kärnan.",
        url: "/svc/orders/api/orders",
        blocker: true,
        timeoutMs: 2200,
      },

      // Finance (valfritt)
      {
        id: "F0",
        title: "Finance /health via proxy",
        desc: "Valfri under testlansering. Grön = OK.",
        url: "/svc/finance/health",
        blocker: false,
        timeoutMs: 1800,
      },
      {
        id: "F1",
        title: "Finance /api/finance/summary (test, day) via proxy",
        desc: "Valfri. Blir grön när endpoint finns.",
        // OBS: vi testar mot finance-service convention:
        // /api/finance/summary?mode=test&range=day
        url: "/svc/finance/api/finance/summary?mode=test&range=day",
        blocker: false,
        enabled: (f) => !!f.enableFinanceSummary,
        skipOn: [404, 405],
        timeoutMs: 2600,
      },

      // Analytics (valfritt)
      {
        id: "A0",
        title: "Analytics /health via proxy",
        desc: "Valfri under testlansering. Grön = OK.",
        url: "/svc/analytics/health",
        blocker: false,
        timeoutMs: 1800,
      },
      {
        id: "A1",
        title: "Analytics /stats/summary (day) via proxy",
        desc: "Valfri. Blir grön när endpoint finns.",
        // Vi testar en “rimlig” path; om din analytics har annan route -> ändra här.
        url: "/svc/analytics/stats/summary?env=green&range=day",
        blocker: false,
        enabled: (f) => !!f.enableAnalyticsSummary,
        skipOn: [404, 405],
        timeoutMs: 2600,
      },
    ];

    return list;
  }, []);

  async function runAll() {
    setRunning(true);
    setTotalMs(null);
    setFinishedAt("");
    const start = performance.now();

    const out = [];
    for (const t of tests) {
      // eslint-disable-next-line no-await-in-loop
      const r = await runOne(t);
      out.push(r);
      setRows([...out]);
    }

    setTotalMs(performance.now() - start);
    setFinishedAt(new Date().toISOString().replace("T", " ").slice(0, 19));
    setRunning(false);
  }

  React.useEffect(() => {
    // auto-run för att ge direkt status
    runAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blockersOk = React.useMemo(() => {
    const blockers = rows.filter((r) => r && r.id && r.id.startsWith("O"));
    if (!blockers.length) return false;
    return blockers.every((r) => r.kind === "ok");
  }, [rows]);

  return (
    <div>
      <div className="qaCard">
        <div className="qaHeader">
          <div>
            <div className="qaTitle">QA Checklist (snabb)</div>
            <div className="qaSub">
              Rött = blockerar testlansering. Gul = valfritt/inte kopplat ännu. Grönt = OK.
              <div style={{ marginTop: 6, opacity: 0.75 }}>
                Env: <b>{envName}</b> • Senast: <b>{finishedAt || "—"}</b>
              </div>
            </div>
          </div>

          <div className="qaHeaderRight">
            <button className="btn" onClick={runAll} disabled={running}>
              {running ? "…" : "Kör"}
            </button>

            <Pill kind="soft">{totalMs ? `Klar på ${ms(totalMs)}` : "—"}</Pill>
            <Pill kind={blockersOk ? "ok" : "fail"}>{blockersOk ? "BLOCKERS OK" : "BLOCKERS FAIL"}</Pill>
          </div>
        </div>

        <div className="qaQuick">
          <div className="qaQuickLeft">
            <div className="qaQuickTitle">Quick actions</div>
            <div className="qaQuickRow">
              <button className="btn" onClick={() => open("/svc/orders/api/orders")}>Öppna Orders API</button>
              <button className="btn" onClick={() => open("/svc/orders/health")}>Öppna Orders /health</button>
              <button className="btn" onClick={() => open("/svc/finance/health")}>Öppna Finance /health</button>
              <button className="btn" onClick={() => open("/svc/analytics/health")}>Öppna Analytics /health</button>
            </div>

            <div className="qaQuickRow" style={{ marginTop: 10 }}>
              <button className="btn" onClick={() => copy(window.location.href)}>Copy current URL</button>
              <button className="btn" onClick={() => copy(JSON.stringify(rows, null, 2))} disabled={!rows.length}>
                Copy QA JSON
              </button>
            </div>
          </div>

          <div className="qaQuickRight">
            <div className="qaQuickTitle">Feature flags (säkert)</div>

            <div className="flagRow">
              <label className="flagLabel">
                <input
                  type="checkbox"
                  checked={flags.enableFinanceSummary}
                  onChange={(e) => updateFlag("enableFinanceSummary", e.target.checked)}
                />
                <span>Aktivera Finance summary-test</span>
              </label>
              <span className="flagHint">Valfritt (SKIP annars)</span>
            </div>

            <div className="flagRow">
              <label className="flagLabel">
                <input
                  type="checkbox"
                  checked={flags.enableAnalyticsSummary}
                  onChange={(e) => updateFlag("enableAnalyticsSummary", e.target.checked)}
                />
                <span>Aktivera Analytics summary-test</span>
              </label>
              <span className="flagHint">Valfritt (SKIP annars)</span>
            </div>

            <div className="flagRow">
              <label className="flagLabel">
                <input
                  type="checkbox"
                  checked={flags.showRaw}
                  onChange={(e) => updateFlag("showRaw", e.target.checked)}
                />
                <span>Visa raw payload</span>
              </label>
              <span className="flagHint">Bra för felsök</span>
            </div>
          </div>
        </div>
      </div>

      <div className="qaList">
        {rows.map((r) => (
          <div key={r.id} className="qaItem">
            <div className="qaItemTop">
              <div>
                <div className="qaItemTitle">
                  {r.id}: {r.title}
                </div>
                <div className="qaItemDesc">{r.desc}</div>
                <div className="qaItemMeta">
                  URL: <span className="mono">{r.url}</span> • HTTP:{" "}
                  <span className="mono">{r.http ?? "—"}</span>
                </div>
              </div>

              <div className="qaItemRight">
                <div className="qaMs">{ms(r.ms)}</div>
                <Pill kind={r.kind}>{r.kind.toUpperCase()}</Pill>
              </div>
            </div>

            {r.note ? <div className="qaNote">{r.note}</div> : null}

            {flags.showRaw && r.raw ? (
              <pre className="qaRaw">{r.raw}</pre>
            ) : null}
          </div>
        ))}
      </div>

      <style>{`
        .qaCard{
          border:1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.05);
          border-radius: 22px;
          box-shadow: 0 18px 45px rgba(0,0,0,.40);
          padding: 14px;
        }
        .qaHeader{
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-start;
          flex-wrap: wrap;
        }
        .qaTitle{ font-weight: 950; font-size: 16px; }
        .qaSub{ margin-top: 6px; color: rgba(255,255,255,.70); font-size: 12px; line-height:1.4; }
        .qaHeaderRight{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

        .qaQuick{
          margin-top: 12px;
          display:grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 12px;
        }
        @media (max-width: 980px){
          .qaQuick{ grid-template-columns: 1fr; }
        }
        .qaQuickTitle{ font-weight: 950; margin-bottom: 8px; }
        .qaQuickRow{ display:flex; gap:10px; flex-wrap: wrap; }

        .flagRow{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding: 8px 10px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(0,0,0,.18);
          margin-bottom: 8px;
        }
        .flagLabel{ display:flex; align-items:center; gap:10px; font-weight: 900; }
        .flagHint{ color: rgba(255,255,255,.62); font-size: 12px; }

        .qaList{
          margin-top: 12px;
          display:grid;
          gap: 12px;
        }
        .qaItem{
          border:1px solid rgba(255,255,255,.10);
          background: rgba(2,6,23,0.40);
          border-radius: 18px;
          padding: 12px;
        }
        .qaItemTop{
          display:flex;
          justify-content:space-between;
          gap:12px;
          flex-wrap: wrap;
        }
        .qaItemTitle{ font-weight: 950; }
        .qaItemDesc{ color: rgba(255,255,255,.70); font-size: 12px; margin-top: 6px; }
        .qaItemMeta{ color: rgba(255,255,255,.62); font-size: 12px; margin-top: 8px; }
        .qaItemRight{ display:flex; align-items:center; gap:10px; }
        .qaMs{ color: rgba(255,255,255,.75); font-size: 12px; font-weight: 900; }

        .qaNote{
          margin-top: 10px;
          color: rgba(255,255,255,.78);
          font-size: 12px;
          font-weight: 900;
        }
        .qaRaw{
          margin-top: 10px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(0,0,0,.22);
          padding: 10px;
          overflow:auto;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 12px;
          color: rgba(255,255,255,.82);
        }

        .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

        .pill{
          display:inline-flex;
          align-items:center;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          font-weight: 950;
          font-size: 12px;
        }
        .pill-ok{ border-color: rgba(34,197,94,.35); background: rgba(34,197,94,.12); }
        .pill-fail{ border-color: rgba(248,113,113,.35); background: rgba(248,113,113,.12); }
        .pill-skip{ border-color: rgba(250,204,21,.35); background: rgba(250,204,21,.10); }
        .pill-soft{ opacity: .9; }

        .btn{
          height: 36px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          color: rgba(255,255,255,.90);
          cursor: pointer;
          font-weight: 900;
        }
        .btn:hover{ background: rgba(255,255,255,.09); }
        .btn:disabled{ opacity:.55; cursor:not-allowed; }
      `}</style>
    </div>
  );
}
