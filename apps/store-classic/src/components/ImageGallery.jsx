import { useEffect, useMemo, useRef, useState } from "react";

export default function ImageGallery({
  images = [],
  alt = "",
  soundSrc,              // valfritt: liten â€œhoverâ€-ljud
  startIndex = 0
}) {
  const [index, setIndex] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef(null);

  const safeImages = useMemo(() => (Array.isArray(images) ? images : []).filter(Boolean), [images]);

  useEffect(() => {
    // pre-load current, previous, next för mjukare navigering
    const toPreload = [index - 1, index, index + 1]
      .map(i => safeImages[(i + safeImages.length) % safeImages.length]);
    toPreload.forEach(src => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    });
  }, [index, safeImages]);

  function prev() {
    setIndex(i => (i - 1 + safeImages.length) % safeImages.length);
    ping();
  }
  function next() {
    setIndex(i => (i + 1) % safeImages.length);
    ping();
  }
  function select(i) {
    setIndex(i);
    ping();
  }
  function ping() {
    if (muted) return;
    const a = audioRef.current;
    if (a) {
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  }

  if (!safeImages.length) return null;

  return (
    <div className="gallery">
      {soundSrc && (
        <audio ref={audioRef} src={soundSrc} preload="auto" />
      )}

      <div className="hero-wrap">
        <button className="nav left" aria-label="Föregående bild" onClick={prev}>â€¹</button>

        <figure className="hero">
          <img
            key={safeImages[index]}
            src={safeImages[index]}
            alt={alt}
            className="zoomable"
            loading="eager"
          />
        </figure>

        <button className="nav right" aria-label="Nästa bild" onClick={next}>â€º</button>
      </div>

      <div className="thumbs" role="listbox" aria-label="Galleri thumbnails">
        {safeImages.map((src, i) => (
          <button
            key={src + i}
            className={`thumb ${i === index ? "active" : ""}`}
            onClick={() => select(i)}
            aria-label={`Visa bild ${i + 1}`}
          >
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>

      {soundSrc && (
        <div className="sound-toggle">
          <label>
            <input
              type="checkbox"
              checked={!muted}
              onChange={() => setMuted(m => !m)}
            />
            <span>{muted ? "ðŸ”‡" : "ðŸ”Š"} Ljud</span>
          </label>
        </div>
      )}
    </div>
  );
}
