// apps/web/src/components/GlowDust.jsx
import React, { useEffect, useRef } from "react";

/** Långsamma glödpartiklar i hero-området. */
export default function GlowDust({ count = 24 }) {
  const ref = useRef(null);
  const raf = useRef(0);

  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext("2d");
    let w = c.width = c.clientWidth;
    let h = c.height = c.clientHeight;
    const onResize = () => { w = c.width = c.clientWidth; h = c.height = c.clientHeight; };

    const dots = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.55,
      r: 0.8 + Math.random() * 2.2,
      vx: 0.18 + Math.random() * 0.35,
      tw: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0,0,w,h);
      for (const d of dots) {
        d.tw += 0.02;
        const pulse = 0.7 + Math.sin(d.tw) * 0.3;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180, 196, 255, 0.9)";
        ctx.globalAlpha = 0.12 * pulse;
        ctx.fill();
        ctx.globalAlpha = 1;
        d.x += d.vx;
        if (d.x > w + 6) { d.x = -6; d.y = Math.random() * h * 0.55; }
      }
      raf.current = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(c);
    draw();
    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, [count]);

  return (
    <canvas
      ref={ref}
      className="glowdust"
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
      aria-hidden
    />
  );
}
