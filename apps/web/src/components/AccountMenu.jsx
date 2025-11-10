import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../core/AuthContext";

function useOutside(ref, onAway) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onAway?.(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, onAway]);
}

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));

  const initials = user?.name?.split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase() || "IJ";

  // ⬇️ Byt "Mitt konto" → "InnerJourney" som defaultetikett
  const label = user ? user.name : "InnerJourney";

  return (
    <div className="acct" ref={ref}>
      <button className="pill" aria-haspopup="true" aria-expanded={open} onClick={()=>setOpen(v=>!v)} title="Min Calestra inre resa">
        <span className="avatar">{initials}</span>
        <span className="label">{label}</span>
      </button>

      {open && (
        <div className="menu" role="menu" aria-label="Profil och genvägar">
          {user ? (
            <>
              <div className="hi">Hej, <strong>{user.name}</strong></div>
              <Link to="/innerjourney" className="item">Min inre resa</Link>
              <Link to="/account/orders" className="item">Mina beställningar</Link>
              <Link to="/plan" className="item">Min resa & kalender</Link>
              <Link to="/wish" className="item">C-Wish</Link>
              <button className="item" onClick={logout}>Logga ut</button>
            </>
          ) : (
            <>
              <div className="hi">Välkommen!</div>
              <Link to="/innerjourney" className="item">Min inre resa</Link>
              <Link to="/account/orders" className="item">Mina beställningar</Link>
              <Link to="/plan" className="item">Planera besök</Link>
              <div className="hr" />
              <button className="cta">Skapa konto</button>
              <button className="ghost">Logga in</button>
            </>
          )}
        </div>
      )}

      <style>{`
        .acct { position:relative; }
        .pill { display:flex; align-items:center; gap:8px; background:#0f1430; border:1px solid #2b315e; color:#e8ecff; border-radius:999px; padding:4px 10px; }
        .avatar { width:22px; height:22px; border-radius:50%; background:#1e254b; display:inline-flex; align-items:center; justify-content:center; font-size:.8rem; }
        .menu { position:absolute; right:0; top:calc(100% + 6px); min-width:220px; background:#0b0f25; border:1px solid #2b315e; border-radius:12px; padding:8px; box-shadow:0 10px 30px rgba(0,0,0,.4); }
        .hi { padding:8px 10px; color:#dbe2ff; }
        .item { display:block; padding:8px 10px; color:#dbe2ff; text-decoration:none; border-radius:8px; }
        .item:hover { background:#161a30; }
        .hr { height:1px; background:#2b315e; margin:6px 8px; }
        .cta { width:100%; padding:8px 10px; border-radius:10px; border:1px solid #2c3aa0; background:linear-gradient(180deg,#1c2a80,#13205e); color:#fff; margin-top:6px; }
        .ghost { width:100%; padding:8px 10px; border-radius:10px; border:1px solid #2b315e; background:transparent; color:#dbe2ff; margin-top:6px; }
        @media (max-width: 980px) { .menu { position:static; margin-top:8px; } }
      `}</style>
    </div>
  );
}
