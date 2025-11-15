import React from "react";
import lore1 from "../assets/lore-1.jpg";
import lore2 from "../assets/lore-2.jpg";

export default function LoreStrip(){
  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">Värld & stämning</div>
        <div className="grid grid--2" style={{marginTop:8}}>
          <article className="card">
            <img src={lore1} alt="Glödande symbol inristad i metall, subtil och sofistikerad" />
            <div className="card__body">
              <h3 style={{margin:"0 0 6px"}}>Harmonic Star</h3>
              <p>Vår centrala symbol â€” enkel geometri, lugn energi, aldrig överarbetad.</p>
            </div>
          </article>
          <article className="card">
            <img src={lore2} alt="Varmt ljus som reflekteras i textila material" />
            <div className="card__body">
              <h3 style={{margin:"0 0 6px"}}>Material & ljus</h3>
              <p>Vi blandar praktiska texturer med mjuka reflexer â€” vardagsdugligt men drömskt.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
