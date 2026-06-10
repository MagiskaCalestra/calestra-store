// apps/store-classic/src/pages/Creators.jsx
import React from "react";
import useReferral from "../hooks/useReferral";
import { getAffiliateSummary } from "../api/infinity";

export default function Creators() {
  const { ref, setRef, clearRef } = useReferral();
  const [sum, setSum] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const baseUrl = `${window.location.origin}/shop?ref=${encodeURIComponent(ref || "yourcode")}`;

  async function load() {
    if (!ref) { setSum(null); return; }
    setLoading(true);
    try {
      const data = await getAffiliateSummary(ref);
      setSum(data || { clicks: 0, orders: 0, amountSEK: 0, points: 0 });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [ref]);

  return (
    <div className="creators container" role="main" aria-labelledby="cr-title">
      <h1 id="cr-title" className="title">Calestra Creatorsâ„¢</h1>
      <p className="lead">
        Dela din länk â€“ få provision i DreamPointsâ„¢ för varje genomförd order.
      </p>

      <div className="card">
        <div className="row">
          <label htmlFor="ref">Din kod</label>
          <input
            id="ref"
            className="input"
            placeholder="t.ex. celeste"
            value={ref}
            onChange={(e) => setRef(e.target.value.trim().toLowerCase())}
          />
          <button className="btn ghost" onClick={clearRef}>Rensa</button>
        </div>

        <div className="row">
          <label>Din länk</label>
          <input className="input" value={baseUrl} readOnly />
          <button className="btn" onClick={() => { navigator.clipboard?.writeText(baseUrl); }}>
            Kopiera
          </button>
        </div>

        <p className="hint">
          Tips: använd koden i bio, stories och QR-posters. Ex: <code>?ref=celeste</code>
        </p>
      </div>

      <div className="card">
        <h2 className="h2">Din statistik</h2>
        {loading && <div className="sk" />}
        {!loading && !sum && <div className="msg">Ange en kod för att se din statistik.</div>}
        {!loading && sum && (
          <ul className="stats">
            <li><span>Klick</span><strong>{(sum.clicks ?? 0).toLocaleString("sv-SE")}</strong></li>
            <li><span>Order</span><strong>{(sum.orders ?? 0).toLocaleString("sv-SE")}</strong></li>
            <li><span>Omsättning (SEK)</span><strong>{(sum.amountSEK ?? 0).toLocaleString("sv-SE")}</strong></li>
            <li><span>Intjänade poäng</span><strong>{(sum.points ?? 0).toLocaleString("sv-SE")}</strong></li>
          </ul>
        )}
      </div>

      <style>{`
        .container{ max-width:900px; margin:0 auto; padding:16px; }
        .title{ font-size:28px; margin:8px 0 8px; }
        .lead{ color:#6B7280; margin-bottom:12px; }
        .card{ background:#fff; border:1px solid #E6EAF0; border-radius:12px; padding:16px; margin:12px 0; }
        .theme-dark .card{ background:#0f1622; border-color:#243041; }
        .row{ display:grid; gap:8px; margin:10px 0; }
        .input{ height:44px; border:1px solid #C9D1DB; border-radius:10px; padding:0 12px; background:#fff; color:#111; }
        .theme-dark .input{ background:#0f1622; color:#e6e7ea; border-color:#243041; }
        .btn{ height:44px; border:0; border-radius:10px; background:#4B6BFA; color:#fff; font-weight:700; padding:0 14px; }
        .btn.ghost{ background:#e8ecff; color:#1b2b6b; }
        .theme-dark .btn.ghost{ background:#1b2236; color:#c6d0ff; }
        .hint{ font-size:12px; color:#6B7280; }
        .stats{ list-style:none; padding:0; margin:0; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .stats li{ background:#f5f7fb; border:1px solid #E6EAF0; border-radius:12px; padding:12px; display:flex; justify-content:space-between; }
        .theme-dark .stats li{ background:#0f1622; border-color:#243041; }
        .sk{ height:52px; border-radius:10px; background:linear-gradient(90deg,#f3f4f6,#e5e7eb,#f3f4f6); background-size:200% 100%; animation:sh 1.2s infinite; }
        .theme-dark .sk{ background:linear-gradient(90deg,#121a27,#1b2537,#121a27); }
        @keyframes sh { 0%{background-position:0 0;} 100%{background-position:200% 0;} }
        .msg{ color:#6B7280; }
      `}</style>
    </div>
  );
}
