import React from "react";
import { Link } from "react-router-dom";

export default function StorePromoCard() {
  return (
    <div className="card store-promo">
      <div className="store-copy">
        <h3>Ta med en bit av världen</h3>
        <p className="muted">Välj ett minne som bär din känsla.</p>
        <Link className="btn outline" to="/tickets">Öppna Store Office</Link>
      </div>
      <div className="store-visual">
        <img src="/assets/lyra-and-the-lights.png" alt="Lyra" onError={(e)=>{e.currentTarget.style.display='none'}} />
        <img src="/assets/castle-sky.png" alt="Merch" onError={(e)=>{e.currentTarget.style.display='none'}} />
      </div>
    </div>
  );
}
