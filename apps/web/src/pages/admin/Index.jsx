import React from "react";
export default function AdminIndex(){
  return (
    <div className="container section-lg">
      <div className="h2">Admin</div>
      <ul className="list" style={{marginTop:10}}>
        <li><a href="/admin/payouts">Utbetalningar</a></li>
        <li><a href="/admin/ingest">Ingest</a></li>
        <li><a href="/admin/settings">Inställningar</a></li>
      </ul>
      <p className="small" style={{opacity:.8, marginTop:12}}>
        Detta är den centrala kontrollen (C-Core Control). Funktionerna är modulära och kan senare flyttas till egna micro-UIs.
      </p>
    </div>
  );
}
