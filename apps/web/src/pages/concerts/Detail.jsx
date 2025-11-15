// apps/web/src/pages/concerts/Detail.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { CCoreSDK } from "../../core/ccore";

export default function ConcertDetail() {
  const { id } = useParams();
  const c = CCoreSDK.Events.getConcert(id);
  const v = c ? CCoreSDK.Events.getVenue(c.venueId) : null;

  if (!c) {
    return (
      <section className="page">
        <div className="wrap">
          <h1>Konsert saknas</h1>
          <Link to="/concerts" className="btn">Tillbaka</Link>
        </div>
      </section>
    );
  }

  const avail = CCoreSDK.Events.availabilityMock(c.id);

  return (
    <section className="page">
      <div className="wrap">
        <Link to="/concerts" className="btn ghost">â† Till konserter</Link>
        <h1>{c.title}</h1>
        <p className="lead">{c.artist || "â€”"}</p>

        <div className="meta">
          <span className={"badge "+avail.status}>{avail.status.toUpperCase()}</span>
          <span className="pill">{c.date} â€¢ {c.time} â€¢ {c.durationMin} min</span>
          {v && <span className="pill">Scen: {v.name}</span>}
          <span className="pill">{policyText(c.policy)}</span>
        </div>

        <h3>Prismodell</h3>
        {c.prices.length === 0 ? (
          <div className="empty">Styrelsen avgör prismodell och tillval.</div>
        ) : (
          <ul className="prices">
            {c.prices.map(p => (
              <li key={p.kind}><strong>{label(p.kind)}</strong>: {p.amount>0?`${p.amount} ${p.currency}`:"Ingår"}</li>
            ))}
          </ul>
        )}

        <div className="row">
          <Link to="/booking" className="btn">Boka/Reservera</Link>
          {c.policy.diningPackageEnabled && <Link to="/booking/dining" className="btn ghost">Dining-paket</Link>}
        </div>
      </div>

      <style>{`
        .wrap { max-width:900px; margin:0 auto; padding:24px 16px; color:#e8ecff; }
        .btn { padding:8px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; text-decoration:none; }
        .btn.ghost { background:transparent; }
        .lead { opacity:.95; margin-bottom:12px; }
        .meta { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; align-items:center; }
        .badge { padding:2px 8px; border-radius:999px; border:1px solid #2b315e; font-size:.8rem; }
        .badge.green { background:#0e1f18; color:#9ae6b4; border-color:#1d4d3b; }
        .badge.yellow{ background:#2a2610; color:#ffe28a; border-color:#6a5a18; }
        .badge.red   { background:#2a1410; color:#ffb0a1; border-color:#6a2a18; }
        .pill { padding:2px 8px; border-radius:999px; border:1px solid #2b315e; font-size:.85rem; }
        .prices { list-style:none; padding:0; margin:0 0 10px; display:flex; flex-direction:column; gap:4px; }
        .empty { border:1px solid #2b315e; border-radius:10px; background:#0b0f25; padding:10px; }
        .row { display:flex; gap:10px; }
      `}</style>
    </section>
  );
}

function label(kind){
  return { included:"Ingår i park", night:"Kvällsbiljett", dining:"Dining + reserverad zon" }[kind] || kind;
}
function policyText(p){
  const m = { undecided:"Läge: ej beslutat", included:"Läge: ingår i park", night_ticket:"Läge: kvällsbiljett", both:"Läge: både och" }[p.mode];
  const a = { none:"Alkoholfritt", zoned:"Zonad servering", limited:"Begränsad servering" }[p.alcoholPolicy];
  return `${m} â€¢ ${a}`;
}
