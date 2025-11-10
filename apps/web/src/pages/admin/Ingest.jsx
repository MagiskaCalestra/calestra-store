import React from "react";

export default function AdminIngest(){
  const [running, setRunning] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  async function run(kind){
    setRunning(true); setMsg("");
    try {
      const res = await fetch(`/api/ingest/${kind}`, { method: "POST" });
      setMsg(res.ok ? "Klar" : `Fel: ${res.status}`);
    } catch (e) {
      setMsg(`Fel: ${e?.message||e}`);
    } finally { setRunning(false); }
  }

  return (
    <div className="container section-lg">
      <div className="h2">Admin – Ingest</div>
      <div className="row" style={{gap:8, marginTop:12}}>
        <button className="btn btn-acc" disabled={running} onClick={()=>run("soft")}>Kör soft ingest</button>
        <button className="btn" disabled={running} onClick={()=>run("full")}>Kör full ingest</button>
      </div>
      {!!msg && <div className="small" style={{marginTop:8}}>{msg}</div>}
    </div>
  );
}
