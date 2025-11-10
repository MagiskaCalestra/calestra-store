import React, { useState } from "react";
import { clickTrack } from "@core/AffiliateManager";

/**
 * Minimal partner-sök (vi förmedlar vidare – inte säljansvar).
 */
export default function ExternalSearch() {
  const [q, setQ] = useState("");

  const PARTNERS = [
    { name: "Booking",  label: "Hotell", url: "https://www.booking.com/searchresults.html?aid=XXXXXX&ss=" },
    { name: "SJ",       label: "Tåg",    url: "https://www.sj.se/sv/sok.html#/?search=" },
    { name: "FlixBus",  label: "Buss",   url: "https://www.flixbus.se/bussresor" },
    { name: "Momondo",  label: "Flyg",   url: "https://www.momondo.se/flight-search/" },
  ];

  function go(p) {
    const base = p.url;
    const target = base.includes("=") ? base + encodeURIComponent(q) : base;
    clickTrack(p.name, target);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="h2">Sök & Partner</h1>
      <p className="small opacity-80 mt-1">Bokning sker hos respektive leverantör. Partnerlänkar kan ge oss provision.</p>

      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Stad, datum eller plats (valfritt)"
          className="input"
          style={{ flex: 1 }}
        />
        <span className="pill">Från Calestra</span>
      </div>

      <div className="grid" style={{ gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:14 }}>
        {PARTNERS.map(p => (
          <button key={p.name}
            onClick={()=>go(p)}
            className="btn btn-ghost"
          >
            {p.label} • {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
