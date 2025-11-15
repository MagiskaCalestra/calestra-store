// apps/web/src/hooks/useParallax.js
import { useEffect, useRef, useState } from "react";

/**
 * Enkel, GPU-snäll parallax som manipulerar ett lager med translate3d.
 * strength: 0..1 (0.15â€“0.25 känns lagom)
 */
export default function useParallax({ strength = 0.2 } = {}) {
  const containerRef = useRef(null);
  const [styleLayer, setStyleLayer] = useState({});

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const mx = (e.clientX - cx) / rect.width;
      const my = (e.clientY - cy) / rect.height;

      const tx = Math.max(Math.min(mx * strength * -40, 30), -30);
      const ty = Math.max(Math.min(my * strength * -40, 30), -30);

      setStyleLayer({
        transform: `translate3d(${tx}px, ${ty}px, 0) scale(1.02)`,
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [strength]);

  return { containerRef, styleLayer };
}
