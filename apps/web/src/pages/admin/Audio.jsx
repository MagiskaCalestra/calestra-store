import React, { useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/admin/AdminShell";
import { audioEngine } from "../../core/sound/engine";

const STORAGE_KEY = "admin_audio_route_map";
const TRACKS = [
  { id: "cw_theme_main",  title: "Global Discovery Theme" },
  { id: "cw_theme_store", title: "Global Retail BGM" },
];

export default function AdminAudio() {
  const [rules, setRules] = useState(() => readRules());
  const [pattern, setPattern] = useState("/");
  const [type, setType] = useState("exact"); // exact | prefix | glob
  const [track, setTrack] = useState("cw_theme_main");

  // persist och notifiera router
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    window.dispatchEvent(new CustomEvent("cw.audio.routeMap.updated", { detail: rules }));
  }, [rules]);

  const add = () => {
    if (!pattern || !pattern.startsWith("/")) return alert("Mönster måste börja med /");
    setRules((prev) => {
      const next = prev.filter((r) => !(r.pattern === pattern && r.type === type));
      next.push({ pattern, type, track });
      return next.sort(sortRules);
    });
    setPattern("/");
  };

  const del = (idx) => setRules((prev) => prev.filter((_, i) => i !== idx));
  const testPlay = (id) => audioEngine.play(id);
  const stop = () => audioEngine.stop(300);

  const preview = useMemo(() => {
    const examples = ["/", "/concerts", "/concerts/123", "/store", "/parks/alpha/attractions"];
    return examples.map((p) => [p, pickTrack(rules, p) || "—"]);
  }, [rules]);

  return (
    <AdminShell title="Ljud & Spår" minRole="editor">
      <div className="row">
        <label className="lbl">Mönster (path / glob)
          <input className="inp" value={pattern} onChange={(e)=>setPattern(e.target.value)}
                 placeholder="/, /concerts, /parks/*/attractions" />
        </label>
        <label className="lbl">Matchtyp
          <select className="inp" value={type} onChange={(e)=>setType(e.target.value)}>
            <option value="exact">Exact (/foo)</option>
            <option value="prefix">Prefix (/foo/...)</option>
            <option value="glob">Glob (/foo/*/bar)</option>
          </select>
        </label>
        <label className="lbl">Spår
          <select className="inp" value={track} onChange={(e)=>setTrack(e.target.value)}>
            {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.id} — {t.title}</option>)}
          </select>
        </label>
        <button className="btn" onClick={add}>Lägg till / uppdatera</button>
      </div>

      <table className="tbl">
        <thead><tr><th>#</th><th>Typ</th><th>Mönster</th><th>Track</th><th>Test</th><th>Ta bort</th></tr></thead>
        <tbody>
          {rules.length===0 && <tr><td colSpan="6" style={{opacity:.8}}>Inga regler ännu.</td></tr>}
          {rules.map((r, i) => (
            <tr key={i}>
              <td className="mono">{i+1}</td>
              <td><span className="chip">{r.type}</span></td>
              <td><code>{r.pattern}</code></td>
              <td>{r.track}</td>
              <td>
                <button className="btn sm" onClick={()=>testPlay(r.track)}>▶︎</button>
                <button className="btn sm ghost" onClick={stop}>■</button>
              </td>
              <td><button className="btn sm warn" onClick={()=>del(i)}>Radera</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{marginTop:12}}>Snabb-preview</h3>
      <table className="tbl small">
        <thead><tr><th>Exempel-path</th><th>Matchat spår</th></tr></thead>
        <tbody>
          {preview.map(([p,t]) => <tr key={p}><td><code>{p}</code></td><td>{t}</td></tr>)}
        </tbody>
      </table>

      <p className="hint">Sparas lokalt (localStorage). I produktion pekar detta mot central konfig / RBAC-skyddad endpoint.</p>

      <style>{`
        .row { display:grid; grid-template-columns: 1.2fr .7fr .8fr auto; gap:8px; margin-bottom:10px; align-items:end; }
        .lbl { display:flex; flex-direction:column; gap:6px; }
        .inp { padding:10px; border-radius:10px; border:1px solid #2b315e; background:#0b0f25; color:#e8ecff; min-width:220px; }
        .btn { padding:10px 12px; border-radius:10px; border:1px solid #2b315e; background:#121735; color:#fff; cursor:pointer; }
        .btn.ghost { background:transparent; }
        .btn.warn { background:#5a2330; border-color:#8a2b3f; }
        .btn.sm { padding:6px 8px; margin-right:6px; }
        .tbl { width:100%; border-collapse: collapse; margin-top:8px; }
        .tbl.small td, .tbl.small th { padding:6px 8px; }
        .tbl th, .tbl td { border:1px solid #2b315e; padding:8px; text-align:left; }
        .hint { opacity:.8; margin-top:8px; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .chip { padding:2px 8px; border-radius:999px; border:1px solid #2b315e; font-size:.85rem; }
        @media (max-width: 900px){ .row { grid-template-columns: 1fr; } }
      `}</style>
    </AdminShell>
  );
}

/* ---------- helpers (samma logik som i AudioRouter) ---------- */

function readRules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.sort(sortRules);
    // migration från gammalt objekt
    const arr = Object.entries(parsed).map(([pattern, track]) => ({ pattern, type: "exact", track }));
    return arr.sort(sortRules);
  } catch { return []; }
}
function sortRules(a, b) {
  const rank = (t) => (t==="exact"?0:t==="prefix"?1:2);
  if (rank(a.type) !== rank(b.type)) return rank(a.type) - rank(b.type);
  if (a.type === "prefix" && b.type === "prefix") return b.pattern.length - a.pattern.length;
  return 0;
}
function pickTrack(rules, path) {
  const ex = rules.find((r) => r.type === "exact" && r.pattern === path);
  if (ex) return ex.track;
  let best = null;
  for (const r of rules) {
    if (r.type !== "prefix") continue;
    if (path.startsWith(r.pattern)) {
      if (!best || r.pattern.length > best.pattern.length) best = r;
    }
  }
  if (best) return best.track;
  for (const r of rules) {
    if (r.type !== "glob") continue;
    const re = globToRegExp(r.pattern);
    if (re.test(path)) return r.track;
  }
  return null;
}
function globToRegExp(glob) {
  const esc = glob.replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp("^" + esc + "$");
}
