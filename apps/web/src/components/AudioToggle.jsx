// apps/web/src/components/AudioToggle.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Visar en enkel ljudtoggle (på/av) och spelar en ambient bakgrundston.
 * Ljudfil: lägg valfritt MP3 i /public/audio/harmonic-star.mp3 (frivilligt).
 * Om fil saknas (404) fortsätter allt utan fel.
 */
export default function AudioToggle() {
  const [enabled, setEnabled] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("/audio/harmonic-star.mp3"); // public-path
    audioRef.current.loop = true;
    audioRef.current.volume = 0.25;

    const onRequestStart = async () => {
      try {
        if (!enabled) {
          await audioRef.current.play();
          setEnabled(true);
        }
      } catch { /* ignorera t.ex. 404 eller autoplay-begränsningar */ }
    };
    window.addEventListener("cw.audio.requestStart", onRequestStart);
    return () => window.removeEventListener("cw.audio.requestStart", onRequestStart);
  }, [enabled]);

  const toggle = async () => {
    if (!audioRef.current) return;
    try {
      if (enabled) {
        audioRef.current.pause();
        setEnabled(false);
      } else {
        await audioRef.current.play();
        setEnabled(true);
      }
    } catch { /* ignorera */ }
  };

  return (
    <button className={"audio "+(enabled?"on":"off")} onClick={toggle} aria-label="Ljudkontroll">
      {enabled ? "🔊" : "🔈"}
      <style>{`
        .audio {
          position: fixed; right: 14px; bottom: 14px; z-index: 50;
          padding: 8px 10px; border-radius: 12px; border:1px solid #2b315e;
          background:#0f1430; color:#e8ecff; cursor:pointer;
        }
        .audio.on { box-shadow: 0 0 10px #2c3aa088; }
      `}</style>
    </button>
  );
}
