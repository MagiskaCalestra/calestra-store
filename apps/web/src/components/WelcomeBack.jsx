// apps/web/src/components/WelcomeBack.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../core/AuthContext";

export default function WelcomeBack() {
  const { user } = useAuth() || {};
  const nav = useNavigate();

  // Demo: om ej inloggad â€“ visa en mjuk, anonym variant (så layouten känns komplett)
  const title = user?.firstName ? `Välkommen tillbaka, ${user.firstName}!` : "Välkommen tillbaka!";
  const body  = user?.firstName
    ? "Din nästa parkresa börjar snart â€“ vill du fortsätta där du slutade?"
    : "Fortsätt din resa när du vill. Logga in för att hitta bokningar & minnen.";

  return (
    <section className="wb">
      <div className="wrap">
        <div className="card">
          <div className="text">
            <h2 className="display">{title}</h2>
            <p>{body}</p>
            <div className="actions">
              <button className="btn" onClick={()=>nav("/booking")}>Visa alternativ</button>
              <Link className="btn ghost" to="/account/orders">Mina bokningar</Link>
            </div>
          </div>
          <div className="viz" aria-hidden />
        </div>
      </div>

      <style>{`
        .wb { padding: 18px 16px 6px; background: #0b0f1c; }
        .wrap { max-width: 1100px; margin: 0 auto; }
        .card { display:grid; grid-template-columns: 1.2fr .8fr; gap:12px; border:1px solid #2b315e; border-radius:16px; background:linear-gradient(180deg,#0f1430,#0d1230); color:#e8ecff; padding:14px; }
        .text h2 { margin:0 0 6px; }
        .text p { margin:0 0 10px; opacity:.95; }
        .viz { min-height: 160px; border-radius:12px; background:
          radial-gradient(closest-side, rgba(149,168,255,.25), rgba(149,168,255,.08) 40%, transparent 70%),
          linear-gradient(180deg,#10163a,#0d1230);
          box-shadow: inset 0 0 0 1px #2b315e; }
        .actions { display:flex; gap:10px; flex-wrap:wrap; }
        .btn { padding:10px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; cursor:pointer; }
        .btn.ghost { background:transparent; text-decoration:none; display:inline-flex; align-items:center; }
        @media (max-width: 880px) { .card { grid-template-columns: 1fr; } .viz { min-height: 120px; } }
      `}</style>
    </section>
  );
}
