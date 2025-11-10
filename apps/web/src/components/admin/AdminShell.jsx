import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function AdminShell({ title, children }) {
  const loc = useLocation();
  const Tab = ({to, children}) => (
    <Link to={to} className={"pill " + (loc.pathname===to ? "pill-active" : "")}>{children}</Link>
  );

  return (
    <div className="container section-lg">
      <div className="row" style={{justifyContent:"space-between", alignItems:"baseline"}}>
        <div className="h2">{title || "Calestra Admin"}</div>
        <div className="row" style={{gap:8}}>
          <Tab to="/admin/dashboard">Dashboard</Tab>
          <Tab to="/admin/payouts">Payouts</Tab>
          <Tab to="/admin/ingest">Ingest</Tab>
          <Tab to="/admin/settings">Settings</Tab>
        </div>
      </div>
      <div style={{marginTop:14}}>{children}</div>
    </div>
  );
}
