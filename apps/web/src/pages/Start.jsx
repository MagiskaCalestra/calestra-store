// apps/web/src/pages/booking/Start.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * Boknings-wizard (steg 0). Vi börjar enkelt: val av kategori.
 * Nästa steg blir /booking/tickets, /booking/dining, /booking/hotel
 * med datum -> kapacitet -> tillägg -> betalning.
 */
export default function BookingStart() {
  return (
    <section className="page booking">
      <div className="wrap">
        <h1>Boka</h1>
        <p>Välj vad du vill boka. Därefter guidar vi dig steg för steg.</p>

        <div className="grid">
          <Link to="/tickets" className="card">Biljetter</Link>
          <Link to="/dining" className="card">Restaurang</Link>
          <Link to="/hotels" className="card">Hotell</Link>
        </div>

        <p className="note">(* Den fulla bokningsmotorn kopplas på när C-Core Booking aktiveras.)</p>
      </div>

      <style>{`
        .wrap{max-width:900px;margin:0 auto;padding:28px 16px;color:#e8ecff}
        .grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-top:16px}
        .card{border:1px solid #2b315e;border-radius:12px;padding:14px;background:#0f1430;text-align:center}
        .card:hover{background:#151b42}
        .note{opacity:.8;margin-top:10px}
      `}</style>
    </section>
  );
}
