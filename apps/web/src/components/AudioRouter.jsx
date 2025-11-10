// Calestra — AudioRouter (hel fil)
// Växlar musikkanal efter route och visar musikknapp.

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAudio } from "../core/audio/AudioManager";

export default function AudioRouter() {
  const { pathname } = useLocation();
  const mgr = getAudio();
  const [enabled, setEnabled] = useState(mgr.enabled);

  useEffect(() => {
    if (pathname.startsWith("/store")) mgr.setChannel("store");
    else mgr.setChannel("default");
  }, [pathname]);

  useEffect(() => {
    setEnabled(mgr.enabled);
  }, [mgr.enabled]);

  const toggle = () => {
    mgr.toggle();
    setEnabled(mgr.enabled);
  };

  return (
    <div className="audio-toggle">
      <button
        className={`btn-audio ${enabled ? "on" : "off"}`}
        aria-pressed={enabled}
        aria-label={enabled ? "Stäng av musik" : "Sätt på musik"}
        onClick={toggle}
      >
        ♪ Musik {enabled ? "på" : "av"}
      </button>
    </div>
  );
}
