import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import notes from "../data/devlog.json";

/* Enkel placeholder om bild saknas */
function Media({ src, alt = "" }) {
  if (!src) {
    return (
      <div className="ph" aria-hidden="true">
        <div className="ph__grad" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" />;
}

export default function DevLogEntry() {
  const { id } = useParams();
  const nav = useNavigate();

  const idx = notes.findIndex(n => n.id === id);
  const item = idx >= 0 ? notes[idx] : null;

  if (!item) {
    return (
      <div className="deventry deventry--missing">
        <div className="deventry__wrap">
          <h1>Notis saknas</h1>
          <p>Vi hittar inte anteckningen â€œ{id}â€.</p>
          <Link className="btn" to="/dev-log">â† Tillbaka till Maker Notes</Link>
        </div>
        <style>{css}</style>
      </div>
    );
  }

  const prev = notes[idx - 1];
  const next = notes[idx + 1];

  return (
    <article className="deventry">
      <header className="deventry__head">
        <Link className="deventry__back" to="/dev-log">â† Maker Notes</Link>
        <h1 className="deventry__title">{item.title}</h1>
        <div className="deventry__meta">
          <time dateTime={item.date}>{new Date(item.date).toLocaleDateString()}</time>
          <span aria-hidden="true">Â·</span>
          <span>{(item.tags || []).join(" Â· ")}</span>
        </div>
      </header>

      <figure className="deventry__media">
        <Media src={item.cover} />
      </figure>

      <section className="deventry__body">
        {Array.isArray(item.content) && item.content.length > 0 ? (
          item.content.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <>
            <p>{item.summary}</p>
            <p style={{opacity:.8}}>Fulltext kommer snart. Under tiden: följ vår <Link to="/vision">vision</Link> eller kolla <Link to="/sustainability">hållbarhet</Link>.</p>
          </>
        )}
      </section>

      <nav className="deventry__pager" aria-label="Nästa/föregående">
        <div>
          {prev && (
            <button className="btn btn--ghost" onClick={() => nav(`/dev-log/${prev.id}`)}>
              â† {prev.title}
            </button>
          )}
        </div>
        <div>
          {next && (
            <button className="btn btn--ghost" onClick={() => nav(`/dev-log/${next.id}`)}>
              {next.title} â†’
            </button>
          )}
        </div>
      </nav>

      <style>{css}</style>
    </article>
  );
}

const css = `
.deventry{container-type:inline-size;max-width:860px;margin:0 auto;padding:22px 16px}
.deventry__back{display:inline-block;text-decoration:none;font-weight:800;margin-bottom:6px}
.deventry__title{margin:0 0 6px;font-size:clamp(22px,3.6vw,34px);font-weight:900;line-height:1.1}
.deventry__meta{opacity:.75;font-weight:700;display:flex;gap:10px}
.deventry__media{margin:14px 0 8px;border-radius:16px;overflow:hidden}
.deventry__media img{width:100%;height:auto;display:block}
.ph{aspect-ratio:16/9;background:#f5f6ff;position:relative}
.theme-dark .ph{background:rgba(255,255,255,.06)}
.ph__grad{position:absolute;inset:0;background:
  radial-gradient(120% 80% at 20% 0%, rgba(123,136,255,.12), transparent 60%),
  linear-gradient(180deg, rgba(0,0,0,.06), transparent)}
.deventry__body{display:grid;gap:12px;margin:10px 0 14px}
.deventry__body p{margin:0;font-size:1.02rem;line-height:1.6}
.deventry__pager{display:flex;justify-content:space-between;gap:12px;margin-top:8px}
.btn{border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:12px;padding:10px 12px;font-weight:800;text-decoration:none}
.btn--ghost{background:transparent}
.theme-dark .btn{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff}
`;
