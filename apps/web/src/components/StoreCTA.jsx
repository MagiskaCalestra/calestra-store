import React from "react";

export default function StoreCTA(){
  return (
    <section className="section">
      <div className="container center">
        <div className="eyebrow">Stöd magin</div>
        <h2 style={{margin:"6px 0 10px", fontWeight:900}}>Handla, bär och påverka</h2>
        <p className="lead" style={{margin:"0 auto 12px", maxWidth: "70ch"}}>
          Varje köp för oss närmare prototypen. Du får något fint idag och hjälper oss bygga imorgon.
        </p>
        <div style={{display:"flex", gap:10, justifyContent:"center"}}>
          <a className="btn" href="http://localhost:5175/">Gå till butiken</a>
          <a className="btn btn-ghost" href="http://localhost:5175/vision">Läs vår riktning</a>
        </div>
      </div>
    </section>
  );
}
