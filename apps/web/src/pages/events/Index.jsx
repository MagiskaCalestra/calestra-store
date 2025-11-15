// apps/web/src/pages/events/Index.jsx
import React from "react";

export default function EventsIndex() {
  return (
    <section className="page events">
      <div className="wrap">
        <h1>Evenemang</h1>
        <p className="lead">Säsongsöppningar, kvällsarrangemang och specialteman. (Prototyp)</p>
        <ul className="list">
          <li>
            <div className="title">Stjärnnatt i Realms Gate</div>
            <div className="desc">Exklusiv afton med förlängda tider och specialmeny.</div>
          </li>
          <li>
            <div className="title">Crystal Hall â€“ Ljusfestival</div>
            <div className="desc">Ljusinstallationer och musik, begränsade platser.</div>
          </li>
        </ul>
      </div>
      <style>{`
        .wrap { max-width:900px; margin:0 auto; padding:24px 16px; color:#e8ecff; }
        .lead { opacity:.9; margin-bottom:14px; }
        .list { display:flex; flex-direction:column; gap:12px; }
        .title { font-weight:600; }
        .desc { opacity:.95; }
      `}</style>
    </section>
  );
}
