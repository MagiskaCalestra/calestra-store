// D:\WebProjects\Calestra\apps\store-classic\src\components\SoundToggle.jsx

import React from "react";
import { useTranslation } from "react-i18next";
import { useSound } from "../context/SoundContext.jsx";

export default function SoundToggle() {
  const { t } = useTranslation();
  const { muted, toggle } = useSound();

  const label = muted
    ? t("sound.off", "Ljud av")
    : t("sound.on", "Ljud på");

  const title = muted
    ? t("sound.turnOn", "Sätt på butiksmusik")
    : t("sound.turnOff", "Stäng av butiksmusik");

  return (
    <button
      className="btn sm sound-toggle"
      aria-label={label}
      aria-pressed={!muted}
      onClick={toggle}
      title={title}
      type="button"
      style={{
        minHeight: 34,
        minWidth: 42,
        borderRadius: 999,
        border: muted
          ? "1px solid rgba(255,255,255,.12)"
          : "1px solid rgba(185,215,255,.42)",
        background: muted
          ? "transparent"
          : "linear-gradient(135deg, rgba(185,215,255,.18), rgba(241,220,167,.10))",
        boxShadow: muted ? "none" : "0 0 18px rgba(127,180,255,.16)",
      }}
    >
      {muted ? "🔇" : "🎵"}
    </button>
  );
}