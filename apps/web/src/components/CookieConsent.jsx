import React, { useEffect, useState } from "react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("cookie-ok")) setShow(true);
  }, []);
  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm text-white bg-[#0b0e13]/85 backdrop-blur p-4 rounded-xl ring-1 ring-white/10 shadow-2xl">
      <div className="text-sm">
        Vi använder cookies för analys och förbättrad upplevelse.
        Läs mer i vår <a className="underline" href="/policy">policy</a>.
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button
          className="px-3 py-1 rounded-lg bg-amber-400 text-black font-medium"
          onClick={() => { localStorage.setItem("cookie-ok","1"); setShow(false); }}
        >
          OK
        </button>
        <button
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15"
          onClick={() => setShow(false)}
        >
          Endast nödvändiga
        </button>
      </div>
    </div>
  );
}
