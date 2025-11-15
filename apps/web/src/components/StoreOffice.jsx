// apps/web/src/components/StoreOffice.jsx
import React from "react";

export default function StoreOffice() {
  return (
    <section className="so">
      <div className="wrap">
        <div className="card">
          <div className="text">
            <h2>Calestra Store OfficeÂ®</h2>
            <p>DIV muggar â€¢ Interaktiv docka â€¢ Signatur-kollektion m.m.</p>
            <a className="btn" href="http://localhost:5175/" target="_blank" rel="noopener noreferrer">DIY-mall  â†—</a>
          </div>
          <div className="merch" aria-hidden />
        </div>
      </div>

      <style>{`
        .so { padding: 12px 16px 28px; background: #080a18; }
        .wrap { max-width:1100px; margin:0 auto; }
        .card { display:grid; grid-template-columns: 1fr 1fr; gap:12px; border:1px solid #2b315e; border-radius:16px; background:#0f1430; color:#e8ecff; padding:14px; }
        .text h2 { margin:0 0 6px; }
        .text p { margin:0 0 10px; opacity:.95; }
        .btn { display:inline-block; padding:8px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; text-decoration:none; }
        .merch { min-height:160px; border-radius:12px; background:
          radial-gradient(closest-side, rgba(189,160,255,.24), rgba(189,160,255,.06) 40%, transparent 70%),
          linear-gradient(180deg,#10143a,#0f1430);
          box-shadow: inset 0 0 0 1px #2b315e; }
        @media (max-width: 880px) { .card { grid-template-columns: 1fr; } .merch { min-height: 120px; } }
      `}</style>
    </section>
  );
}
