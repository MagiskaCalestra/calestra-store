import React from "react";
import { NavLink } from "react-router-dom";

export default function AdminNav() {
  const item = (to, label) => (
    <NavLink to={to} className={({isActive})=>"an-link"+(isActive?" active":"")}>{label}</NavLink>
  );
  return (
    <nav className="an">
      {item("/admin", "Översikt")}
      {item("/admin/inventory", "Inventarie / Platser")}
      {item("/admin/rules", "Regler / Blackouts")}
      {item("/admin/audio", "Ljud & Spår")}
      {item("/admin/governance", "Styrning & Råd")}
      {item("/admin/settings", "Systeminställningar")}
      <style>{`
        .an { display:flex; flex-direction:column; gap:6px; padding-right:8px; }
        .an-link { color:#b9c0d0; text-decoration:none; padding:8px 10px; border-radius:8px; border:1px solid transparent; }
        .an-link:hover { background:#0f1430; border-color:#2b315e; color:#fff; }
        .an-link.active { background:#121a45; border-color:#2c3aa0; color:#fff; }
      `}</style>
    </nav>
  );
}
