// Calestra â€” BookingBar (auto-close för barnpanel + förbättrad UX)
import React, { useEffect, useMemo, useRef, useState } from "react";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function BookingBar(){
  const today = useMemo(() => new Date().toISOString().slice(0,10), []);
  const [date, setDate]         = useState("");
  const [nights, setNights]     = useState(1);
  const [adults, setAdults]     = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState([]);
  const [packageType, setPackageType] = useState("tickets"); // tickets | hotel | hotel+tickets
  const [level, setLevel] = useState("standard");

  // Kontrollerad <details>
  const detailsRef = useRef(null);
  const [kidsOpen, setKidsOpen] = useState(false);

  useEffect(() => {
    // synka antal barn â†” ålderslistan
    setChildAges(prev => {
      const next = prev.slice(0, children);
      while (next.length < children) next.push(null);
      return next;
    });
    setKidsOpen(children > 0);
    if (children === 0) {
      // stäng om noll barn
      if (detailsRef.current) detailsRef.current.open = false;
    } else {
      if (detailsRef.current) detailsRef.current.open = true;
    }
  }, [children]);

  // Stäng när alla åldrar satta
  useEffect(() => {
    if (children > 0 && childAges.length === children) {
      const allSet = childAges.every(a => a !== null);
      if (allSet) {
        setKidsOpen(false);
        if (detailsRef.current) detailsRef.current.open = false; // hård-stäng
      }
    }
  }, [children, childAges]);

  const updateChildAge = (i, v) => {
    const n = Number(v);
    setChildAges(ages => ages.map((a, idx) => idx===i ? n : a));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const payload = {
      date,
      nights: clamp(Number(nights),1,30),
      adults: clamp(Number(adults),1,10),
      children: clamp(Number(children),0,10),
      childAges: childAges.map(a => Number(a ?? 0)),
      packageType,
      level,
    };
    console.log("START BOOKING â†’", payload);
    // TODO: navigate till /booking med state
  };

  return (
    <form className="bookingbar" onSubmit={onSubmit}>
      <div className="booking-row">
        <div className="field">
          <label>Datum</label>
          <input type="date" min={today} value={date}
            onChange={(e)=>setDate(e.target.value)} required placeholder="åååå-mm-dd" />
        </div>

        <div className="field small">
          <label>Nätter</label>
          <input type="number" min={1} max={30} value={nights}
            onChange={(e)=>setNights(e.target.value)} inputMode="numeric" />
        </div>

        <div className="field small">
          <label>Vuxna</label>
          <input type="number" min={1} max={10} value={adults}
            onChange={(e)=>setAdults(e.target.value)} inputMode="numeric" />
        </div>

        <div className="field small">
          <label>Barn</label>
          <input type="number" min={0} max={10} value={children}
            onChange={(e)=>setChildren(e.target.value)} inputMode="numeric" />
        </div>
      </div>

      {children > 0 && (
        <details className="kids-panel" ref={detailsRef} open={kidsOpen} onToggle={(e)=>setKidsOpen(e.currentTarget.open)}>
          <summary>Barnens ålder</summary>
          <div className="booking-row kids">
            {childAges.map((age, i) => (
              <div className="field kid-age" key={i}>
                <label>Barn {i+1}</label>
                <select value={age ?? ""} onChange={(e)=>updateChildAge(i, e.target.value)}>
                  <option value="" disabled>Välj ålder</option>
                  {Array.from({length:18},(_,n)=>(<option key={n} value={n}>{n} år</option>))}
                </select>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="booking-row">
        <div className="field grow">
          <label>Boendenivå</label>
          <select value={level} onChange={(e)=>setLevel(e.target.value)}>
            <option value="standard">Harmoni (standard)</option>
            <option value="plus">Symfoni (plus)</option>
            <option value="deluxe">Resonans (deluxe)</option>
          </select>
        </div>

        <div className="field grow">
          <label>Upplägg</label>
          <select value={packageType} onChange={(e)=>setPackageType(e.target.value)}>
            <option value="tickets">Endast biljetter</option>
            <option value="hotel">Endast hotell</option>
            <option value="hotel+tickets">Hotell + biljetter</option>
          </select>
        </div>

        <div className="actions">
          <button type="submit" className="btn-primary">Planera ditt besök</button>
          <div className="trust">
            <span>ðŸ”’ Säker betalning</span>
            <span>ðŸ” Gratis ombokning*</span>
            <span>â­ Gästbetyg 4,8/5</span>
          </div>
        </div>
      </div>

      <div className="helper-row" aria-live="polite">
        {packageType !== "tickets"
          ? <span>Biljett-detaljer (t.ex. Hopper) väljer du i nästa steg.</span>
          : <span>Tips: â€œHotell + biljetterâ€ ger paketpris och bonuspoäng.</span>}
      </div>
    </form>
  );
}
