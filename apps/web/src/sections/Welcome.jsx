import React from "react";

export default function Welcome(){
  return (
    <section className="welcome">
      <div className="container stack" style={{alignItems:'center'}}>
        <h2>Välkommen hem</h2>
        <p>Vissa säger att det är en park. Vi säger â€“ det är ett minne som väntar.</p>
        <div className="row">
          <button className="btn primary">Utforska världarna</button>
          <button className="btn">Se upplevelser</button>
        </div>
      </div>
    </section>
  );
}
