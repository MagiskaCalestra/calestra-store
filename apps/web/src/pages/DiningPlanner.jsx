import React, { useState } from "react";
import { useBooking } from "../core/BookingContext";
import RESTAURANTS from "../data/restaurants";

export default function DiningPlanner(){
  const { state } = useBooking();
  const [plan, setPlan] = useState([]);

  const start = state.date || new Date().toISOString().slice(0,10);

  function addSlot(){
    setPlan(p=>[...p, { date: start, time:"18:00", people: state.party.adults + state.party.children, restaurant: "" }]);
  }

  function setRow(i, key, val){
    setPlan(p=> p.map((r,idx)=> idx===i? {...r, [key]:val} : r));
  }

  return (
    <main className="container py-10">
      <h1 className="h1">Dining Planner</h1>
      <p className="muted">Planera bord när det passar dig. Din matplan: {state.dining.mealPoints} poäng.</p>

      <div className="aura-card" style={{padding:14}}>
        <button className="btn solid" onClick={addSlot}>Lägg till bokning</button>
        <div style={{height:12}}/>
        {!plan.length && <p className="muted">Inga bokningar ännu.</p>}
        {plan.map((row,i)=>(
          <div key={i} className="plan-row">
            <input className="input" type="date" value={row.date} onChange={e=> setRow(i,"date", e.target.value)} />
            <input className="input" type="time" value={row.time} onChange={e=> setRow(i,"time", e.target.value)} />
            <input className="input" type="number" min={1} max={12} value={row.people} onChange={e=> setRow(i,"people", Number(e.target.value))} />
            <select className="select" value={row.restaurant} onChange={e=> setRow(i,"restaurant", e.target.value)}>
              <option value="">â€” Restaurang â€”</option>
              {RESTAURANTS.filter(r=>!r.exclusive).map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        ))}
      </div>
    </main>
  );
}
