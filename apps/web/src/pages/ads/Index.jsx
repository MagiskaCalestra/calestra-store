import React, { useState } from "react";

/**
 * Ads/Index
 * - Sälj in ytor vi äger (house ads) + â€œförfråganâ€ i mock-läge
 * - Paket: Hero, Spotlight, Sidebar, Footer-strip
 */

const PACKS = [
  { id: "hero",    name: "Hero Premium", desc: "Toppen på startsidan (stor enhet).", price: "fr. 25 000 SEK/vecka" },
  { id: "spot",    name: "Spotlight",    desc: "Partner Spotlight (roterande modul).", price: "fr. 12 000 SEK/vecka" },
  { id: "sidebar", name: "Sidebar",      desc: "Sekundära sidor â€“ hög synlighet.",    price: "fr. 6 000 SEK/vecka" },
  { id: "footer",  name: "Footer Strip", desc: "Logoremsa â€“ stora varumärken.",       price: "fr. 4 000 SEK/vecka" },
];

export default function AdsIndex(){
  const [ok, setOk] = useState(false);
  const [f, setF] = useState({ org: "", email: "", pack: "hero", msg: "" });

  function submit(e){
    e.preventDefault();
    setTimeout(()=>setOk(true), 400);
    // TODO: POST /api/ads/request
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold">Annons & samarbeten</h1>
      <p className="mt-2 opacity-80">
        Nå vår publik med varumärkesbyggande och konverterande placeringar. Vi erbjuder kreativ guidning och rapportering.
      </p>

      <section className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PACKS.map(p => (
          <div key={p.id} className="rounded-2xl ring-1 ring-white/10 bg-white/5 p-5">
            <div className="text-sm opacity-70">Paket</div>
            <div className="text-lg font-medium">{p.name}</div>
            <div className="mt-1 opacity-90">{p.desc}</div>
            <div className="mt-2 text-sm opacity-80">{p.price}</div>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl ring-1 ring-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium">Förfrågan</h2>
        {!ok ? (
          <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={submit}>
            <input className="h-11 rounded-xl bg-black/30 ring-1 ring-white/10 px-3"
                   placeholder="Företag" value={f.org} onChange={e=>setF({...f, org:e.target.value})}/>
            <input type="email" className="h-11 rounded-xl bg-black/30 ring-1 ring-white/10 px-3"
                   placeholder="E-post" value={f.email} onChange={e=>setF({...f, email:e.target.value})}/>
            <select className="h-11 rounded-xl bg-black/30 ring-1 ring-white/10 px-3"
                    value={f.pack} onChange={e=>setF({...f, pack:e.target.value})}>
              {PACKS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <textarea rows={4} className="rounded-xl bg-black/30 ring-1 ring-white/10 px-3 py-2 md:col-span-2"
                      placeholder="Meddelande / mål / period" value={f.msg} onChange={e=>setF({...f, msg:e.target.value})}/>
            <div className="md:col-span-2">
              <button className="px-5 py-3 rounded-xl bg-amber-400 text-black font-medium hover:bg-amber-300 transition">
                Skicka förfrågan
              </button>
              <div className="text-xs opacity-60 mt-1">*Mock-läge: vi bekräftar direkt på sidan.</div>
            </div>
          </form>
        ) : (
          <div className="text-emerald-300">Tack! Vi återkommer med offert och lediga veckor.</div>
        )}
      </section>
    </main>
  );
}
