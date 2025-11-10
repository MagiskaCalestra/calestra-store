import React from "react";
import PARTNERS from "@data/partners";

export default function PartnerStrip() {
  return (
    <div className="mt-12 pt-8 pb-10 bg-[#0a0f16] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-6">
        {PARTNERS.map(p => (
          <div key={p.slug} className="text-center opacity-80">
            <div className="text-sm">{p.tagline}</div>
            <div className="font-semibold">{p.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
