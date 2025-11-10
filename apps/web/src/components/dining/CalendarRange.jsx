// apps/web/src/components/dining/CalendarRange.jsx
import React from "react";
export default function CalendarRange({ value, onChange, maxDays=10 }) {
  const onStart = e => onChange({ ...value, start: e.target.value ? new Date(e.target.value) : null });
  const onEnd   = e => onChange({ ...value, end:   e.target.value ? new Date(e.target.value)   : null });
  return (
    <div className="card row gap-8">
      <div>
        <label className="label">Från</label>
        <input type="date" value={value.start ? toYMD(value.start) : ""} onChange={onStart}/>
      </div>
      <div>
        <label className="label">Till <small>(max {maxDays} dagar)</small></label>
        <input type="date" value={value.end ? toYMD(value.end) : ""} onChange={onEnd}/>
      </div>
    </div>
  );
}
function toYMD(d){ return d.toISOString().slice(0,10); }
