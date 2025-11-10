// apps/web/src/components/booking/PartnerWidget.jsx
import React, { useMemo, useState } from "react";
import { CCoreSDK } from "../../core/ccore";

// Små datumhjälpare
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function toISO(d){ return new Date(d).toISOString().slice(0,10); }

export default function PartnerWidget() {
  // Hämta ev. valt datum från varukorg (förifyller checkin/checkout/flygdatum)
  const cart = CCoreSDK.Booking.getCart();
  const selectedDate = useMemo(() => {
    const t = cart?.items?.find(i => i.kind === "TICKET");
    return t?.date || toISO(new Date());
  }, [cart]);

  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [checkin, setCheckin] = useState(selectedDate);
  const [checkout, setCheckout] = useState(toISO(addDays(selectedDate, 2)));
  const [depart, setDepart] = useState(selectedDate);
  const [ret, setRet] = useState(toISO(addDays(selectedDate, 2)));

  const policyText = CCoreSDK.Affiliates.policyBannerText();
  const operator = CCoreSDK.Affiliates.isOperator();

  const open = (providerId, search) => {
    if (operator) {
      alert("Operatörsläge är aktivt. Interna transportbokningar lanseras senare.");
      return;
    }
    try {
      const url = CCoreSDK.Affiliates.buildLink(providerId, search);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert(e?.message || "Kunde inte öppna partnerlänk.");
    }
  };

  return (
    <aside className="partner card">
      <h3>Resa & boende – partners</h3>
      <p className="muted">{policyText}</p>

      <div className="fields">
        <label className="lbl">Stad / City
          <input className="inp" value={city} onChange={e=>setCity(e.target.value)} placeholder="t.ex. Stockholm" />
        </label>

        <div className="row">
          <label className="lbl">Check-in
            <input className="inp" type="date" value={checkin} onChange={e=>setCheckin(e.target.value)} />
          </label>
          <label className="lbl">Check-out
            <input className="inp" type="date" value={checkout} onChange={e=>setCheckout(e.target.value)} />
          </label>
        </div>

        <div className="row">
          <label className="lbl">Flyg från
            <input className="inp" value={from} onChange={e=>setFrom(e.target.value)} placeholder="ARN / GOT / CPH" />
          </label>
          <label className="lbl">Flyg till
            <input className="inp" value={to} onChange={e=>setTo(e.target.value)} placeholder="t.ex. IST" />
          </label>
        </div>

        <div className="row">
          <label className="lbl">Utresa
            <input className="inp" type="date" value={depart} onChange={e=>setDepart(e.target.value)} />
          </label>
          <label className="lbl">Hemresa
            <input className="inp" type="date" value={ret} onChange={e=>setRet(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="grid">
        <button
          className="btn"
          disabled={operator}
          title={operator ? "Operatörsläge – extern länk avstängd" : "Öppnas i ny flik"}
          onClick={()=>open("hotels", { city, checkin, checkout })}
        >
          Sök hotell ↗
        </button>

        <button
          className="btn"
          disabled={operator}
          title={operator ? "Operatörsläge – extern länk avstängd" : "Öppnas i ny flik"}
          onClick={()=>open("flights", { from, to, depart, return: ret, adults:1 })}
        >
          Sök flyg ↗
        </button>

        <button
          className="btn"
          disabled={operator}
          title={operator ? "Operatörsläge – extern länk avstängd" : "Öppnas i ny flik"}
          onClick={()=>open("transport", { city, date: checkin, time:"10:00", type:"airport" })}
        >
          Flygtransfer / Transport ↗
        </button>

        <button
          className="btn ghost"
          disabled={operator}
          title={operator ? "Operatörsläge – extern länk avstängd" : "Öppnas i ny flik"}
          onClick={()=>open("experiences", { city, date: checkin, adults:1 })}
        >
          Stadsturer & upplevelser ↗
        </button>
      </div>

      <p className="fine">
        Externa partnerlänkar. Du bokar och betalar hos partnern. Klick kan ge små DreamCircle-poäng.
      </p>

      <style>{`
        .partner.card { border:1px solid #2b315e; border-radius:14px; background:#0f1430; padding:14px; color:#e8ecff; }
        .muted { opacity:.9; margin:4px 0 10px; }
        .fields .lbl { display:flex; flex-direction:column; gap:6px; margin-bottom:8px; }
        .inp { padding:10px; border-radius:10px; border:1px solid #2b315e; background:#0b0f25; color:#e8ecff; }
        .row { display:flex; gap:10px; flex-wrap:wrap; }
        .grid { display:grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap:8px; margin-top:8px; }
        .btn { padding:10px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; cursor:pointer; }
        .btn.ghost { background:transparent; }
        .btn:disabled { opacity:.6; cursor:not-allowed; }
        .fine { margin-top:8px; font-size:.85rem; opacity:.8; }
      `}</style>
    </aside>
  );
}
