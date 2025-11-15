// apps/web/src/components/dining/MapStub.jsx
import React from "react";
export default function MapStub({ items=[] }){
  return (
    <div className="card" style={{minHeight:260}}>
      <div className="muted">Karta (stub) â€“ visar {items.length} träffar.
        Vi byter till Leaflet/Mapbox när du vill â€“ utan att ändra resten av UI:t.</div>
    </div>
  );
}
