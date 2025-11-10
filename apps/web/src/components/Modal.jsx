// apps/web/src/components/Modal.jsx
import React from "react";
export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="m-ol" role="dialog" aria-modal="true" aria-label={title || "Info"}>
      <div className="m-backdrop" onClick={onClose} />
      <div className="m-card">
        <div className="m-head">
          <strong>{title}</strong>
          <button className="m-x" onClick={onClose} aria-label="Stäng">×</button>
        </div>
        <div className="m-body">{children}</div>
        {footer ? <div className="m-foot">{footer}</div> : null}
      </div>
      <style>{`
        .m-ol{ position:fixed; inset:0; display:grid; place-items:center; z-index:70; }
        .m-backdrop{ position:absolute; inset:0; background:rgba(0,0,0,.5); }
        .m-card{ position:relative; width:min(560px, 92vw); background:#0f1623; color:#e7ebf2;
                 border:1px solid #263043; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,.45); }
        .m-head{ display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid #222c3c; }
        .m-body{ padding:16px; line-height:1.6; }
        .m-foot{ padding:12px 16px; border-top:1px solid #222c3c; display:flex; gap:8px; justify-content:flex-end; }
        .m-x{ background:transparent; border:none; color:#b5c0d0; font-size:22px; cursor:pointer; }
      `}</style>
    </div>
  );
}
