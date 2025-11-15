import React from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../core/BookingContext";

export default function BookingStart() {
  const nav = useNavigate();
  const { state, setHotelTier, setTransport, recalc } = useBooking();

  const next = (e) => {
    e.preventDefault();
    recalc();
    nav("/booking/Tickets");
  };

  return (
    <main className="container py-10">
      <h1 className="h1">Skapa din Calestra-resa</h1>
      <p className="muted">Vi har förifyllt datum och gäster från förstasidan â€” du kan ändra när som helst.</p>

      <form onSubmit={next} className="stack gap-4">
        <fieldset>
          <legend>Hotellnivå</legend>
          <div className="row gap-2">
            {[
              { id:"any", label:"Öppen för förslag" },
              { id:"value", label:"Resenär" },
              { id:"moderate", label:"Berättelse" },
              { id:"deluxe", label:"Signatur" },
              { id:"partner", label:"Partner" },
            ].map(o=>(
              <label key={o.id} className="chip chip--select">
                <input
                  type="radio"
                  name="tier"
                  value={o.id}
                  checked={state.hotelTier===o.id}
                  onChange={()=>setHotelTier(o.id)}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Transport (valfritt)</legend>
          <div className="row gap-2">
            {["none","flight","train","bus","flex"].map(m => (
              <label key={m} className="chip chip--select">
                <input type="radio" name="mode" value={m}
                  checked={state.transport.mode===m}
                  onChange={()=>setTransport({ ...state.transport, mode: m })}
                />
                <span>{m==="none"?"Jag ordnar själv": m==="flight"?"Flyg": m==="train"?"Tåg": m==="bus"?"Buss":"Flex"} </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="row gap-2">
          <button className="btn">Till biljetter</button>
        </div>
      </form>
    </main>
  );
}
