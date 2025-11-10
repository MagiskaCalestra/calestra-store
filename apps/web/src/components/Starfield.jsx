// apps/web/src/components/Starfield.jsx
import React, { useEffect, useRef } from "react";

export default function Starfield({ density = 80, speed = 0.06 }) {
  const ref = useRef(null);
  const raf = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let w = canvas.width = canvas.clientWidth;
    let h = canvas.height = canvas.clientHeight;

    const onResize = () => {
      w = canvas.width = canvas.clientWidth;
      h = canvas.height = canvas.clientHeight;
    };
    const stars = Array.from({ length: density }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.2,
      tw: Math.random() * Math.PI * 2
    }));

    const draw = () => {
      ctx.clearRect(0,0,w,h);
      for (const s of stars) {
        s.tw += 0.02;
        const pulse = 0.65 + Math.sin(s.tw) * 0.35;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180, 196, 255, 0.9)";
        ctx.globalAlpha = 0.45 * pulse;
        ctx.fill();
        ctx.globalAlpha = 1;
        s.y += speed;
        if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; }
      }
      raf.current = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    draw();

    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, [density, speed]);

  return (
    <canvas
      ref={ref}
      className="starfield"
      style={{position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none"}}
      aria-hidden
    />
  );
}
