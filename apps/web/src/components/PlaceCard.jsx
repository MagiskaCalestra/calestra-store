import React from "react";

export default function PlaceCard({ place }) {
  return (
    <article className="pcard">
      <div className="head">
        <div className="type">{typeLabel(place.type)}</div>
        <div className="rating">{star(place.rating)} <span>{place.rating?.toFixed(1) ?? "â€”"}</span></div>
      </div>
      <h3 className="name">{place.name}</h3>
      <p className="brief">{place.brief || "â€”"}</p>
      {place.tags?.length ? (
        <div className="tags">{place.tags.map(t => <span className="tag" key={t}>#{t}</span>)}</div>
      ) : null}

      <style>{`
        .pcard { border:1px solid #2b315e; border-radius:14px; background:#0f1430; padding:12px; color:#e8ecff; }
        .head { display:flex; justify-content:space-between; align-items:center; gap:8px; }
        .type { font-size:.85rem; opacity:.9; padding:2px 8px; border:1px solid #2b315e; border-radius:999px; }
        .rating { font-size:.9rem; opacity:.95; display:flex; align-items:center; gap:6px; }
        .name { margin:8px 0 4px; }
        .brief { opacity:.95; }
        .tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
        .tag { padding:2px 8px; border:1px solid #2b315e; border-radius:999px; font-size:.85rem; }
      `}</style>
    </article>
  );
}

function typeLabel(t) {
  return ({
    attraction: "Attraktion",
    ride: "Karusell",
    restaurant: "Restaurang",
    cafe: "CafÃ©",
    shop: "Butik",
    show: "Show"
  }[t] || t);
}

function star(r) {
  if (!r) return "â˜†";
  const full = Math.round(Math.min(5, Math.max(0, r)) );
  return "â˜…".repeat(full) + "â˜†".repeat(5-full);
}
