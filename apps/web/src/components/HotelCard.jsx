import React from "react";
export default function HotelCard({ h, onPick }){
  return (
    <article className="hotel-card">
      <header>
        <h3>{h.name}</h3>
        <span className="muted">{h.zone} Â· â˜…{h.rating} Â· {h.pricePerNight} kr/natt</span>
      </header>
      <p className="muted">Fördelar: {h.perks.join(" Â· ")}</p>
      <p className="muted">Bekvämligheter: {h.amenities.join(", ")}</p>
      <button className="btn solid" onClick={()=> onPick(h)}>Välj</button>
    </article>
  );
}
