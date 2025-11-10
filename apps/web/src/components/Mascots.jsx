import React from "react";
import mascots from "../assets/mascots-wide.jpg";

export default function Mascots(){
  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">Karaktärer</div>
        <h2 style={{margin:"6px 0 10px", fontWeight:900}}>Hybridrävarna — syster & bror</h2>
        <p className="lead">
          Två syskon som bär Harmonic Star-symbolen. De guidar besökare, dyker upp i artefakter
          och binder ihop digitalt & fysiskt.
        </p>
        <div className="card" style={{marginTop:12}}>
          <img src={mascots} alt="De två hybridrävarna — flicka och pojke — vid en kvällsbelyst stig" />
        </div>
      </div>
    </section>
  );
}
