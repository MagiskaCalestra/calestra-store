// apps/web/src/components/dining/FilterBar.jsx
import React from "react";
import { useDining } from "../../core/DiningContext";

const TYPES = ["Table Service","Quick Service","Character","Signature"];
const AREAS = ["Magic Kingdom","EPCOT","Animal Kingdom","Hollywood Studios","Disney Springs"];
const PRICES = ["$","$$","$$$","$$$$"];
const PLANS  = ["Dining Plan","Quick-Service Plan"];

export default function FilterBar(){
  const { filters, setFilters, party, setParty } = useDining();

  const toggle = (set, v) => {
    const next = new Set(set); next.has(v) ? next.delete(v) : next.add(v);
    setFilters({ ...filters, [focusKey]: next });
  };

  const setSet = (key, v) => {
    const next = new Set(filters[key]);
    next.has(v) ? next.delete(v) : next.add(v);
    setFilters({ ...filters, [key]: next });
  };

  return (
    <div className="card grid gap-10">
      <div className="row wrap gap-10">
        <label><input type="checkbox"
          checked={filters.acceptsReservations}
          onChange={e=>setFilters({...filters, acceptsReservations:e.target.checked})}/> Bokningsbara</label>
        <div className="separator" />
        <SelectGroup title="Typ" options={TYPES} values={filters.types} onToggle={v=>setSet("types", v)} />
        <SelectGroup title="Område" options={AREAS} values={filters.areas} onToggle={v=>setSet("areas", v)} />
        <SelectGroup title="Pris" options={PRICES} values={filters.price} onToggle={v=>setSet("price", v)} />
        <SelectGroup title="Plan" options={PLANS} values={filters.plan} onToggle={v=>setSet("plan", v)} />
      </div>
      <div className="row gap-12">
        <label>Vuxna
          <input type="number" min={1} value={party.adults}
            onChange={e=>setParty({...party, adults:+e.target.value||1})}/>
        </label>
        <label>Barn
          <input type="number" min={0} value={party.children}
            onChange={e=>setParty({...party, children:+e.target.value||0})}/>
        </label>
        <label><input type="checkbox" checked={party.accessible}
          onChange={e=>setParty({...party, accessible:e.target.checked})}/> Tillgänglig plats</label>
      </div>
    </div>
  );
}

function SelectGroup({ title, options, values, onToggle }){
  return (
    <div className="row gap-6 wrap">
      <strong>{title}:</strong>
      {options.map(opt =>
        <button key={opt} className={`chip ${values.has(opt) ? "chip-on":""}`} onClick={()=>onToggle(opt)}>{opt}</button>
      )}
    </div>
  );
}
