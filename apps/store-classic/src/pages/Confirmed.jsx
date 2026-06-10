import React from "react";
import { Link } from "react-router-dom";

export default function Confirmed() {
  return (
    <div className="page">
      <div className="card">
        <div className="badge">Nyhetsbrev</div>

        <h1 className="title">Tack — du är bekräftad ✅</h1>

        <p className="text">
          Din prenumeration är nu aktiv. Du kommer få Magiska Nyheter när nya drops släpps,
          Surprise Boxes öppnas, och när Calestra tar nästa steg.
        </p>

        <div className="actions">
          <Link className="btn primary" to="/shop">
            Till butiken
          </Link>
          <Link className="btn" to="/">
            Till startsidan
          </Link>
        </div>

        <div className="note">
          Om du inte begärde detta kan du ignorera mailet – eller avregistrera när som helst via en länk i
          utskicken.
        </div>
      </div>

      {/* Minimal inline styling så den matchar din “rena” premium-look utan att krångla med CSS-filer */}
      <style>{`
        .page{
          min-height: calc(100vh - 220px);
          display:flex;
          align-items:flex-start;
          justify-content:center;
          padding: 48px 16px;
        }
        .card{
          width: min(820px, 100%);
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 18px;
          padding: 28px 26px;
          box-shadow: 0 18px 60px rgba(0,0,0,0.08);
        }
        .badge{
          display:inline-flex;
          align-items:center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .04em;
          text-transform: uppercase;
          opacity: .8;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.10);
          width: fit-content;
          margin-bottom: 12px;
        }
        .title{
          font-size: 44px;
          line-height: 1.05;
          margin: 8px 0 12px;
        }
        .text{
          font-size: 16px;
          line-height: 1.6;
          opacity: .85;
          margin: 0 0 18px;
        }
        .actions{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          margin: 10px 0 10px;
        }
        .btn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.16);
          text-decoration:none;
          font-weight: 700;
          color: inherit;
          background: rgba(255,255,255,0.6);
          transition: transform .06s ease, box-shadow .12s ease;
        }
        .btn:hover{ transform: translateY(-1px); box-shadow: 0 10px 30px rgba(0,0,0,0.10); }
        .btn.primary{
          background: rgba(0,0,0,0.92);
          color: white;
          border-color: rgba(0,0,0,0.92);
        }
        .note{
          margin-top: 14px;
          font-size: 12px;
          opacity: .65;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}