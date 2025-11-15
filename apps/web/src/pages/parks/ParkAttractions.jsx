import React from "react";
import { useParams } from "react-router-dom";
import { CCoreSDK } from "../../core/ccore";
import PlaceCard from "../../components/PlaceCard";

export default function ParkAttractions() {
  const { parkId } = useParams();
  const park = CCoreSDK.Places.listParks().find(p=>p.id===parkId);
  const list = CCoreSDK.Places.listPlaces({ parkId, type:"attraction" });

  if (!park) {
    return (
      <section className="page">
        <div className="wrap">
          <h1>Park saknas</h1>
          <p>Kontrollera länken.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="wrap">
        <h1>{park.name} â€“ Attraktioner</h1>
        {list.length === 0 ? (
          <div className="empty">Inga attraktioner inlagda ännu.</div>
        ) : (
          <div className="grid">
            {list.map(p => <PlaceCard key={p.id} place={p} />)}
          </div>
        )}
      </div>

      <style>{`
        .wrap { max-width:1100px; margin:0 auto; padding:24px 16px; color:#e8ecff; }
        .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px; }
        .empty { border:1px solid #2b315e; border-radius:12px; background:#0f1430; padding:14px; }
      `}</style>
    </section>
  );
}
