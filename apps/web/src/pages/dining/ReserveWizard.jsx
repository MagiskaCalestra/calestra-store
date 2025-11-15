import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBooking } from "../../core/BookingContext";

/** samma lista som i Dining â€“ i riktig app: hämta via API  */
const LOOKUP = {
  gg: { id:"gg", name:"Garden Grove", area:"Elderwood" },
  rs: { id:"rs", name:"Riverâ€™s Song", area:"Aqua Vale" },
  sm: { id:"sm", name:"Star Meadow Market", area:"Grand Calestra" },
};

const TIMES = ["11:30","12:00","12:30","13:00","17:00","17:30","18:00","18:30","19:00","19:30"];

export default function ReserveWizard(){
  const { id } = useParams();
  const nav = useNavigate();
  const { booking, setBooking } = useBooking();

  const restaurant = LOOKUP[id];
  const [step, setStep] = useState(1);
  const [party, setParty] = useState(booking.party || 2);
  const [date, setDate] = useState(booking.date || "");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState(booking.tempSlots || []);

  useEffect(()=>{
    // om man kom direkt utan söksida â€“ skapa â€œallaâ€ slots
    if (!slots.length) setSlots(TIMES.filter((_,i)=> i%2===0));
  },[]);

  const canContinue = useMemo(()=>{
    if (step===1) return party>0 && party<=10;
    if (step===2) return !!date;
    if (step===3) return !!time;
    return true;
  },[step, party, date, time]);

  const next = () => {
    if (!canContinue) return;
    if (step<4) setStep(step+1);
    else {
      // Spara och hoppa till checkout i ditt flow
      setBooking({
        ...booking,
        party, date,
        dining: { restaurantId: id, restaurantName: restaurant?.name, time }
      });
      nav("/booking/Checkout");
    }
  };
  const back = ()=> setStep(Math.max(1, step-1));

  return (
    <div className="container py-10">
      <div className="row space wrap" style={{gap:12}}>
        <h1 className="h1">Boka bord â€“ {restaurant?.name || "Restaurang"}</h1>
        <div className="chip">
          <span className="glow-dot" /> <strong>Steg {step} / 4</strong>
        </div>
      </div>

      <div className="grid cols-3 mt-6">
        {/* Wizard body */}
        <div className="card pad" style={{gridColumn:"span 2"}}>
          {step===1 && (
            <>
              <h3 className="h3">1. Antal gäster</h3>
              <p className="muted">Hur många kliver genom porten? (inkl. spädbarn)</p>
              <div className="grid cols-4" style={{marginTop:12}}>
                <input type="number" min={1} max={10} value={party} onChange={e=>setParty(Number(e.target.value))}/>
              </div>
            </>
          )}

          {step===2 && (
            <>
              <h3 className="h3">2. Datum</h3>
              <p className="muted">Välj den dag som kallar på er.</p>
              <div style={{maxWidth:320, marginTop:12}}>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
            </>
          )}

          {step===3 && (
            <>
              <h3 className="h3">3. Tid</h3>
              <p className="muted">Tillgängliga sittningar för valt datum och sällskap.</p>
              <div style={{display:"flex", flexWrap:"wrap", gap:10, marginTop:12}}>
                {slots.map(t => (
                  <button
                    key={t}
                    className={`btn ${time===t ? "" : "ghost"}`}
                    onClick={()=>setTime(t)}
                    aria-pressed={time===t}
                  >
                    {t}
                  </button>
                ))}
                {!slots.length && <div className="notice">Inga tider â€“ prova annat datum.</div>}
              </div>
            </>
          )}

          {step===4 && (
            <>
              <h3 className="h3">4. Granska & fortsätt</h3>
              <div className="summary" style={{marginTop:12}}>
                <div className="grid cols-2">
                  <div>
                    <p><strong>Restaurang</strong><br/>{restaurant?.name}</p>
                    <p className="muted">{restaurant?.area}</p>
                  </div>
                  <div>
                    <p><strong>Gäster</strong><br/>{party}</p>
                    <p><strong>Datum</strong><br/>{date || "â€”"}</p>
                    <p><strong>Tid</strong><br/>{time || "â€”"}</p>
                  </div>
                </div>
                <p className="muted" style={{marginTop:10}}>
                  Eventuella krav för inträde / parkpass kontrolleras i nästa steg.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Side info */}
        <aside className="card pad">
          <h3 className="h3">Bra att veta</h3>
          <ul style={{margin:"8px 0 0 18px", color:"var(--muted)"}}>
            <li>Avbokning möjlig t.o.m. 24h före sittning.</li>
            <li>Allergier? Meddela i nästa steg â€“ köket anpassar menyn.</li>
            <li>Matplan/poäng dras automatiskt i kassan.</li>
          </ul>
        </aside>
      </div>

      <div className="row space" style={{marginTop:20}}>
        <button className="btn ghost" onClick={back} disabled={step===1}>Tillbaka</button>
        <button className="btn" onClick={next} disabled={!canContinue}>
          {step<4 ? "Fortsätt" : "Fortsätt till betalning"}
        </button>
      </div>
    </div>
  );
}
