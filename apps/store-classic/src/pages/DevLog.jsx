import React from "react";
import { Link } from "react-router-dom";
import log from "../data/devlog.json";

function NoteCard({ item }) {
  return (
    <article className="note" aria-label={item.title}>
      <Link className="note__card" to={`/dev-log/${item.id}`}>
        <div className="note__media" aria-hidden="true">
          <img src={item.cover} alt="" loading="lazy" />
        </div>
        <div className="note__body">
          <div className="note__meta">
            <time dateTime={item.date}>{new Date(item.date).toLocaleDateString()}</time>
            <span className="note__tags">{item.tags.join(" Â· ")}</span>
          </div>
            <h3 className="note__title">{item.title}</h3>
            <p className="note__lead">{item.summary}</p>
            <span className="note__cta">Läs mer â†’</span>
        </div>
      </Link>
      <style>{cssCard}</style>
    </article>
  );
}

export default function DevLog() {
  return (
    <div className="devlog">
      <header className="devlog__hero">
        <h1>Maker Notes</h1>
        <p>Utvecklingsanteckningar, skisser och vägval. Kort, ärligt, utan fluff.</p>
      </header>

      <section className="devlog__grid" aria-label="Anteckningar">
        {log.map((it) => <NoteCard key={it.id} item={it} />)}
      </section>

      <style>{css}</style>
    </div>
  );
}

const css = `
.devlog{container-type:inline-size;max-width:1100px;margin:0 auto;padding:22px 16px}
.devlog__hero{margin-bottom:12px;border-bottom:1px dashed rgba(0,0,0,.08);padding-bottom:12px}
.theme-dark .devlog__hero{border-color:rgba(255,255,255,.12)}
.devlog__hero h1{margin:0 0 6px;font-size:clamp(24px,4vw,34px);font-weight:900}
.devlog__hero p{margin:0;opacity:.85}
.devlog__grid{display:grid;gap:16px;grid-template-columns:repeat(3,1fr)}
@container (max-width:980px){.devlog__grid{grid-template-columns:1fr 1fr}}
@container (max-width:640px){.devlog__grid{grid-template-columns:1fr}}
`;
const cssCard = `
.note__card{display:grid;grid-template-rows:auto 1fr;text-decoration:none;border:1px solid rgba(0,0,0,.08);
  border-radius:16px;overflow:hidden;background:#fff}
.theme-dark .note__card{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.04)}
.note__card:focus-visible{outline:2px solid #7b88ff;outline-offset:2px}
.note__media{aspect-ratio:16/9;background:linear-gradient(180deg,rgba(0,0,0,.06),transparent)}
.note__media img{width:100%;height:100%;object-fit:cover;display:block}
.note__body{padding:14px;display:grid;gap:6px}
.note__meta{display:flex;gap:10px;opacity:.7;font-weight:700;font-size:.9rem}
.note__title{margin:2px 0 0;font-size:1.05rem;line-height:1.3;font-weight:900}
.note__lead{margin:0;opacity:.85}
.note__cta{margin-top:2px;font-weight:800}
`;
