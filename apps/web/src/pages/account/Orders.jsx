import React, { useMemo, useState } from "react";
import { CCoreSDK } from "../../core/ccore";

function currency(n) { return new Intl.NumberFormat("sv-SE").format(n); }
function fmt(dt) {
  try { return new Date(dt).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return dt; }
}

export default function AccountOrders() {
  const all = useMemo(() => CCoreSDK.Booking.getAllOrders() || [], []);
  const [activeId, setActiveId] = useState(all[0]?.id || null);
  const active = all.find(o => o.id === activeId) || null;

  return (
    <section className="page account orders">
      <div className="wrap">
        <h1>Mina beställningar</h1>
        <p className="lead">Här ser du dina senaste mock-beställningar från bokningsflödet.</p>

        {all.length === 0 ? (
          <div className="empty">Du har inga beställningar ännu.</div>
        ) : (
          <div className="layout">
            <aside className="list">
              <ul>
                {all.map(o => (
                  <li key={o.id}>
                    <button
                      className={"row" + (o.id === activeId ? " active" : "")}
                      onClick={() => setActiveId(o.id)}
                    >
                      <div className="id">{o.id}</div>
                      <div className="meta">
                        <span>{fmt(o.createdAt)}</span>
                        <span className={"st " + o.status.toLowerCase()}>{o.status}</span>
                        <span>{currency(o.amount)} {o.currency}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <main className="detail">
              {!active ? (
                <div className="empty">Välj en order i listan.</div>
              ) : (
                <div className="card">
                  <h2>Order {active.id}</h2>
                  <p><strong>Skapad:</strong> {fmt(active.createdAt)}</p>
                  <p><strong>Status:</strong> {active.status}</p>
                  <p><strong>Belopp:</strong> {currency(active.amount)} {active.currency}</p>

                  {active.contact && (
                    <>
                      <h3>Kontakt</h3>
                      <p><strong>Namn:</strong> {active.contact.name || "—"}</p>
                      <p><strong>E-post:</strong> {active.contact.email || "—"}</p>
                      <p><strong>Telefon:</strong> {active.contact.phone || "—"}</p>
                    </>
                  )}

                  <p className="hint">Detta är en prototyp. I produktion hämtas ordrar från C-Core.</p>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      <style>{`
        .wrap { max-width:1100px; margin:0 auto; padding:24px 16px; color:#e8ecff; }
        .lead { opacity:.9; margin-bottom:14px; }
        .empty { border:1px solid #2b315e; background:#0f1430; padding:14px; border-radius:12px; }

        .layout { display:grid; grid-template-columns: .9fr 1.1fr; gap:18px; }
        @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } }

        .list { border:1px solid #2b315e; border-radius:14px; background:#0f1430; overflow:hidden; }
        .list ul { list-style:none; margin:0; padding:0; }
        .row { width:100%; text-align:left; padding:10px 12px; background:#0b0f25; border:0; border-bottom:1px solid #2b315e; color:#e8ecff; cursor:pointer; }
        .row:hover { background:#121735; }
        .row.active { background:#161a30; }
        .id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.9rem; }
        .meta { display:flex; gap:10px; justify-content:space-between; opacity:.95; font-size:.9rem; }
        .st { padding:2px 8px; border-radius:999px; border:1px solid #2b315e; }
        .st.paid { background:#0e1f18; color:#9ae6b4; border-color:#1d4d3b; }

        .detail .card { border:1px solid #2b315e; border-radius:14px; background:#0f1430; padding:14px; }
        .hint { opacity:.85; margin-top:12px; }
      `}</style>
    </section>
  );
}
