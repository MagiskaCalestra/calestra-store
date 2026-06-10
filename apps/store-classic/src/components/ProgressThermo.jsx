// Dummy â€œparkprogressâ€ med CTA
export default function ProgressThermo({ value=42 }){
  return (
    <div style={{background:"linear-gradient(180deg,#0f1622,#0e1320)",border:"1px solid #1e2633",borderRadius:12,padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <strong>Park Progress</strong><span>{value}%</span>
      </div>
      <div className="progress"><span style={{width:`${value}%`}}/></div>
      <div style={{marginTop:10,fontSize:13,opacity:.9}}>Hjälp oss nå nästa delmål â€“ få belöningar.</div>
      <button className="btn" style={{marginTop:8}} onClick={()=>alert("Crowdfunding (mock)")}>Stöd projektet</button>
    </div>
  );
}
