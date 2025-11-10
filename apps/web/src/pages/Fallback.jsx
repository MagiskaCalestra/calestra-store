import React, { useEffect, useState } from "react";
import { apiGet } from "@/utils/api";

/**
 * Visas när en route/feature inte finns än, eller är under uppbyggnad.
 * Försöker hämta lite status från /api/health – fungerar även med mock.
 */
export default function Fallback() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let alive = true;
    apiGet("/api/health").then((r) => alive && setStatus(r));
    return () => { alive = false; };
  }, []);

  return (
    <main>
      <div className="container">
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-pad-lg">
            <div className="h2">Den här delen är på väg ✨</div>
            <p className="small" style={{ marginTop: 6 }}>
              Vi bygger klart funktionen. Under tiden kan du fortsätta upptäcka Calestra World.
            </p>
            <div className="row" style={{ marginTop: 10 }}>
              <a href="/" className="btn btn-acc">Till startsidan</a>
              <a href="/store" className="btn btn-ghost">Gå till butiken</a>
            </div>

            <div style={{ marginTop: 16, opacity: .85 }}>
              <div className="eyebrow">Systemstatus</div>
              <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
                {status ? JSON.stringify({
                  ok: status.ok,
                  mock: status.mock,
                  status: status.status
                }, null, 2) : "Kontrollerar..."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
