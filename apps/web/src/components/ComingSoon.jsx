import React from "react";

/**
 * ComingSoon
 * En snygg, återanvändbar â€œunder utvecklingâ€-panel med systemstatus.
 * - title: rubrik
 * - lead: kort förklaring
 * - primaryHref: primär knapp (t.ex. hem)
 * - secondaryHref: sekundär knapp (t.ex. butik)
 */
export default function ComingSoon({ label = "Coming soon" }) {
  return (
    <div className="px-6 py-10 text-center">
      <h2 className="text-2xl font-semibold">{label}</h2>
      <p className="opacity-70 mt-2">Detta område är på väg in. âœ¨</p>
    </div>
  );
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
