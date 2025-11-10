import React from "react";
import hero from "../assets/hero.jpg";

export default function Hero(){
  return (
    <header className="section">
      <div className="container">
        <div className="grid grid--2" style={{alignItems:"center"}}>
          <div>
            <div className="eyebrow">Calestra World</div>
            <h1 className="h1">Bär ljuset. Stöd resan.</h1>
            <p className="lead">
              Vi bygger en varm framtidsvärld där magi och känslor möter vardag.
              Denna huvudsida knyter ihop visionen med butiken.
            </p>
            <div style={{display:"flex", gap:10, marginTop:12}}>
              <a className="btn" href="http://localhost:5175/">Till butiken</a>
              <a className="btn btn-ghost" href="http://localhost:5175/shop">Utforska produkter</a>
            </div>
          </div>
          <div className="card" aria-label="Hero-bild">
            <img src={hero} alt="Stämningsfull vy från Calestra-världen med ljusspår på himlen" />
          </div>
        </div>
      </div>
    </header>
  );
}
