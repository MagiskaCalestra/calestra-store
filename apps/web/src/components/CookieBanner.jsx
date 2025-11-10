import React, { useEffect, useState } from "react";
import { getConsent, setConsent, clearConsent } from "../utils/consent";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = getConsent();
    // visa endast om ej valt tidigare
    if (!c || c.status === "unset") setOpen(true);
  }, []);

  if (!open) return null;

  function allowAll() {
    setConsent({ status: "granted", analytics: true, marketing: true, ts: Date.now() });
    setOpen(false);
  }
  function allowEssential() {
    setConsent({ status: "essential", analytics: false, marketing: false, ts: Date.now() });
    setOpen(false);
  }
  function revoke() {
    clearConsent();
    setOpen(true);
  }

  return (
    <div className="cookie-backdrop" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      <div className="cookie-modal">
        <div className="hd">
          <span className="cookie-badge" />
          <strong id="cookie-title">Cookies & samtycke</strong>
        </div>
        <div className="bd">
          <p className="small" style={{marginTop:0}}>
            Vi använder nödvändiga cookies för att driva sidan. Med ditt samtycke använder vi även
            analys och marknadsföring för att förbättra Calestra-upplevelsen. Du kan ändra ditt val senare.
          </p>

          <div className="row" style={{gap:10,marginTop:10}}>
            <span className="pill">Nödvändiga</span>
            <span className="pill">Analys</span>
            <span className="pill">Marknadsföring</span>
          </div>
        </div>
        <div className="ft cookie-actions">
          <button className="btn btn-ghost" onClick={revoke} title="Rensa val">Rensa</button>
          <button className="btn" onClick={allowEssential}>Endast nödvändiga</button>
          <button className="btn btn-acc" onClick={allowAll}>Acceptera alla</button>
        </div>
      </div>
    </div>
  );
}
