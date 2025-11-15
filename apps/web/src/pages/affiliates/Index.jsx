import React from "react";
import { bootstrapAffiliate, getRef, clickTrack, attachRefToUrl } from "@core/AffiliateManager";

export default function AffiliatesIndex() {
  React.useEffect(() => { bootstrapAffiliate(); }, []);
  const myRef = getRef();

  const storeDeepLink = attachRefToUrl("/store");
  const partnerGoogle = () =>
    clickTrack("Google", "https://ads.google.com/", { flow: "outbound", viaGo: true });
  const partnerTemu = () =>
    clickTrack("Temu", "https://www.temu.com/", { flow: "outbound", viaGo: true });

  return (
    <div className="container section-lg">
      <div className="h2">Affiliates â€“ två vägar att tjäna</div>
      <div className="small" style={{ marginTop: 4 }}>
        Din ref: <b>{myRef || "â€“"}</b>
      </div>

      {/* 1. Inbound â€“ vi betalar dig */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-pad-lg">
          <div className="h3">1) Tjäna när du säljer våra produkter (inbound)</div>
          <p className="small" style={{ marginTop: 6 }}>
            Dela din personliga länk till Calestra Store. När din publik köper â€“ får du provision.
          </p>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <a className="btn btn-acc" href={storeDeepLink}>Öppna Store med min ref</a>
            <a className="btn" href="/members">Se intjäning på Min sida</a>
          </div>
          <ul className="small" style={{ marginTop: 12 }}>
            <li>Standardprov: 10â€“20% per godkänt köp (tier-baserat)</li>
            <li>30-dagars cookie, last-click attribution</li>
            <li>Godkända köp betalas ut enligt utbetalningskö</li>
          </ul>
        </div>
      </div>

      {/* 2. Outbound â€“ vi tjänar via partners */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-pad-lg">
          <div className="h3">2) Hjälp oss driva partnertrafik (outbound)</div>
          <p className="small" style={{ marginTop: 6 }}>
            Vi har externa partnerprogram. När våra besökare går via våra partnerlänkar kan <i>vi</i> tjäna pengar.
            Den intjäningen syns i systemet som <b>outbound</b>. (Vill du få del av outbound? Ansök som ambassadör.)
          </p>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <button className="btn btn-acc" onClick={partnerGoogle}>Google â€“ Partneryta</button>
            <button className="btn" onClick={partnerTemu}>Temu â€“ Kampanjer</button>
          </div>
          <ul className="small" style={{ marginTop: 12 }}>
            <li>Outbound visas i Min sida med typ â€œoutboundâ€</li>
            <li>Inga kundköp i vår butik krävs â€“ intjänas hos partner</li>
            <li>Ambassadörer kan få %-andel av outbound (enligt avtal)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
