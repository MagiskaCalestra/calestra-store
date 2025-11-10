import React from "react";

/**
 * ComingSoon
 * En snygg, återanvändbar “under utveckling”-panel med systemstatus.
 * - title: rubrik
 * - lead: kort förklaring
 * - primaryHref: primär knapp (t.ex. hem)
 * - secondaryHref: sekundär knapp (t.ex. butik)
 */
export default function ComingSoon({
  title = "Den här delen är på väg ✨",
  lead = "Vi bygger klart funktionen. Under tiden kan du fortsätta upptäcka Calestra World.",
  primaryHref = "/",
  primaryLabel = "Till startsidan",
  secondaryHref = "/store",
  secondaryLabel = "Gå till butiken",
  status = { ok: true, mock: true, status: 200 },
}) {
  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-2xl p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 opacity-80">{lead}</p>

        <div className="mt-4 flex gap-3">
          <a
            href={primaryHref}
            className="px-4 py-2 rounded-xl bg-amber-400 text-black font-medium hover:bg-amber-300 transition"
          >
            {primaryLabel}
          </a>
          <a
            href={secondaryHref}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
          >
            {secondaryLabel}
          </a>
        </div>

        <div className="mt-6">
          <div className="text-xs uppercase tracking-wide opacity-60 mb-2">
            Systemstatus
          </div>
          <pre className="text-sm rounded-xl bg-black/40 ring-1 ring-white/10 p-3 overflow-auto">
{JSON.stringify(status, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
