import React from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../core/BookingContext";

export default function Tickets() {
  const nav = useNavigate();
  const { state, setTickets, recalc } = useBooking();

  const next = (e) => {
    e.preventDefault();
    recalc();
    nav("/booking/Dining");
  };

  return (
    <main className="container py-10">
      <h1 className="h1">Parkbiljetter</h1>
      <p className="muted">Välj hur du vill resa mellan portalerna.</p>

      <form onSubmit={next} className="stack gap-4">
        <fieldset>
          <legend>Typ</legend>
          <div className="stack">
            <label className="radio-tile">
              <input
                type="radio"
                name="tt"
                checked={state.ticketType==="one-park"}
                onChange={()=>setTickets({ ticketType: "one-park" })}
              />
              <div>
                <strong>En värld / dag</strong>
                <div className="muted">Lugn takt, välj värld per dag.</div>
              </div>
            </label>
            <label className="radio-tile">
              <input
                type="radio"
                name="tt"
                checked={state.ticketType==="flow-hopper"}
                onChange={()=>setTickets({ ticketType: "flow-hopper" })}
              />
              <div>
                <strong>Flow Hopper</strong>
                <div className="muted">Vår egen – känn efter under dagen och byt när du vill.</div>
              </div>
            </label>
            <label className="radio-tile">
              <input
                type="radio"
                name="tt"
                checked={state.ticketType==="all-parks"}
                onChange={()=>setTickets({ ticketType: "all-parks" })}
              />
              <div>
                <strong>Alla världar</strong>
                <div className="muted">Maximal frihet.</div>
              </div>
            </label>
          </div>
        </fieldset>

        <label className="inline">
          <span>Dagar</span>
          <input
            type="number" min="1" max="14"
            value={state.ticketDays}
            onChange={(e)=>setTickets({ ticketDays: +e.target.value })}
          />
        </label>

        <div className="row gap-2">
          <button className="btn">Nästa: Matplan</button>
        </div>
      </form>
    </main>
  );
}
