import React from "react";
import { PARTNERS, pickWeighted, withTracking } from "@data/partners";

/**
 * AdSlot
 * - Visar antingen en partner (med tracking) eller "Köp denna yta" (house ad).
 * - props:
 *    slot: "hero" | "mid" | "sidebar" | "footer"
 *    mode: "partner" | "house" | "auto" (default auto)
 *    partnerId?: visa specifik partner om önskas
 */

export default function AdSlot({ slot = "mid", mode = "auto", partnerId }) {
  let partner = null;

  if (mode === "partner" || mode === "auto") {
    partner = partnerId
      ? PARTNERS.find(p => p.id === partnerId)
      : pickWeighted(PARTNERS);
  }

  const isHouse = mode === "house" || !partner;

  if (isHouse) {
    // Egen säljannons för slottar
    return (
      <a href="/ads" className="block rounded-2xl ring-1 ring-white/10 bg-gradient-to-r from-amber-400/15 to-amber-300/10 hover:from-amber-400/25 hover:to-amber-300/20 transition p-5">
        <div className="text-sm opacity-70">Annonsyta</div>
        <div className="text-lg font-medium">Köp denna plats â€“ nå Calestras publik</div>
        <div className="text-sm opacity-80 mt-1">Premiumplacering â€¢ Rapportering â€¢ Kreativ assistans</div>
      </a>
    );
  }

  // Partner-annons
  return (
    <a
      href={withTracking(partner.url, partner.id)}
      target="_blank"
      rel="noopener nofollow"
      className="block rounded-2xl ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition p-5"
      aria-label={`Partner: ${partner.label}`}
    >
      <div className="flex items-center gap-3">
        {/* Logo (frivillig) */}
        <div className="w-10 h-10 rounded bg-white/90 flex items-center justify-center overflow-hidden">
          {partner.logo ? <img src={partner.logo} alt="" className="w-full h-full object-contain"/> : <span className="text-black text-sm">{partner.name[0]}</span>}
        </div>
        <div>
          <div className="text-sm opacity-70">Partner</div>
          <div className="text-lg font-medium">{partner.label}</div>
          {partner.note && <div className="text-sm opacity-80">{partner.note}</div>}
        </div>
      </div>
    </a>
  );
}
