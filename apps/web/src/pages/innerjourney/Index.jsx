// apps/web/src/pages/innerjourney/Index.jsx
import React, { useEffect, useMemo, useState } from "react";
import { CCoreSDK } from "../../core/ccore";
import { useAuth } from "../../core/AuthContext";

function emojiFor(m) {
  const map = {1:"ðŸŒ§ï¸",2:"ðŸŒ¥ï¸",3:"â­",4:"âœ¨",5:"ðŸŒˆ"};
  return map[m] || "â­";
}

export default function InnerJourney() {
  const { publicMode } = useAuth?.() || { publicMode: false };
  const [items, setItems] = useState(() => CCoreSDK.Journal.listEntries());
  const [editing, setEditing] = useState(null); // null | entry
  const [importText, setImportText] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const off = CCoreSDK.events.on("journal.changed", () => {
      setItems(CCoreSDK.Journal.listEntries());
    });
    return () => off();
  }, []);

  const count = items.length;
  const masked = publicMode;

  const onNew = () => {
    setEditing({
      id: null, date: new Date().toISOString().slice(0,10),
      mood: 4, moodEmoji: "âœ¨", title: "", text: "", tags: [], links: {}
    });
  };
  const onEdit = (e) => setEditing({...e});
  const onDelete = (id) => { CCoreSDK.Journal.deleteEntry(id); };

  const onSave = () => {
    setErr("");
    try {
      if (!editing.title?.trim() && !editing.text?.trim()) {
        setErr("Skriv minst en titel eller text.");
        return;
      }
      if (editing.id) {
        CCoreSDK.Journal.updateEntry(editing.id, editing);
      } else {
        CCoreSDK.Journal.createEntry(editing);
      }
      setEditing(null);
    } catch (e) { setErr(e.message || "Kunde inte spara."); }
  };

  const onExport = () => {
    const json = CCoreSDK.Journal.exportJSON();
    try { navigator.clipboard.writeText(json); } catch {}
    setImportText(json);
  };
  const onImport = () => {
    setErr("");
    try {
      const n = CCoreSDK.Journal.importJSON(importText);
      setImportText("");
      alert(`Importerade ${n} inlägg.`);
    } catch (e) { setErr(e.message || "Importfel."); }
  };

  return (
    <section className="page ij">
      <div className="wrap">
        <h1>InnerJourney</h1>
        <p className="lead">
          Din privata dagbok för upplevelser, känslor och minnen. {masked && <strong>(Offentlig dator-läge: innehåll döljs)</strong>}
        </p>

        <div className="bar">
          <button className="btn primary" onClick={onNew}>Nytt inlägg</button>
          <div className="spacer" />
          <button className="btn" onClick={onExport}>Export</button>
          <button className="btn ghost" onClick={onImport}>Import</button>
        </div>

        {err && <div className="error" role="alert">{err}</div>}

        {editing && (
          <Editor editing={editing} setEditing={setEditing} onSave={onSave} masked={masked} />
        )}

        {count === 0 ? (
          <div className="empty">
            Inga anteckningar ännu. Börja din <em>inre resa</em> â€“ klicka â€œNytt inläggâ€.
          </div>
        ) : (
          <ul className="list">
            {items.map(e => (
              <li key={e.id} className="card">
                <div className="row">
                  <div className="mood">{emojiFor(e.mood || 3)}</div>
                  <div className="meta">
                    <div className="title">{e.title || <span className="muted">Utan titel</span>}</div>
                    <div className="sub">{e.date}</div>
                  </div>
                  <div className="right">
                    <button className="btn small" onClick={()=>onEdit(e)}>Öppna</button>
                    <button className="btn small ghost" onClick={()=>onDelete(e.id)}>Radera</button>
                  </div>
                </div>
                <div className="body">
                  {masked ? (
                    <div className="mask">[Dolt i offentligt läge]</div>
                  ) : (
                    <p>{e.text?.slice(0, 240) || <span className="muted">â€”</span>}</p>
                  )}
                  {e.tags?.length > 0 && (
                    <div className="tags">{e.tags.map(t => <span key={t} className="tag">#{t}</span>)}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="import">
          <textarea
            className="ta"
            rows={8}
            placeholder='Klistra in exporterat JSON här för importâ€¦'
            value={importText}
            onChange={(e)=>setImportText(e.target.value)}
          />
        </div>
      </div>

      <style>{`
        .wrap { max-width:1100px; margin:0 auto; padding:24px 16px; color:#e8ecff; }
        .lead { opacity:.9; margin-bottom:14px; }
        .bar { display:flex; gap:10px; margin-bottom:10px; align-items:center; }
        .spacer { flex:1; }
        .btn { padding:8px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; cursor:pointer; }
        .btn.ghost { background:transparent; }
        .btn.primary { background:linear-gradient(180deg,#1c2a80,#13205e); border-color:#2c3aa0; }
        .btn.small { padding:6px 10px; font-size:.9rem; }
        .error { background:#3a1020; border:1px solid #6a1040; color:#ffd6e6; padding:10px; border-radius:10px; margin-bottom:10px; }

        .empty { border:1px solid #2b315e; background:#0f1430; padding:14px; border-radius:12px; }
        .list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; }
        .card { border:1px solid #2b315e; border-radius:14px; background:#0f1430; padding:10px; }
        .row { display:flex; align-items:center; gap:10px; }
        .mood { font-size:22px; width:26px; text-align:center; }
        .meta { display:flex; flex-direction:column; }
        .title { font-weight:600; }
        .sub { opacity:.85; font-size:.9rem; }
        .right { margin-left:auto; display:flex; gap:8px; }
        .body { margin-top:8px; }
        .muted { opacity:.7; }
        .mask { opacity:.9; font-style:italic; }
        .tags { margin-top:6px; display:flex; flex-wrap:wrap; gap:6px; }
        .tag { padding:2px 8px; border:1px solid #2b315e; border-radius:999px; font-size:.85rem; }

        .import { margin-top:12px; }
        .ta { width:100%; border-radius:10px; border:1px solid #2b315e; background:#0b0f25; color:#e8ecff; padding:10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

        /* Editor styles nedan */
      `}</style>
    </section>
  );
}

function Editor({ editing, setEditing, onSave, masked }) {
  const set = (k, v) => setEditing(prev => ({ ...prev, [k]: v }));
  return (
    <div className="editor">
      <div className="grid">
        <label className="lbl">
          Datum
          <input type="date" className="inp" value={editing.date} onChange={e=>set("date", e.target.value)} />
        </label>

        <label className="lbl">
          Känsla
          <div className="moods">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                type="button"
                className={"moodbtn"+(editing.mood===n?" sel":"")}
                onClick={()=>set("mood", n)}
                aria-pressed={editing.mood===n}
                title={`Nivå ${n}`}
              >
                {emojiFor(n)}
              </button>
            ))}
          </div>
        </label>

        <label className="lbl">
          Rubrik
          <input className="inp" maxLength={120} value={editing.title} onChange={e=>set("title", e.target.value)} placeholder="En mening om stundenâ€¦" />
        </label>

        <label className="lbl">
          Text
          <textarea className="ta2" rows={5} maxLength={5000} value={editing.text} onChange={e=>set("text", e.target.value)} placeholder="Beskriv känslan, platsen eller minnetâ€¦" />
        </label>

        <label className="lbl">
          Taggar (kommatecken)
          <input className="inp" value={(editing.tags || []).join(", ")} onChange={e=>set("tags", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} />
        </label>

        <div className="row">
          <button className="btn primary" onClick={onSave} disabled={masked}>Spara</button>
          <button className="btn ghost" onClick={()=>setEditing(null)}>Avbryt</button>
          {masked && <span className="warn">Offentligt läge â€“ redigering avstängd</span>}
        </div>
      </div>

      <style>{`
        .editor { border:1px solid #2b315e; border-radius:14px; background:#0f1430; padding:12px; margin-bottom:12px; }
        .grid { display:flex; flex-direction:column; gap:10px; }
        .lbl { display:flex; flex-direction:column; gap:6px; color:#cbd2e6; }
        .inp { padding:10px; border-radius:10px; border:1px solid #2b315e; background:#0b0f25; color:#e8ecff; }
        .ta2 { padding:10px; border-radius:10px; border:1px solid #2b315e; background:#0b0f25; color:#e8ecff; }
        .moods { display:flex; gap:6px; }
        .moodbtn { padding:6px 8px; border-radius:8px; border:1px solid #2b315e; background:#0b0f25; color:#fff; cursor:pointer; }
        .moodbtn.sel { background:#161a30; border-color:#2c3aa0; }
        .row { display:flex; gap:10px; align-items:center; }
        .warn { color:#ffd166; opacity:.95; }
      `}</style>
    </div>
  );
}
