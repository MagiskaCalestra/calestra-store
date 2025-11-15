// apps/web/src/components/dining/ResultsList.jsx
import React, { useMemo, useState } from "react";
import { filterRestaurants } from "../../api/dining";
import { useDining } from "../../core/DiningContext";
import AvailabilityGrid from "./AvailabilityGrid";

export default function ResultsList(){
  const { filters } = useDining();
  const results = useMemo(()=>filterRestaurants(filters), [filters]);
  const [openId, setOpenId] = useState(null);

  return (
    <div className="grid gap-12">
      {results.map(r => (
        <div key={r.id} className="card">
          <div className="row space">
            <div>
              <h3 className="h3">{r.name}</h3>
              <div className="muted small">{r.area} Â· {r.type.join(", ")} Â· {r.price}</div>
            </div>
            <button className="btn" onClick={()=>setOpenId(openId===r.id ? null : r.id)}>
              {openId===r.id ? "Dölj tider" : "Visa tider"}
            </button>
          </div>
          {openId===r.id && <div className="mt-8"><AvailabilityGrid restaurant={r}/></div>}
        </div>
      ))}
      {!results.length && <div className="muted">Inga träffar â€“ justera filtren.</div>}
    </div>
  );
}
