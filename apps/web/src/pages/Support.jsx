import React from "react";

export default function Support(){
  return (
    <main>
      <section className="cw-container" style={{ marginTop: 18 }}>
        <h1 className="h1">Stöd Calestra</h1>
        <p className="cw-meter-val" style={{ marginTop: 6 }}>
          Det snabbaste sättet att stötta är att handla i vår Store. Du kan också välja direktstöd nedan.
        </p>

        <div className="cw-grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 14 }}>
          <article className="cw-card">
            <div className="cw-card-pad-lg">
              <h3>Handla i Store</h3>
              <p className="cw-meter-val" style={{ marginTop: 6 }}>Varje köp driver parken framåt.</p>
              <a className="cw-btn cw-btn-acc" href="/store" data-affiliate="true" style={{ marginTop: 10 }}>
                Öppna Store
              </a>
            </div>
          </article>

          <article className="cw-card">
            <div className="cw-card-pad-lg">
              <h3>Direktstöd</h3>
              <p className="cw-meter-val" style={{ marginTop: 6 }}>
                Swisha, PayPal eller kort â€“ välj det som passar dig.
              </p>
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button className="cw-btn cw-btn-ghost">Swish</button>
                <button className="cw-btn cw-btn-ghost">PayPal</button>
                <button className="cw-btn cw-btn-ghost">Kort</button>
              </div>
            </div>
          </article>
        </div>

        <article className="cw-card" style={{ marginTop: 14 }}>
          <div className="cw-card-pad-lg">
            <h3>Vanliga frågor</h3>
            <details style={{ marginTop: 8 }}>
              <summary>Hur används pengarna?</summary>
              <p className="cw-meter-val" style={{ marginTop: 6 }}>
                För att bygga upp brandet, digitala upplevelser och parkens första delar.
              </p>
            </details>
            <details style={{ marginTop: 8 }}>
              <summary>Kan företag bli partner?</summary>
              <p className="cw-meter-val" style={{ marginTop: 6 }}>
                Ja â€“ kontakta oss för partnerskap och sponsring.
              </p>
            </details>
          </div>
        </article>
      </section>
    </main>
  );
}
