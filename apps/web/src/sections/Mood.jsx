import React from "react";

export default function Mood(){
  return (
    <section className="mood">
      <div className="container">
        <div className="grid">
          <div className="stack" style={{gridColumn:'span 6'}}>
            <h2 style={{color:'var(--brand)', margin:'0'}}>Välj din känsla</h2>
            <p style={{color:'var(--muted)'}}>Stillhet. Glädje. Äventyr. Kärlek. Låt ljuset visa vägen.</p>
            <div className="row">
              {["Stillhet","Glädje","Äventyr","Kärlek"].map(x=>(
                <button key={x} className="btn">{x}</button>
              ))}
            </div>
          </div>
          <div className="frame" style={{gridColumn:'span 6'}} />
        </div>
      </div>
    </section>
  );
}
