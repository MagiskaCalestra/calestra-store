import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../core/BookingContext";

export default function Checkout() {
  const nav = useNavigate();
  const { state, recalc, reset } = useBooking();

  useEffect(() => { recalc(); /* säkerställ att pris finns */ }, []); // eslint-disable-line

  const pay = (e) => {
    e.preventDefault();
    // Här skulle vi anropa PSP; nu simulerar vi lyckad betalning.
    setTimeout(() => {
      nav("/booking/Confirmation");
      reset();
    }, 200);
  };

  return (
    <main className="container py-10">
      <h1 className="h1">Kassa</h1>

      <section className="card">
        <h2>Sammanfattning</h2>
        <ul className="list">
          {state.price.breakdown.map((l, i)=>(
            <li key={i} className="row space">
              <span>{l.label}</span>
              <strong>{l.amount.toLocaleString("sv-SE")} {state.price.currency}</strong>
            </li>
          ))}
          <li className="row space" style={{borderTop:"1px solid #2f3545", paddingTop:8, marginTop:8}}>
            <span>Totalt</span>
            <strong>{state.price.total.toLocaleString("sv-SE")} {state.price.currency}</strong>
          </li>
        </ul>
      </section>

      <form onSubmit={pay} className="stack gap-4">
        <section className="card">
          <h2>Resenärer</h2>
          <div className="grid-2">
            <label>Förnamn<input required/></label>
            <label>Efternamn<input required/></label>
            <label>E-post<input type="email" required/></label>
            <label>Telefon<input required/></label>
          </div>
        </section>

        <section className="card">
          <h2>Betalning</h2>
          <div className="grid-2">
            <label>Kortnummer<input required placeholder="•••• •••• •••• ••••"/></label>
            <label>Namn på kort<input required/></label>
            <label>Giltigt till<input required placeholder="MM/YY"/></label>
            <label>CVC<input required placeholder="123"/></label>
          </div>
        </section>

        <div className="row gap-2">
          <button className="btn btn--gold">Betala och boka</button>
        </div>
      </form>
    </main>
  );
}
