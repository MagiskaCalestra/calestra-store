// apps/web/src/components/dining/AvailabilityGrid.jsx
import React, { useMemo } from "react";
import { getAvailability } from "../../api/dining";
import { useDining } from "../../core/DiningContext";

export default function AvailabilityGrid({ restaurant }){
  const { range, party } = useDining();
  const rows = useMemo(()=>getAvailability(restaurant.id, range, party), [restaurant.id, range, party]);

  if (!range.start || !range.end) return <div className="muted">Välj datumintervall för att se tider.</div>;

  return (
    <div className="grid gap-6">
      {rows.map(({date, slots}) => (
        <div key={date.toISOString()}>
          <div className="muted small">{date.toLocaleDateString()}</div>
          <div className="row wrap gap-6">
            {slots.length ? slots.map(s =>
              <button className="btn" key={s} onClick={()=>alert(`Håller ${restaurant.name} ${s}`)}>{s}</button>
            ) : <span className="muted">Inga tider</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
