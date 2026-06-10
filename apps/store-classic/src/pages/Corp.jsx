// D:\WebProjects\Calestra\apps\store-classic\src\pages\Corp.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { TT } from "../i18n/tt.js";

export default function Corp() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [files, setFiles] = React.useState([]);

  React.useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setErr("");
        setLoading(true);

        const res = await fetch("/corp/list.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (alive) {
          setFiles(Array.isArray(data?.files) ? data.files : []);
        }
      } catch (e) {
        if (alive) {
          setErr(e?.message || "Load failed");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const title = TT(i18n, t, "corp.title", {
    sv: "Publika dokument",
    en: "Public Releases",
    tr: "Yayınlanan belgeler",
  });

  const loadingText = TT(i18n, t, "corp.loading", {
    sv: "Laddar…",
    en: "Loading…",
    tr: "Yükleniyor…",
  });

  const errorText = TT(i18n, t, "corp.error", {
    sv: "Kunde inte hämta listan",
    en: "Could not load the list",
    tr: "Liste yüklenemedi",
  });

  const emptyText = TT(i18n, t, "corp.empty", {
    sv: "Inga publika dokument ännu.",
    en: "No public documents yet.",
    tr: "Henüz yayınlanan belge yok.",
  });

  return (
    <main className="container corp" role="main" aria-labelledby="corp-title">
      <h1 id="corp-title" className="title">
        {title}
      </h1>

      {loading ? <div className="msg">{loadingText}</div> : null}

      {!loading && err ? (
        <div className="msg error">
          {errorText}: {err}
        </div>
      ) : null}

      {!loading && !err && files.length === 0 ? <div className="msg">{emptyText}</div> : null}

      <ul className="corp-list">
        {files.map((f) => {
          const url = String(f?.url || "");
          const name = String(f?.name || url.split("/").pop() || title);

          return (
            <li key={url || name}>
              <a href={url} target="_blank" rel="noreferrer">
                {name}
              </a>
            </li>
          );
        })}
      </ul>

      <style>{`
        .container { max-width: 1000px; margin:0 auto; padding:16px; }
        .title { font-size:28px; margin:8px 0 16px; }
        .msg { padding:12px; border-radius:10px; background:#f3f5ff; color:#1b2b6b; }
        .theme-dark .msg { background:#0f1622; color:#c6d0ff; border:1px solid #243041; }
        .msg.error { background:#fff2f2; color:#7a1f1f; }
        .theme-dark .msg.error { background:#1b0f10; color:#ffb3b3; border-color:#3a1f21; }
        .corp-list { margin:16px 0 0; padding:0; list-style:none; display:grid; gap:10px; }
        .corp-list a {
          display:block; padding:12px 14px; border:1px solid var(--border,#e6eaf0);
          border-radius:10px; background:var(--card,#fff); text-decoration:none; font-weight:700;
        }
        .corp-list a:hover { background:rgba(0,0,0,.04); }
        .theme-dark .corp-list a:hover { background:rgba(255,255,255,.06); }
      `}</style>
    </main>
  );
}