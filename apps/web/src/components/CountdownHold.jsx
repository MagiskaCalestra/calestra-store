import React, { useEffect, useState } from "react";

/**
 * Visar mm:ss till hold-expiration.
 * Props:
 *  - expiresAt (ms epoch)
 *  - onExpire(): callback när tiden är slut
 */
export default function CountdownHold({ expiresAt, onExpire }) {
  const [left, setLeft] = useState(Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, expiresAt - Date.now());
      setLeft(ms);
      if (ms <= 0 && onExpire) onExpire();
    };
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  const totalSec = Math.ceil(left / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");

  return (
    <div className="hold-timer">
      <span className="dot" aria-hidden />
      Hållning aktiv – släpper om <strong>{mm}:{ss}</strong>
      <style>{`
        .hold-timer { display:flex; align-items:center; gap:8px; 
          background:rgba(26,32,64,.85); border:1px solid #2c3aa0; color:#e8ecff;
          padding:10px 12px; border-radius:12px; }
        .dot { width:10px; height:10px; border-radius:50%; background:#ffd166; box-shadow:0 0 10px #ffd166; }
      `}</style>
    </div>
  );
}
