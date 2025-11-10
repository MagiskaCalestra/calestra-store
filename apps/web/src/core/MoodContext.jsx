// apps/web/src/core/MoodContext.jsx
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const MoodContext = createContext(null);

/**
 * Mood keys (sv): "stillhet", "glädje", "äventyr", "kärlek"
 * Exponeras även som engelska alias i UI om du vill (valfritt).
 */
const MOODS = {
  stillhet: {
    key: "stillhet",
    hue: 210,
    bg: "linear-gradient(180deg, rgba(10,18,31,0.85) 0%, rgba(12,18,26,0.95) 100%)",
    accent: "#7dd3fc",
    label: "Stillhet",
  },
  glädje: {
    key: "glädje",
    hue: 48,
    bg: "linear-gradient(180deg, rgba(34,24,2,0.88) 0%, rgba(49,35,2,0.96) 100%)",
    accent: "#facc15",
    label: "Glädje",
  },
  äventyr: {
    key: "äventyr",
    hue: 162,
    bg: "linear-gradient(180deg, rgba(1,23,18,0.86) 0%, rgba(2,33,27,0.96) 100%)",
    accent: "#34d399",
    label: "Äventyr",
  },
  kärlek: {
    key: "kärlek",
    hue: 332,
    bg: "linear-gradient(180deg, rgba(34,2,22,0.86) 0%, rgba(39,2,24,0.96) 100%)",
    accent: "#fb7185",
    label: "Kärlek",
  },
};

export function MoodProvider({ children }) {
  const [mood, setMood] = useState(() => {
    const saved = localStorage.getItem("cw:mood");
    return saved && MOODS[saved] ? saved : "stillhet";
  });

  useEffect(() => {
    localStorage.setItem("cw:mood", mood);
    // Sätt dataset-attribut för CSS hooks (t.ex. [data-mood="glädje"])
    document.documentElement.setAttribute("data-mood", mood);
  }, [mood]);

  const value = useMemo(
    () => ({
      mood,
      setMood,
      moods: MOODS,
      theme: MOODS[mood],
    }),
    [mood]
  );

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood must be used within MoodProvider");
  return ctx;
}
