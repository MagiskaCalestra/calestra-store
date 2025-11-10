import React from "react";
import { useAuth } from "../core/AuthContext";

/**
 * Visar personlig hälsning ENDAST om:
 * - user finns OCH consent.personalization === true
 * Annars visas neutral CTA.
 */
export default function WelcomeCard() {
  const { user, consent } = useAuth();

  const canPersonalize = !!user && consent?.personalization === true;
  const name = canPersonalize ? user.displayName : null;

  return (
    <div className="wel-card">
      {canPersonalize ? (
        <>
          <h2>Välkommen tillbaka, {name}!</h2>
          <p>Din nästa parkresa börjar om 9 dagar. Vill du fortsätta där du slutade?</p>
          <div className="row">
            <a href="/booking" className="btn">Visa alternativ</a>
          </div>
        </>
      ) : (
        <>
          <h2>Välkommen</h2>
          <p>Planera din parkresa och lås upp ett magiskt besök.</p>
          <div className="row">
            <a href="/booking" className="btn">Boka</a>
          </div>
        </>
      )}

      <style>{`
        .wel-card { margin: 24px auto 0; max-width: 720px; padding: 16px; 
          border: 1px solid #2b315e; border-radius: 14px; background:#0f1430; color:#e8ecff; }
        .row { margin-top: 10px; }
        .btn { padding:8px 12px; border-radius:10px; background:#1a2a80; border:1px solid #2c3aa0; color:#fff; }
        .btn:hover { filter:brightness(1.05); }
      `}</style>
    </div>
  );
}
