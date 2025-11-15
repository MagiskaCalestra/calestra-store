import React from "react";
import ProgressMeters from "../components/ProgressMeters";

export default function Goals(){
  return (
    <main>
      <section className="cw-container" style={{ marginTop: 18 }}>
        <h1 className="h1">Milstolpar</h1>
        <p className="cw-meter-val" style={{ marginTop: 6 }}>
          Här samlar vi alla mål, delmål och hur dina köp för oss närmare Calestra World.
        </p>

        <div style={{ marginTop: 14 }}>
          <ProgressMeters />
        </div>

        <div className="cw-card" style={{ marginTop: 14 }}>
          <div className="cw-card-pad-lg">
            <h3>Nivåer & belöningar (exempel)</h3>
            <ul style={{ marginTop: 8, lineHeight: 1.6 }}>
              <li>âœ… 1 000 supporters â€“ första community-droppet</li>
              <li>âœ… 10 000 supporters â€“ utökad digital värld</li>
              <li>ðŸ—ï¸ 100 000 supporters â€“ parkens första byggsteg</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
