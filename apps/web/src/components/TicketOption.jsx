import React from "react";
export default function TicketOption({ p, selected, onAdd, onRemove }){
  const isSel = !!selected.find(x=>x.id===p.id);
  return (
    <div className={`ticket-row ${isSel ? "sel":""}`}>
      <div className="ticket-info">
        <strong>{p.name}</strong>
        <span className="muted">{p.basePrice} kr / dag</span>
      </div>
      <div className="ticket-actions">
        {isSel ? (
          <button className="btn outline" onClick={()=> onRemove(p.id)}>Ta bort</button>
        ) : (
          <button className="btn solid" onClick={()=> onAdd(p)}>Lägg till</button>
        )}
      </div>
    </div>
  );
}
