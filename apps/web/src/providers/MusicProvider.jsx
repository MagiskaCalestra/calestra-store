import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState,
} from "react";

const MusicCtx = createContext(null);
export const useMusic = () => useContext(MusicCtx);

// Lägg dina filer i /public/audio/
const PLAYLIST = [
  "/audio/cw_theme_main.mp3",
  "/audio/cw_theme_arrival.mp3",
];

// Utilities
const once = (el, type, handler, opts) => {
  const fn = (e) => {
    el.removeEventListener(type, fn, opts);
    handler(e);
  };
  el.addEventListener(type, fn, opts);
};

export default function MusicProvider({ children }) {
  const audioRef = useRef(null);

  // Användarens preferens (sparas)
  const [wanted, setWanted] = useState(() => {
    const saved = localStorage.getItem("cw.music.enabled");
    return saved ? saved === "true" : true; // default: vill ha musik
  });

  // Faktiskt läge
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);

  // skapa / byt källa
  useEffect(() => {
    const a = new Audio();
    a.loop = false;
    a.preload = "auto";
    a.src = PLAYLIST[index % PLAYLIST.length];
    a.muted = true;          // autoplay-workaround
    a.volume = 1;
    a.addEventListener("ended", () => setIndex((i) => (i + 1) % PLAYLIST.length));
    a.addEventListener("canplaythrough", () => setReady(true));
    audioRef.current = a;

    // Försök autostarta muted (tillåtet av de flesta browsers)
    a.play().catch(() => { /* ignore – vi väntar på gest */ });

    // På första mänskliga gesten – slå på ljud om användaren vill ha musik
    const arm = () => {
      const el = audioRef.current;
      if (!el) return;
      if (wanted) {
        el.muted = false;
        setMuted(false);
        el.play().catch(() => {});
      }
    };
    once(window, "pointerdown", arm, { passive: true });
    once(window, "keydown", arm, { passive: true });
    once(window, "touchstart", arm, { passive: true });
    once(window, "wheel", arm, { passive: true });

    return () => {
      a.pause();
      a.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Reagera på ändrad preferens
  useEffect(() => {
    localStorage.setItem("cw.music.enabled", wanted ? "true" : "false");
    const a = audioRef.current;
    if (!a) return;
    if (wanted) {
      // om vi redan är redo: spela (om policy kräver, blir det muted tills gest)
      if (ready) a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [wanted, ready]);

  const audible = useMemo(() => {
    const a = audioRef.current;
    if (!a) return false;
    return wanted && !a.muted && !a.paused && a.currentTime >= 0;
  }, [wanted, muted, ready, index]); // muted ändras via setMuted

  // Håll muted state i synk när vi avmutas via knapp
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    setMuted(a.muted);
  }, [ready, wanted]);

  const api = useMemo(() => ({
    enabled: audible,          // hörbart just nu
    wanted,                    // användarens val
    toggle: async () => {
      const a = audioRef.current;
      if (!a) {
        setWanted((w) => !w);
        return;
      }
      if (wanted) {
        // slå av
        a.pause();
        setWanted(false);
      } else {
        // slå på
        setWanted(true);
        a.muted = false;
        setMuted(false);
        try { await a.play(); } catch { /* ignore */ }
      }
    },
    next: async () => {
      setIndex((i) => (i + 1) % PLAYLIST.length);
    },
  }), [audible, wanted]);

  return <MusicCtx.Provider value={api}>{children}</MusicCtx.Provider>;
}
