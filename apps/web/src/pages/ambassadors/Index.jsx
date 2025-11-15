import React from "react";
import { getRef, attachRefToUrl } from "@core/AffiliateManager";

export default function AmbassadorsIndex() {
  const ref = getRef()?.code;
  const link = attachRefToUrl("/store");
  return (
    <div className="container section-lg">
      <div className="h2">Ambassadörer</div>
      <p className="small" style={{marginTop:6}}>Din ref: <b>{ref || "â€“"}</b></p>
      <div className="row" style={{gap:8, marginTop:10}}>
        <a className="btn btn-acc" href={link}>Dela Store-länk med min ref</a>
        <a className="btn" href="/members">Min sida</a>
      </div>
    </div>
  );
}
