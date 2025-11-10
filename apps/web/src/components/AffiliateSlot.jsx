import React from "react";
import { clickTrack } from "@core/AffiliateManager";

/**
 * Visar en säljbar “slot” som du kan erbjuda Google, Temu m.fl.
 * Props:
 *  - title, body, cta, image, url, partner
 */
export default function AffiliateSlot({ title, body, cta, image, url, partner }) {
  return (
    <article className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 hover:bg-white/7 transition">
      <div className="aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
      <div className="p-4">
        <div className="text-xs opacity-60">Partner Slot • {partner}</div>
        <h3 className="text-lg font-medium mt-1">{title}</h3>
        <p className="text-sm opacity-80 mt-1">{body}</p>
        <div className="mt-3">
          <button
            onClick={() => clickTrack(partner, url)}
            className="px-4 py-2 rounded-xl bg-amber-400 text-black font-medium hover:bg-amber-300 transition"
          >
            {cta}
          </button>
        </div>
      </div>
    </article>
  );
}
