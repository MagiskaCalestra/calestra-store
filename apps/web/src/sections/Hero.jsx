import React from "react";

export default function Hero(){
  return (
    <section className="cw-hero">
      <div className="cw-hero__bg" aria-hidden />
      <div className="cw-hero__vignette" aria-hidden />
      <div className="cw-hero__content container">
        <h1>
          <span className="kicker">Somewhere…</span>
          <span className="title">it waits for you</span>
        </h1>

        <div className="quick">
          <button className="btn">✨ Boka ditt magiska paket</button>
          <button className="btn">📸 Calestra Store</button>
          <button className="btn">🎵 Musik & konserter</button>
          <button className="btn">📖 Våra berättelser</button>
          <button className="btn">🗺️ Världar</button>
        </div>

        <div className="booking">
          <input className="field" placeholder="Datum" />
          <input className="field" defaultValue="2" aria-label="Vuxna" />
          <input className="field" defaultValue="0" aria-label="Barn" />
          <select className="field" aria-label="Nätter">
            <option>2</option><option>3</option><option>4</option>
          </select>
          <button className="btn primary">Utforska ditt ljus</button>
        </div>
      </div>
    </section>
  );
}
