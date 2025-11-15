import React from "react";
import data from "../data/dining.json";

export default function Dining() {
  return (
    <section className="page dining">
      <div className="wrap">
        <h1>Mat & Restaurang</h1>
        <p className="lead">Snabbmat, cafÃ©er och bokningsbara restauranger â€“ Calestra TableMagicâ„¢ kommer här.</p>

        <ul className="grid">
          {data.map((r) => (
            <li key={r.id} className="card">
              <div className="img" style={{ backgroundImage: `url(${r.image})` }} aria-hidden />
              <div className="body">
                <div className="meta">
                  <span className="type">{r.type}</span>
                </div>
                <h3>{r.name}</h3>
                <p className="blurb">{r.blurb}</p>
                <div className="tags">
                  {r.tags?.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
                <div className="row">
                  <a href={`/dining/${r.id}`} className="btn ghost" onClick={(e)=>e.preventDefault()}>Visa meny</a>
                  <a href="/booking" className="btn">Boka bord</a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .wrap { max-width:1100px; margin:0 auto; padding:28px 16px; color:#e8ecff; }
        .lead { opacity:.9; margin-bottom:12px; }
        .grid { display:grid; gap:14px; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); }
        .card { border:1px solid #2b315e; border-radius:14px; overflow:hidden; background:#0f1430; display:flex; flex-direction:column; }
        .img { aspect-ratio:16/9; background-size:cover; background-position:center; }
        .body { padding:12px; display:flex; gap:6px; flex-direction:column; }
        .meta { font-size:.85rem; color:#cbd2e6; opacity:.9; }
        .tags { display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; }
        .tag { font-size:.8rem; padding:2px 8px; border:1px solid #2b315e; border-radius:999px; background:#0b0f25; }
        .row { display:flex; gap:10px; margin-top:6px; }
        .btn { padding:8px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; text-decoration:none; }
        .btn:hover { background:#151b42; }
        .btn.ghost { background:transparent; }
      `}</style>
    </section>
  );
}
