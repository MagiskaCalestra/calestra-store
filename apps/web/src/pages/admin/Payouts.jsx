import React from "react";
import { bankDirToCSV, loadBankDirectory, saveBankDirectory } from "@core/BankDirectory";

export default function AdminPayouts(){
  const [dir, setDir] = React.useState(loadBankDirectory());

  function onChange(ref, field, val){
    const next = { ...dir, [ref]: { ...dir[ref], [field]: val } };
    setDir(next);
    saveBankDirectory(next);
  }

  function exportCSV(){
    const csv = bankDirToCSV(dir);
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bank_directory.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const refs = Object.keys(dir);

  return (
    <div className="container section-lg">
      <div className="row" style={{justifyContent:"space-between", alignItems:"baseline"}}>
        <div className="h2">Admin – Utbetalningar</div>
        <button className="btn" onClick={exportCSV}>Exportera bankkatalog (CSV)</button>
      </div>

      {!refs.length && <div className="small" style={{marginTop:8, opacity:.8}}>Tom katalog – lägg in första ref nedan.</div>}

      <div className="card" style={{marginTop:12}}>
        <div className="card-pad-lg">
          <BankEditor dir={dir} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

function BankEditor({ dir, onChange }){
  const [newRef, setNewRef] = React.useState("");

  function addRef(){
    const r = (newRef || "").trim();
    if (!r) return;
    onChange(r, "name", "");
    setNewRef("");
  }

  return (
    <>
      <div className="row" style={{gap:8}}>
        <input className="input" placeholder="Ny ref" value={newRef} onChange={e=>setNewRef(e.target.value)} />
        <button className="btn" onClick={addRef}>Lägg till</button>
      </div>

      <div style={{overflowX:"auto", marginTop:12}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr style={{textAlign:"left", opacity:.8}}>
              {["Ref","Namn","E-post","IBAN","SWIFT","Swish","Bank"].map(h=>(
                <th key={h} style={{padding:"8px 6px", borderBottom:"1px solid var(--ring)"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(dir).map(([ref, r])=>(
              <tr key={ref} style={{borderBottom:"1px solid var(--ring)"}}>
                <td style={td}>{ref}</td>
                <td style={td}><input className="input" value={r.name||""} onChange={e=>onChange(ref,"name",e.target.value)} /></td>
                <td style={td}><input className="input" value={r.email||""} onChange={e=>onChange(ref,"email",e.target.value)} /></td>
                <td style={td}><input className="input" value={r.iban||""} onChange={e=>onChange(ref,"iban",e.target.value)} /></td>
                <td style={td}><input className="input" value={r.swift||""} onChange={e=>onChange(ref,"swift",e.target.value)} /></td>
                <td style={td}><input className="input" value={r.swish||""} onChange={e=>onChange(ref,"swish",e.target.value)} /></td>
                <td style={td}><input className="input" value={r.bankName||""} onChange={e=>onChange(ref,"bankName",e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
const td = { padding: "8px 6px" };
