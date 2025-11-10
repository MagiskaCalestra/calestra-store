import React from "react";

export default function Tickets() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="h2">Biljetter</h1>
      <p className="small opacity-80 mt-1">
        Välj dagsbiljett eller paket. Lanseringsfas: kassan öppnas snart – förhandsboka via Store.
      </p>

      <div className="grid" style={{ gridTemplateColumns:"repeat(3,1fr)", gap:12, marginTop:14 }}>
        <div className="card"><div className="card-pad">
          <div className="h3">Dagspass</div>
          <p className="small opacity-80">Entré till alla öppna zoner en valfri dag.</p>
          <a className="btn btn-acc" href="/store">Förköp</a>
        </div></div>

        <div className="card"><div className="card-pad">
          <div className="h3">Weekend</div>
          <p className="small opacity-80">Två dagar + bonusevent.</p>
          <a className="btn btn-acc" href="/store">Förköp</a>
        </div></div>

        <div className="card"><div className="card-pad">
          <div className="h3">Årskort</div>
          <p className="small opacity-80">Fri entré hela året + medlemsförmåner.</p>
          <a className="btn btn-acc" href="/membership">Bli medlem</a>
        </div></div>
      </div>
    </div>
  );
}
