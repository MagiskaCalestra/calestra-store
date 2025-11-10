// apps/web/src/pages/consent/Index.jsx
import React from "react";
import { getConsent, setConsent, clearConsent } from "@utils/consent";

export default function ConsentDebug() {
  const c = getConsent();
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1>Consent debug</h1>
      <pre style={{ background:"#11161c", padding:12, borderRadius:8, border:"1px solid #2a2f3a" }}>
        {JSON.stringify(c, null, 2)}
      </pre>
      <div style={{ display:"flex", gap:10 }}>
        <button className="btn" onClick={() => setConsent({ analytics:false, marketing:false })}>Endast nödvändiga</button>
        <button className="btn btn-acc" onClick={() => setConsent({ analytics:true, marketing:true })}>Tillåt alla</button>
        <button className="btn" onClick={() => clearConsent()}>Rensa</button>
      </div>
    </div>
  );
}
