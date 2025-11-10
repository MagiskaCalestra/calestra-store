import React from "react";
import { Link } from "react-router-dom";

const roles = [
  { id:"guide", title:"VärldsGuide (Guest Flow)", mood:"Glädje" },
  { id:"performer", title:"Berättare (Live)", mood:"Äventyr" },
  { id:"engineer", title:"Portalingenjör (R&D)", mood:"Stillhet" },
];

export default function Careers(){
  return (
    <main className="container py-10">
      <h1 className="h1">Karriär på Calestra</h1>
      <ul className="list">
        {roles.map(r=>(
          <li key={r.id} className="row space">
            <div>
              <strong>{r.title}</strong>
              <div className="muted">Känsla: {r.mood}</div>
            </div>
            <Link className="btn" to={`/careers/${r.id}`}>Visa</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
