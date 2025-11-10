import React, { useEffect, useMemo, useState } from "react";
import { CCoreSDK } from "../../core/ccore";
import PlaceCard from "../../components/PlaceCard";

const TYPES = [
  { id:"", label:"Alla typer" },
  { id:"attraction", label:"Attraktioner" },
  { id:"ride", label:"Karuseller" },
  { id:"restaurant", label:"Restauranger" },
  { id:"cafe", label:"Caféer" },
  { id:"shop", label:"Butiker" },
  { id:"show", label:"Shower" },
];

export default function PlacesIndex() {
  useEffect(()=>{ CCoreSDK.Places.seedIfEmpty(); }, []);

  const parks = CCoreSDK.Places.listParks();
  const [parkId, setParkId] = useState("");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    return CCoreSDK.Places.listPlaces({
      type: type || undefined,
      parkId: parkId || undefined,
      query: query || undefined
    });
  }, [type, parkId, query]);

  return (
    <section className="page places">
      <div className="wrap">
        <h1>Platser & upplevelser</h1>
        <p className="lead">Attraktioner, restauranger, caféer, butiker och mer. Filtrera per park och typ.</p>

        <div className="filters">
          <select className="inp" value={parkId} onChange={e=>setParkId(e.target.value)}>
            <option value="">Alla parker</option>
            {parks.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select className="inp" value={type} onChange={e=>setType(e.target.value)}>
            {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>

          <input className="inp" placeholder="Sök namn, tagg…" value={query} onChange={e=>setQuery(e.target.value)} />
        </div>

        {list.length === 0 ? (
          <div className="empty">Inget matchar filtret.</div>
        ) : (
          <div className="grid">
            {list.map(p => <PlaceCard key={p.id} place={p} />)}
          </div>
        )}
      </div>

      <style>{`
        .wrap { max-width:1100px; margin:0 auto; padding:24px 16px; color:#e8ecff; }
        .lead { opacity:.9; margin-bottom:14px; }
        .filters { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
        .inp { padding:10px; border-radius:10px; border:1px solid #2b315e; background:#0b0f25; color:#e8ecff; }
        .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px; }
        .empty { border:1px solid #2b315e; border-radius:12px; background:#0f1430; padding:14px; }
      `}</style>
    </section>
  );
}
