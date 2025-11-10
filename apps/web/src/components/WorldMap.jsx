import React from "react";
import world from "../assets/world-map.jpg";

export default function WorldMap(){
  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">Resan</div>
        <h2 style={{margin:"6px 0 10px", fontWeight:900}}>Global närvaro, enkla steg</h2>
        <p className="lead">Vi bygger tillsammans. Kartan visar vår tänkta expansion i vågor.</p>
        <div className="card" style={{marginTop:12}}>
          <img src={world} alt="Världskarta med subtila ljusglödande noder" />
        </div>
      </div>
    </section>
  );
}
