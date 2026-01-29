// D:\WebProjects\Calestra\apps\admin\src\pages\HR.jsx
import React from "react";
import { getFinanceSummary } from "../core/finance/financeClient.js";
import { defaultHR, readHR, writeHR, fmtSEK, computeHiringReadiness } from "../core/hrModel.js";

function Field({ label, value, onChange, suffix }) {
  return (
    <div className="field">
      <div className="lab">{label}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          className="inp"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
        />
        {suffix ? <div style={{ fontWeight: 900, opacity: 0.85 }}>{suffix}</div> : null}
      </div>
    </div>
  );
}

export default function HR() {
  const [hr, setHR] = React.useState(() => readHR());
  const [finDay, setFinDay] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  // persist
  React.useEffect(() => {
    writeHR(hr);
  }, [hr]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const day = await getFinanceSummary({ mode: "test", range: "day" });
      setFinDay(day);
    } catch (e) {
      setErr(String(e?.message || e));
      setFinDay(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    const t = window.setInterval(load, 20000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computed = React.useMemo(() => computeHiringReadiness(hr, finDay), [hr, finDay]);

  const pill =
    computed.ready ? "admin-pill-green" : computed.progress01 >= 0.7 ? "admin-pill-amber" : "admin-pill-red";
  const pillText = computed.ready ? "Redo" : computed.progress01 >= 0.7 ? "Nära" : "Inte ännu";

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2>HR</h2>
          <p>
            Enkel HR-kontroll för v1: din lön, första anställningen och en tydlig indikator på när{" "}
            <b>butikens netto</b> klarar att bära personal.
          </p>
        </div>
        <div className="admin-section-tag">
          <span className="admin-section-tag-dot" />
          <span>HR v1</span>
        </div>
      </div>

      <div className="hr-grid">
        <section className="card">
          <div className="card-hd">
            <div>
              <div className="h">Lön & kostnader</div>
              <div className="p">Ställ in dina basnivåer. Detta påverkar bara Admin-beräkningar (inte bokföring).</div>
            </div>
            <span className="pill soft">localStorage</span>
          </div>

          <div className="form grid2">
            <Field
              label="Din lön (månad)"
              value={hr.ownerSalaryMonthly}
              onChange={(v) => setHR((x) => ({ ...x, ownerSalaryMonthly: Number(v) }))}
              suffix="kr"
            />
            <Field
              label="Kostnad första person (månad, “all-in”)"
              value={hr.firstHireAllInMonthly}
              onChange={(v) => setHR((x) => ({ ...x, firstHireAllInMonthly: Number(v) }))}
              suffix="kr"
            />

            <Field
              label="Säkerhetsbuffer (%)"
              value={hr.safetyBufferPct}
              onChange={(v) => setHR((x) => ({ ...x, safetyBufferPct: Number(v) }))}
              suffix="%"
            />
            <Field
              label="Dagar per månad (proj.)"
              value={hr.daysPerMonth}
              onChange={(v) => setHR((x) => ({ ...x, daysPerMonth: Number(v) }))}
              suffix="d"
            />
          </div>

          <div className="btnrow">
            <button
              className="btn ghost"
              type="button"
              onClick={() => setHR(defaultHR())}
            >
              Reset HR demo
            </button>
            <button className="btn" type="button" onClick={load}>
              Uppdatera Finance
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-hd">
            <div>
              <div className="h">Omsättningsmål (v1)</div>
              <div className="p">Golvet och huvudmålet du nämnde (200k / 250k). Bra som “styrning”.</div>
            </div>
            <span className="pill soft">plan</span>
          </div>

          <div className="form">
            <Field
              label="Golv (omsättning / månad)"
              value={hr.revenueFloorMonthly}
              onChange={(v) => setHR((x) => ({ ...x, revenueFloorMonthly: Number(v) }))}
              suffix="kr"
            />
            <Field
              label="Huvudmål (omsättning / månad)"
              value={hr.revenueMainMonthly}
              onChange={(v) => setHR((x) => ({ ...x, revenueMainMonthly: Number(v) }))}
              suffix="kr"
            />
            <div className="note">
              Med 30 dagar blir golv/dag ≈ <b>{fmtSEK((Number(hr.revenueFloorMonthly || 0) / Number(hr.daysPerMonth || 30)) || 0)}</b>{" "}
              och mål/dag ≈ <b>{fmtSEK((Number(hr.revenueMainMonthly || 0) / Number(hr.daysPerMonth || 30)) || 0)}</b>.
            </div>
          </div>
        </section>

        <section className="card wide">
          <div className="card-hd">
            <div>
              <div className="h">Hiring meter</div>
              <div className="p">Enkel v1-logik: “klarar vi första personen?” baserat på finance-service net.</div>
            </div>
            <span className={`pill ${pill}`}>{pillText}</span>
          </div>

          {loading && <div style={{ opacity: 0.85, fontWeight: 800 }}>Hämtar finance-service…</div>}

          {err && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.10)",
                background: "rgba(255,0,0,.08)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Kunde inte läsa finance-service</div>
              <div style={{ opacity: 0.9, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{err}</div>
              <div style={{ opacity: 0.75, marginTop: 8 }}>
                Kontrollera att <b>finance-service</b> kör på port <b>14010</b>.
              </div>
            </div>
          )}

          {!loading && !err && (
            <div className="hr-meter-grid">
              <div className="hr-meter-card">
                <div className="k">Netto idag (TEST)</div>
                <div className="v">{fmtSEK(computed.netToday)}</div>
                <div className="s">Kommer från finance-service summary.</div>

                <div className="meter" style={{ marginTop: 10 }}>
                  <div className="meter-bar">
                    <div className="meter-fill" style={{ width: `${Math.round(computed.progress01 * 100)}%` }} />
                  </div>
                  <div className="meter-note">
                    Proj. netto/mån: <b>{fmtSEK(computed.netMonthlyProjected)}</b> · Behov (hire+buffer):{" "}
                    <b>{fmtSEK(computed.needMonthly)}</b>
                  </div>
                </div>
              </div>

              <div className="hr-meter-card">
                <div className="k">Din lön (baseline)</div>
                <div className="v">{fmtSEK(hr.ownerSalaryMonthly)}</div>
                <div className="s">Kan vara 38 000 kr nu, ändra när du vill.</div>
              </div>

              <div className="hr-meter-card">
                <div className="k">Första person (all-in)</div>
                <div className="v">{fmtSEK(hr.firstHireAllInMonthly)}</div>
                <div className="s">
                  Buffer: {Number(hr.safetyBufferPct || 0)}% · Behov: <b>{fmtSEK(computed.needMonthly)}</b>
                </div>
              </div>

              <div className="hr-meter-card">
                <div className="k">Tidsindikator</div>
                <div className="v">
                  {Number.isFinite(computed.daysToReady) ? `${computed.daysToReady} dagar` : "∞"}
                </div>
                <div className="s">
                  Om netto/dag håller samma nivå. (V1: enkel, men användbar för tempo.)
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .hr-grid{ display:grid; grid-template-columns: 1fr 1fr; gap:14px; }
        .wide{ grid-column: 1 / -1; }
        @media(max-width: 1100px){ .hr-grid{ grid-template-columns:1fr; } .wide{ grid-column:auto; } }

        .card{
          border:1px solid rgba(255,255,255,.10);
          background: rgba(0,0,0,.12);
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 18px 50px rgba(0,0,0,.25);
        }
        .card-hd{ display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:12px; }
        .h{ font-weight:900; font-size:14px; }
        .p{ opacity:.8; margin-top:4px; font-size:12px; max-width:720px; }

        .pill{
          padding:6px 10px; border-radius:999px;
          border:1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          font-weight:900; font-size:12px;
          white-space:nowrap;
        }
        .pill.soft{ background: rgba(255,255,255,.04); }
        .pill.admin-pill-green{ background: rgba(34,197,94,.12); border-color: rgba(34,197,94,.30); }
        .pill.admin-pill-amber{ background: rgba(250,204,21,.10); border-color: rgba(250,204,21,.25); }
        .pill.admin-pill-red{ background: rgba(244,63,94,.10); border-color: rgba(244,63,94,.30); }

        .form{ display:flex; flex-direction:column; gap:10px; }
        .grid2{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
        @media(max-width: 1100px){ .grid2{ grid-template-columns:1fr; } }

        .field{ display:flex; flex-direction:column; gap:6px; }
        .lab{ font-size:12px; font-weight:900; opacity:.85; }
        .inp{
          flex: 1 1 auto;
          height:40px; border-radius:12px;
          border:1px solid rgba(255,255,255,.12);
          background: rgba(0,0,0,.18);
          color:#e6e7ea;
          padding: 0 12px;
          font-weight:800;
          outline: none;
        }

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

        .note{ opacity:.82; font-size:12px; margin-top:10px; line-height:1.35; }

        .hr-meter-grid{
          display:grid;
          grid-template-columns: 1.2fr .8fr .8fr .8fr;
          gap: 12px;
          margin-top: 10px;
        }
        @media(max-width: 1100px){
          .hr-meter-grid{ grid-template-columns: 1fr; }
        }
        .hr-meter-card{
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(0,0,0,.12);
          border-radius: 16px;
          padding: 12px;
          box-shadow: 0 18px 50px rgba(0,0,0,.20);
        }
        .k{ opacity:.78; font-size:12px; font-weight:900; }
        .v{ font-size:22px; font-weight:1000; margin-top:6px; letter-spacing:.01em; }
        .s{ opacity:.82; font-size:12px; margin-top:6px; font-weight:800; line-height:1.35; }

        .meter-bar{
          height:10px; border-radius:999px;
          background: rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.10);
          overflow:hidden;
        }
        .meter-fill{
          height:100%;
          border-radius:999px;
          background: rgba(59,130,246,.45);
          width: 0%;
        }
        .meter-note{ opacity:.82; font-size:12px; margin-top:8px; }
      `}</style>
    </div>
  );
}
