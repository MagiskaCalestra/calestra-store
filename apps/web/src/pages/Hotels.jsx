import React from "react";
import ComingSoon from "@components/ComingSoon";

/**
 * Hotels (placeholder v1)
 * - Hero-rubrik
 * - Tre kort med “kommer snart” (skelettons)
 * - ComingSoon-panel längst ner för tydlig kommunikation
 */
export default function Hotels() {
  const cards = [
    {
      title: "Calestra Amoré Hotel™",
      body: "Romantisk signatur med kvällskonserter och sjöutsikt.",
    },
    {
      title: "Harmonic Star Residences",
      body: "Premium-lägenheter kopplade till parken och spa.",
    },
    {
      title: "Tomorrowvale Lodge",
      body: "Futuristisk design, familjevänligt och nära attraktioner.",
    },
  ];

  return (
    <main
      className="text-white"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(20,65,115,.28), transparent 60%), radial-gradient(1200px 600px at 80% -10%, rgba(120,60,150,.25), transparent 60%)",
      }}
    >
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-4 md:pt-16">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Hotell</h1>
        <p className="mt-2 opacity-85 max-w-2xl">
          Våra hotell öppnar stegvis. Du kan redan nu planera din resa och
          förhandsboka paket när de släpps.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-10 md:pb-14">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {cards.map((c, i) => (
            <article
              key={i}
              className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 hover:bg-white/7 transition"
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-white/10 to-white/0 animate-pulse" />
              <div className="p-4">
                <div className="text-sm opacity-70">Kommer snart</div>
                <h3 className="text-lg font-medium mt-1">{c.title}</h3>
                <p className="text-sm opacity-80 mt-1">{c.body}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="px-3 py-2 rounded-xl bg-white/10 ring-1 ring-white/10 opacity-60 cursor-not-allowed"
                    title="Inte tillgängligt ännu"
                  >
                    Visa detaljer
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl bg-white/10 ring-1 ring-white/10 opacity-60 cursor-not-allowed"
                    title="Inte tillgängligt ännu"
                  >
                    Förhandsboka
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <ComingSoon
          title="Hotellbokning lanseras snart"
          lead="Vi lägger till rumstyper, datum och paket med C-Wish™-förmåner. Anmäl intresse i butiken så får du e-post när bokningen öppnar."
          primaryHref="/"
          primaryLabel="Planera resa"
          secondaryHref="/store"
          secondaryLabel="Visa butik"
          status={{ ok: true, feature: "hotels", mock: true, status: 200 }}
        />
      </section>
    </main>
  );
}
