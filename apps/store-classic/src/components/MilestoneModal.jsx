// apps/store-classic/src/components/MilestoneModal.jsx
import React from "react";

export default function MilestoneModal({ open, onClose, title, body }) {
  if (!open) return null;

  return (
    <div className="ms-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ms-head">
          <h3>{title}</h3>
          <button className="ms-x" onClick={onClose} aria-label="Stäng">Ã—</button>
        </div>
        <div className="ms-body">
          <p>{body}</p>
        </div>
      </div>

      <style>{`
        .ms-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:2000}
        .ms-modal{width:min(560px,92vw);background:var(--c-card,#fff);color:inherit;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.35);padding:16px 16px 18px}
        .ms-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .ms-head h3{margin:0;font-size:18px}
        .ms-x{border:0;background:transparent;font-size:24px;line-height:1;cursor:pointer;opacity:.8}
        .ms-body{margin-top:8px;font-size:14px;opacity:.95}
        @media (prefers-color-scheme: dark){
          .ms-modal{background:#0f172a}
        }
      `}</style>
    </div>
  );
}
