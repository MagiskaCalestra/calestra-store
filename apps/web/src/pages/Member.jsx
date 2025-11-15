import React, { useMemo } from "react";
import { getAffiliateId } from "@core/AffiliateManager";

export default function Member() {
  const ref = getAffiliateId();
  const creators = useMemo(()=>JSON.parse(localStorage.getItem("creators")||"[]"),[]);
  const orders = useMemo(()=>JSON.parse(localStorage.getItem("orders")||"[]"),[]); // mock från butik

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">
      <h1 className="text-2xl font-semibold">Min sida</h1>

      <div className="mt-6 grid md:grid-cols-3 gap-6">
        <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
          <h2 className="text-lg font-semibold">Konto</h2>
          <p className="text-sm opacity-80 mt-1">Inlogg: lokal mock (ingen backend ännu).</p>
          <div className="mt-3 text-sm">
            <div className="opacity-70">Ref-kod i bruk:</div>
            <div className="mt-1 p-2 rounded bg-black/40 ring-1 ring-white/10">{ref || "â€”"}</div>
            <div className="opacity-70 mt-3">Delningslänk:</div>
            <div className="mt-1 p-2 rounded bg-black/40 ring-1 ring-white/10">
              {ref ? `${window.location.origin}/?ref=${ref}` : "â€”"}
            </div>
          </div>
          <div className="mt-4">
            <a className="px-4 py-2 rounded-xl bg-amber-400 text-black font-medium" href="/creator">Bli Ambassadör</a>
          </div>
        </section>

        <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
          <h2 className="text-lg font-semibold">DreamPointsâ„¢</h2>
          <p className="text-sm opacity-80 mt-1">Poängsystem mock (v1). Uppdateras efter lansering.</p>
          <div className="mt-3 text-3xl font-bold">320</div>
          <div className="text-xs opacity-60 mt-1">* demo â€“ ej bindande saldo</div>
        </section>

        <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
          <h2 className="text-lg font-semibold">Mina beställningar</h2>
          {orders.length === 0 ? (
            <p className="text-sm opacity-70 mt-2">Inga beställningar ännu.</p>
          ) : (
            <ul className="mt-2 text-sm opacity-90 space-y-1">
              {orders.map(o => <li key={o.id}>#{o.id} â€¢ {o.total} â€¢ {o.date}</li>)}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
        <h2 className="text-lg font-semibold">Creator-konton (lokalt skapade)</h2>
        {creators.length===0 ? (
          <p className="text-sm opacity-70 mt-2">Inga skapade ännu.</p>
        ) : (
          <ul className="mt-2 grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm opacity-90">
            {creators.map(c => (
              <li key={c.id} className="p-2 rounded bg-black/40 ring-1 ring-white/10">
                {c.name} â€” <span className="opacity-70">{c.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
