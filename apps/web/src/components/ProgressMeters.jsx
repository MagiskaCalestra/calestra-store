import React from "react";

export function ProgressBar({ value = 0, label, srOnly = false }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div style={{ marginBottom: 12 }}>
      {!srOnly && (
        <div className="cw-meter-row">
          <span className="cw-meter-label">{label}</span>
          <span className="cw-meter-val">{pct.toFixed(2)}%</span>
        </div>
      )}
      <div className="cw-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
        <div className="cw-meter-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ProgressMeters() {
  // Dummyvärden tills riktiga kopplas in
  return (
    <div className="cw-card">
      <div className="cw-card-pad-lg">
        <div className="cw-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <h3 style={{ marginBottom: 10 }}>Mål</h3>
            <ProgressBar value={100} label="Mål (SEK)" />
            <ProgressBar value={100} label="Totalt" />
            <ProgressBar value={100} label="Butikens andel" />
            <div className="cw-meter-val" style={{ marginTop: 4 }}>1 342 st har stöttat</div>
          </div>

          <aside className="cw-card">
            <div className="cw-card-pad">
              <div className="cw-meter-val" style={{ textTransform: "uppercase", letterSpacing: ".12em" }}>
                Följ resan
              </div>
              <h3 style={{ marginTop: 6 }}>Hjälp oss bygga världen</h3>
              <p className="cw-meter-val" style={{ marginTop: 6 }}>
                Varje köp i butiken driver parken framåt.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <a className="cw-btn cw-btn-acc cw-btn-sm" href="/store" data-affiliate="true">Handla i Store</a>
                <a className="cw-btn cw-btn-ghost cw-btn-sm" href="/support">Stöd projektet</a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
