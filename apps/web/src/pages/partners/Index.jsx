import React from "react";
import { clickTrack } from "@core/AffiliateManager";
import { loadPartnerCatalog } from "@core/PartnerCatalog";

export default function PartnersIndex() {
  const [items] = React.useState(loadPartnerCatalog());

  return (
    <div className="container section-lg">
      <div className="h2">Partners</div>
      <p className="small" style={{marginTop:6}}>Alla utgående klick går via /go och bevarar ref/UTM.</p>

      <div className="cards" style={{marginTop:14}}>
        {items.map(p=>(
          <article key={p.id} className="card">
            <div className="card-pad">
              <div className="eyebrow">{p.badge || "Partner"}</div>
              <div className="h3">{p.title}</div>
              <p className="small" style={{marginTop:4}}>{p.desc}</p>
              <div style={{marginTop:10}}>
                <button className="btn" onClick={()=>clickTrack(p.partnerKey || p.id, p.url, { flow:"outbound" })}>{p.cta || "Öppna"}</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
