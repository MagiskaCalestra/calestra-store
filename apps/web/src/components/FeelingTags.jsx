import React, { useState } from "react";

const FEELINGS = [
  { key: "stillhet", label: "Stillhet" },
  { key: "gladje",   label: "Glädje" },
  { key: "aventyr",  label: "Äventyr" },
  { key: "karlek",   label: "Kärlek" },
];

export default function FeelingTags({ onChange }) {
  const [active, setActive] = useState(null);

  function setF(k) {
    const next = active === k ? null : k;
    setActive(next);
    onChange?.(next);
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {FEELINGS.map(f => (
        <button
          key={f.key}
          onClick={() => setF(f.key)}
          className={`feeling-tag ${active===f.key ? "active" : ""}`}
          aria-pressed={active===f.key}
        >
          {f.label}
        </button>
      ))}
      <style>{`
        .feeling-tag{
          display:inline-flex;align-items:center;justify-content:center;
          border-radius:999px;padding:.5rem 1rem;
          background:linear-gradient(180deg,#1a1d28,#12141b);
          border:1px solid rgba(255,255,255,.12);
          color:#e9eefb; font-weight:600; font-size:.95rem;
          letter-spacing:.2px; cursor:pointer; transition:all .18s ease;
          box-shadow: inset 0 0 0 0 rgba(111,164,255,.4);
        }
        .feeling-tag:hover{
          transform:translateY(-1px);
          box-shadow: inset 0 0 24px 2px rgba(111,164,255,.18),
                      0 0 10px rgba(111,164,255,.18);
        }
        .feeling-tag.active{
          background:linear-gradient(180deg,#6fa4ff,#3a6fff);
          color:#0b0e13; border-color:transparent;
          box-shadow:0 6px 22px rgba(80,130,255,.35);
        }
      `}</style>
    </div>
  );
}
