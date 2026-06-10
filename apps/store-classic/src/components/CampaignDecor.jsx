import React from "react";

/**
 * Visuellt pynt ovanpå sidan. Lättvikts-DOM + CSS keyframes.
 * Renderas fixed överst, pek-genomsläppligt (pointer-events: none).
 */
export default function CampaignDecor({ campaign }) {
  const key = campaign?.key || "standard";

  // generera få, prestandasnåla partiklar
  const [nodes] = React.useState(() => {
    const arr = [];
    const count = key === "xmas" ? 30
      : key === "valentine" ? 24
      : key === "blackweek" ? 20
      : key === "midsummer" ? 18
      : key === "newyear" ? 26
      : 0;
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        left: Math.random() * 100,          // vw
        delay: Math.random() * 5,           // s
        dur: 6 + Math.random() * 6,         // s
        size: 8 + Math.round(Math.random() * 10),
        drift: (Math.random() - 0.5) * 40,  // px
      });
    }
    return arr;
  });

  if (!nodes.length) return null;

  return (
    <div className={`camp-decor camp-${key}`} aria-hidden>
      {nodes.map(n => (
        <span
          key={n.id}
          className="flake"
          style={{
            left: `${n.left}vw`,
            animationDelay: `${n.delay}s`,
            animationDuration: `${n.dur}s`,
            width: n.size, height: n.size,
            "--drift": `${n.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
