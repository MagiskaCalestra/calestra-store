// D:\WebProjects\Calestra\apps\admin\src\pages\Payouts.jsx
import React from "react";

export default function Payouts() {
  return (
    <div className="card">
      <div className="cardTitle">Payouts</div>
      <div className="cardBody">
        För testlansering räcker detta som “placeholder”. När du går live kopplar vi:
        <ul>
          <li>Export underlag per period</li>
          <li>Markera orders som “payed out”</li>
          <li>Skapa enkel CSV för bokföring</li>
        </ul>
      </div>

      <div className="hr" />

      <div className="row">
        <button className="btn" disabled>
          Export (kommer snart)
        </button>
        <span className="pill">Stabilt & enkelt först</span>
      </div>
    </div>
  );
}
