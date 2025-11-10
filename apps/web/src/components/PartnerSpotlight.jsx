import React, { useEffect, useState } from "react";
import { PARTNERS, withTracking } from "@data/partners";

/**
 * Enkel roterande spotlight (utan extern carousel-depend).
 * Roterar var 6:e sekund. Klick går med tracking.
 */

export default function PartnerSpotlight() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(prev => (prev + 1) % PARTNERS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const p = PARTNERS[i];

  return (
    <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-white flex items-center justify-center overflow-hidden">
            {p.logo ? <img src={p.logo} alt="" className="w-full h-full object-contain"/> : <span className="text-black">{p.name[0]}</span>}
          </div>
          <div>
            <div className="text-sm opacity-70">Partner Spotlight</div>
            <div className="text-lg font-medium">{p.label}</div>
            {p.note && <div className="text-sm opacity-80">{p.note}</div>}
          </div>
        </div>
        <a
          href={withTracking(p.url, p.id)}
          target="_blank" rel="noopener nofollow"
          className="px-4 py-2 rounded-xl bg-amber-400 text-black font-medium hover:bg-amber-300 transition"
        >
          Läs mer
        </a>
      </div>
    </div>
  );
}
