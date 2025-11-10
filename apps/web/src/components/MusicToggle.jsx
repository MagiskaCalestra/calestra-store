import React from "react";
import { useMusic } from "../providers/MusicProvider.jsx";

export default function MusicToggle() {
  const music = useMusic();
  if (!music) return null;

  // Text/logik: visa “På” när det faktiskt hörs, annars “Av”
  const label = music.enabled ? "På" : "Av";

  return (
    <div style={{
      position: "fixed", right: 14, bottom: 14, zIndex: 50,
      display: "flex", gap: 8
    }}>
      <button
        className="btn"
        onClick={music.toggle}
        title="Musik på/av"
        style={{ borderRadius: 999, width: 46, height: 46 }}
      >
        ♪ {label}
      </button>
      {music.wanted && (
        <button
          className="btn"
          onClick={music.next}
          title="Nästa låt"
          style={{ borderRadius: 999, width: 46, height: 46 }}
        >
          ⏭
        </button>
      )}
    </div>
  );
}
