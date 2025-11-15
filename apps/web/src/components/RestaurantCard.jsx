import React from "react";
export default function RestaurantCard({ r, onPick }){
  return (
    <article className="rest-card">
      <header>
        <h3>{r.name}</h3>
        <span className="muted">{r.zone} {r.exclusive ? "Â· ðŸŒŸ Exklusiv" : ""}</span>
      </header>
      <p className="muted">Märkning: {r.tags.join(" Â· ")}</p>
      <div className="job-actions" style={{marginTop:8}}>
        {r.exclusive ? (
          <a className="btn outline" href="tel:+46000000000">Ring concierge</a>
        ) : (
          <button className="btn solid" onClick={()=> onPick(r)}>Välj</button>
        )}
      </div>
    </article>
  );
}
