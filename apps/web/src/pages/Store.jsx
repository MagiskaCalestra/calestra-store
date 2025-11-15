import React from "react";
export default function Store(){
  return (
    <main className="container py-10">
      <h1 className="h1">Calestra Store</h1>
      <p className="muted">Detta är vår interna storesida. Din riktiga butik kör du på port 5175.</p>
      <div className="row gap">
        <a className="btn-primary" href="http://localhost:5175" target="_blank" rel="noreferrer">
          Öppna live-butiken (5175)
        </a>
        <a className="btn-outline" href="http://localhost:5175/catalog" target="_blank" rel="noreferrer">
          Katalog
        </a>
      </div>

      <div className="store-cards">
        <article className="s-card">
          <div className="s-thumb" />
          <h3>Butikslåten â€“ â€œCalestra Shop Loopâ€</h3>
          <p className="muted">Instrumental butikstema som rullar mjukt i bakgrunden när du handlar.</p>
        </article>
        <article className="s-card">
          <div className="s-thumb" />
          <h3>Affischer & Print</h3>
          <p className="muted">Högkvalitativa motiv från Calestra-världen.</p>
        </article>
        <article className="s-card">
          <div className="s-thumb" />
          <h3>Digitala upplevelser</h3>
          <p className="muted">Exklusiva släpp och medlemsförmåner.</p>
        </article>
      </div>
    </main>
  );
}
