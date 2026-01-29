// D:\WebProjects\Calestra\apps\admin\src\pages\Content.jsx
import React from "react";
import { CAMPAIGNS, getAutoCampaign } from "../core/campaignShared.js";
import {
  setCampaignOverrideCookie,
  clearCampaignOverrideCookie,
  readCampaignOverrideCookie,
} from "../core/campaignBridge.js";

/** ===== Audit Log (Admin-localStorage) ===== */
const AUDIT_KEY = "cc.auditLog.v1";
function readAudit() {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function pushAudit(entry) {
  try {
    const arr = readAudit();
    arr.unshift(entry);
    // håll loggen rimlig (sen kan vi koppla mot service)
    const trimmed = arr.slice(0, 200);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(trimmed));
  } catch {}
}
function nowISO() {
  return new Date().toISOString();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}
function ymd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function monthLabel(d) {
  return d.toLocaleString("sv-SE", { month: "long", year: "numeric" });
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function startOfGrid(d) {
  // sv: vecka start måndag
  const first = startOfMonth(d);
  const day = (first.getDay() + 6) % 7; // 0=mon
  const x = new Date(first);
  x.setDate(first.getDate() - day);
  return x;
}

export default function Content() {
  const [tab, setTab] = React.useState("campaigns");

  // Manual override (cookie)
  const [override, setOverride] = React.useState(() => readCampaignOverrideCookie() || "");
  const [selected, setSelected] = React.useState(() => {
    const o = readCampaignOverrideCookie() || "";
    return o && o !== "none" ? o : "xmas";
  });

  // Calendar
  const [viewMonth, setViewMonth] = React.useState(() => startOfMonth(new Date()));
  const [rangeStart, setRangeStart] = React.useState(null);
  const [rangeEnd, setRangeEnd] = React.useState(null);

  function applyOverride(id) {
    const v = String(id || "").trim();
    setCampaignOverrideCookie(v);
    setOverride(v);
    setSelected(v && v !== "none" ? v : "xmas");

    pushAudit({
      ts: nowISO(),
      area: "Content",
      action: "campaign.override.apply",
      value: v,
      note: "Wrote override cookie (cross-port).",
    });
  }

  function clearOverride() {
    clearCampaignOverrideCookie();
    setOverride("");

    pushAudit({
      ts: nowISO(),
      area: "Content",
      action: "campaign.override.clear",
      value: "",
      note: "Cleared override cookie.",
    });
  }

  function syncNow() {
    const ck = readCampaignOverrideCookie() || "";
    setOverride(ck);
    if (ck && ck !== "none") setSelected(ck);

    pushAudit({
      ts: nowISO(),
      area: "Content",
      action: "campaign.override.sync",
      value: ck,
      note: "Synced from cookie.",
    });
  }

  // Re-sync cookie if you reload content page etc.
  React.useEffect(() => {
    const t = window.setInterval(() => {
      const ck = readCampaignOverrideCookie() || "";
      setOverride((prev) => (prev !== ck ? ck : prev));
    }, 900);
    return () => window.clearInterval(t);
  }, []);

  // Calendar helpers
  const monthStart = startOfMonth(viewMonth);
  const gridStart = startOfGrid(viewMonth);
  const grid = [];
  const total = 42; // 6 weeks
  for (let i = 0; i < total; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    grid.push(d);
  }

  const isInMonth = (d) => d.getMonth() === monthStart.getMonth();

  const autoFor = (d) => getAutoCampaign(d)?.id || "";
  const autoLabel = (id) => (CAMPAIGNS.find((c) => c.id === id)?.label || id || "—");

  const isSelected = (d) => {
    if (!rangeStart) return false;
    const a = ymd(rangeStart);
    const b = ymd(rangeEnd || rangeStart);
    const x = ymd(d);
    return x >= a && x <= b;
  };

  function clickDay(d) {
    if (!rangeStart) {
      setRangeStart(d);
      setRangeEnd(null);
      return;
    }
    const a = ymd(rangeStart);
    const x = ymd(d);
    if (x < a) {
      setRangeEnd(rangeStart);
      setRangeStart(d);
    } else {
      setRangeEnd(d);
    }
  }

  const activeText = override ? `ACTIVE: ${override}` : "OFF";

  return (
    <div className="cc-wrap">
      <div className="cc-top">
        <div>
          <div className="cc-title">Innehåll</div>
          <div className="cc-sub">
            Kampanjer, kalender (auto + manuellt), och styrning av känslan i Store/Web.
          </div>
        </div>

        <div className="cc-tabs" role="tablist" aria-label="Content tabs">
          <button className={`cc-tab ${tab === "campaigns" ? "on" : ""}`} onClick={() => setTab("campaigns")}>
            Campaigns
          </button>
          <button className={`cc-tab ${tab === "calendar" ? "on" : ""}`} onClick={() => setTab("calendar")}>
            Calendar
          </button>
        </div>
      </div>

      {tab === "campaigns" && (
        <div className="cc-grid">
          <section className="card">
            <div className="card-hd">
              <div>
                <div className="h">Manual Override</div>
                <div className="p">Skriv till cookie så Store (annan port) reagerar.</div>
              </div>
              <span className={`pill ${override ? "on" : ""}`}>{activeText}</span>
            </div>

            <div className="row">
              <label className="lab">Välj kampanj</label>
              <select className="sel" value={selected} onChange={(e) => setSelected(e.target.value)}>
                {CAMPAIGNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.label}
                  </option>
                ))}
                <option value="none">none — ingen kampanj</option>
              </select>
              <div className="tiny">
                Cookie-override gäller över portar på <b>localhost</b>. Store/Web läser detta vid refresh (och i vissa lägen live).
              </div>
            </div>

            <div className="btnrow">
              <button className="btn" onClick={() => applyOverride(selected)}>
                Apply now
              </button>
              <button className="btn ghost" onClick={clearOverride}>
                Clear override
              </button>
              <button className="btn ghost" onClick={syncNow} title="Läs om cookie & uppdatera status">
                Sync now
              </button>
              <button
                className="btn ghost"
                onClick={() => window.open("http://localhost:5175/", "_blank", "noopener,noreferrer")}
                title="Öppna Store (dev)"
              >
                Open Store
              </button>
              <button
                className="btn ghost"
                onClick={() => window.open("http://localhost:5288/", "_blank", "noopener,noreferrer")}
                title="Öppna Portal/Web (dev)"
              >
                Open Web
              </button>
            </div>

            <div className="note">
              Tips: Om du testar <code>localStorage.setItem("cw.campaignOverride", "...")</code> i Admin så påverkar det{" "}
              <b>inte</b> Store (annan port). Cookie-bridgen är korrekt “cross-port”.
            </div>
          </section>

          <section className="card">
            <div className="card-hd">
              <div>
                <div className="h">Auto Preview (idag)</div>
                <div className="p">Så här skulle kampanjmotorn välja utan override.</div>
              </div>
              <span className="pill">{autoFor(new Date()) || "—"}</span>
            </div>

            <div className="auto-box">
              <div className="auto-title">{autoLabel(autoFor(new Date()))}</div>
              <div className="auto-sub">Datum: {ymd(new Date())}</div>
            </div>

            <div className="note">
              Viktigt: Håll er till <b>campaignEngine</b>-ids (t.ex. <b>black-week</b>, <b>valentines</b>, <b>xmas</b>).
            </div>
          </section>
        </div>
      )}

      {tab === "calendar" && (
        <div className="cc-grid">
          <section className="card">
            <div className="card-hd">
              <div>
                <div className="h">Campaign Calendar</div>
                <div className="p">Interaktiv månadsvy. Klicka datum för att markera ett spann (visuell kontroll).</div>
              </div>
              <div className="cal-nav">
                <button className="btn ghost" onClick={() => setViewMonth(addMonths(viewMonth, -1))}>
                  ◀
                </button>
                <div className="cal-month">{monthLabel(viewMonth)}</div>
                <button className="btn ghost" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
                  ▶
                </button>
              </div>
            </div>

            <div className="cal-legend">
              <span className="dot d-xmas" /> xmas
              <span className="dot d-black" /> black-week
              <span className="dot d-val" /> valentines
              <span className="dot d-ram" /> ramadan
              <span className="dot d-eid" /> eid
              <span className="dot d-sum" /> summer
              <span className="dot d-ny" /> newyear
              <span className="dot d-jan" /> jan-refresh
            </div>

            <div className="cal-grid">
              {["M", "T", "O", "T", "F", "L", "S"].map((x) => (
                <div key={x} className="cal-h">
                  {x}
                </div>
              ))}

              {grid.map((d) => {
                const id = autoFor(d);
                const muted = !isInMonth(d);
                return (
                  <button
                    key={ymd(d)}
                    className={`day ${muted ? "muted" : ""} ${isSelected(d) ? "sel" : ""}`}
                    onClick={() => clickDay(d)}
                    title={`${ymd(d)} — auto: ${id || "—"}`}
                    type="button"
                  >
                    <div className="num">{d.getDate()}</div>
                    <div className={`badge ${id ? `b-${id}` : ""}`}>{id || "—"}</div>
                  </button>
                );
              })}
            </div>

            <div className="note">
              Markering (span): <b>{rangeStart ? ymd(rangeStart) : "—"}</b> →{" "}
              <b>{rangeEnd ? ymd(rangeEnd) : rangeStart ? ymd(rangeStart) : "—"}</b>
              <span style={{ opacity: 0.8 }}> (v1 visar/validerar – nästa steg kopplar vi “schema → auto”.)</span>
            </div>
          </section>

          <section className="card">
            <div className="card-hd">
              <div>
                <div className="h">Quick Controls</div>
                <div className="p">När du vill känna att systemet lever: tryck och se Store skifta.</div>
              </div>
              <span className={`pill ${override ? "on" : ""}`}>{activeText}</span>
            </div>

            <div className="btnrow">
              <button className="btn" onClick={() => applyOverride("xmas")}>
                Force xmas
              </button>
              <button className="btn" onClick={() => applyOverride("black-week")}>
                Force black-week
              </button>
              <button className="btn" onClick={() => applyOverride("valentines")}>
                Force valentines
              </button>
              <button className="btn ghost" onClick={clearOverride}>
                Force OFF
              </button>
              <button className="btn ghost" onClick={syncNow}>
                Sync now
              </button>
            </div>

            <div className="note">
              Du får exakt den känslan du vill ha: “jag ser i kalendern vad som aktiveras” + “jag kan styra manuellt”.
            </div>
          </section>
        </div>
      )}

      <style>{`
        .cc-wrap{ padding: 18px; }
        .cc-top{ display:flex; justify-content:space-between; align-items:flex-end; gap:14px; margin-bottom:14px; }
        .cc-title{ font-size:18px; font-weight:900; letter-spacing:.02em; }
        .cc-sub{ opacity:.8; margin-top:4px; max-width:740px; }
        .cc-tabs{ display:flex; gap:10px; }
        .cc-tab{
          border:1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.04);
          color:#e6e7ea;
          padding:10px 12px;
          border-radius: 999px;
          font-weight:900;
          cursor:pointer;
        }
        .cc-tab.on{ background: rgba(59,130,246,.18); border-color: rgba(59,130,246,.35); }

        .cc-grid{ display:grid; grid-template-columns: 1.2fr .8fr; gap:14px; }
        @media(max-width: 1100px){ .cc-grid{ grid-template-columns:1fr; } }

        .card{
          border:1px solid rgba(255,255,255,.10);
          background: rgba(0,0,0,.12);
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 18px 50px rgba(0,0,0,.35);
        }
        .card-hd{ display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:12px; }
        .h{ font-weight:900; font-size:14px; }
        .p{ opacity:.8; margin-top:4px; font-size:12px; max-width:620px; }
        .pill{
          padding:6px 10px; border-radius:999px;
          border:1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          font-weight:900; font-size:12px;
          white-space:nowrap;
        }
        .pill.on{ background: rgba(34,197,94,.12); border-color: rgba(34,197,94,.30); }

        .row{ display:flex; flex-direction:column; gap:6px; margin-top:8px; }
        .lab{ font-size:12px; font-weight:900; opacity:.85; }
        .sel{
          height:40px; border-radius:12px;
          border:1px solid rgba(255,255,255,.12);
          background: rgba(0,0,0,.20);
          color:#e6e7ea;
          padding: 0 10px;
          font-weight:800;
          outline: none;
        }

        /* Scrollbar-contrast (Chromium/Edge) */
        .sel::-webkit-scrollbar{ width: 12px; }
        .sel::-webkit-scrollbar-track{ background: rgba(255,255,255,.06); border-radius: 999px; }
        .sel::-webkit-scrollbar-thumb{
          background: rgba(255,255,255,.22);
          border: 3px solid rgba(0,0,0,.18);
          border-radius: 999px;
        }
        .sel::-webkit-scrollbar-thumb:hover{ background: rgba(255,255,255,.30); }

        .btnrow{ display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; }
        .btn{
          height:38px; padding:0 12px; border-radius:12px;
          border:1px solid rgba(255,255,255,.12);
          background: rgba(59,130,246,.18);
          color:#e6e7ea;
          font-weight:900;
          cursor:pointer;
        }
        .btn.ghost{ background: rgba(255,255,255,.06); }
        .btn:hover{ filter: brightness(1.08); }

        .note{ opacity:.82; font-size:12px; margin-top:12px; line-height:1.35; }
        .tiny{ opacity:.78; font-size:12px; margin-top:6px; line-height:1.35; }

        .auto-box{
          border:1px solid rgba(255,255,255,.10);
          border-radius:14px;
          padding:12px;
          background: rgba(255,255,255,.03);
        }
        .auto-title{ font-weight:900; }
        .auto-sub{ opacity:.8; font-size:12px; margin-top:4px; }

        .cal-nav{ display:flex; align-items:center; gap:10px; }
        .cal-month{ font-weight:900; opacity:.95; text-transform:capitalize; }

        .cal-legend{ display:flex; flex-wrap:wrap; gap:10px; font-size:12px; opacity:.85; margin: 6px 0 10px; }
        .dot{ width:10px; height:10px; border-radius:999px; display:inline-block; margin-right:6px; vertical-align:middle; }
        .d-xmas{ background: rgba(34,197,94,.85); }
        .d-black{ background: rgba(148,163,184,.85); }
        .d-val{ background: rgba(244,63,94,.85); }
        .d-ram{ background: rgba(56,189,248,.85); }
        .d-eid{ background: rgba(250,204,21,.85); }
        .d-sum{ background: rgba(34,211,238,.85); }
        .d-ny{ background: rgba(245,158,11,.85); }
        .d-jan{ background: rgba(167,139,250,.85); }

        .cal-grid{
          display:grid;
          grid-template-columns: repeat(7, 1fr);
          gap:8px;
        }
        .cal-h{ opacity:.7; font-weight:900; font-size:12px; padding: 0 2px; }
        .day{
          height:64px;
          border-radius:14px;
          border:1px solid rgba(255,255,255,.10);
          background: rgba(0,0,0,.16);
          color:#e6e7ea;
          cursor:pointer;
          display:flex;
          flex-direction:column;
          align-items:flex-start;
          justify-content:space-between;
          padding:8px;
        }
        .day:hover{ background: rgba(255,255,255,.06); }
        .day.muted{ opacity:.45; }
        .day.sel{ outline: 2px solid rgba(59,130,246,.45); }

        .num{ font-weight:900; }
        .badge{
          font-size:11px;
          font-weight:900;
          padding:3px 8px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.06);
          max-width:100%;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .b-xmas{ background: rgba(34,197,94,.14); border-color: rgba(34,197,94,.35); }
        .b-black-week{ background: rgba(148,163,184,.12); border-color: rgba(148,163,184,.30); }
        .b-valentines{ background: rgba(244,63,94,.14); border-color: rgba(244,63,94,.35); }
        .b-ramadan{ background: rgba(56,189,248,.14); border-color: rgba(56,189,248,.35); }
        .b-eid{ background: rgba(250,204,21,.14); border-color: rgba(250,204,21,.35); }
        .b-summer{ background: rgba(34,211,238,.14); border-color: rgba(34,211,238,.35); }
        .b-newyear{ background: rgba(245,158,11,.14); border-color: rgba(245,158,11,.35); }
        .b-jan-refresh{ background: rgba(167,139,250,.14); border-color: rgba(167,139,250,.35); }
      `}</style>
    </div>
  );
}
