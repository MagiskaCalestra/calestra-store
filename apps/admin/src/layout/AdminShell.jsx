// D:\WebProjects\Calestra\apps\admin\src\layout\AdminShell.jsx
import React from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

function getEmail() {
  try {
    return localStorage.getItem("cw.admin.email") || "admin@calestra.local";
  } catch {
    return "admin@calestra.local";
  }
}

function isOn(v) {
  return String(v || "").trim() === "1" || String(v || "").trim().toLowerCase() === "true";
}

export default function AdminShell() {
  const nav = useNavigate();
  const loc = useLocation();
  const email = getEmail();

  // Feature flags (build-time via Vite env)
  const FINANCE_ENABLED = isOn(import.meta?.env?.VITE_ADMIN_FINANCE);

  const pageTitle = React.useMemo(() => {
    if (loc.pathname.startsWith("/orders")) return "Orders";
    if (loc.pathname.startsWith("/reports")) return "Reports";
    if (loc.pathname.startsWith("/payouts")) return "Payouts";
    if (loc.pathname.startsWith("/settings")) return "Settings";
    if (loc.pathname.startsWith("/ingest")) return "Ingest";
    if (loc.pathname.startsWith("/system")) return "System";
    if (loc.pathname.startsWith("/finance")) return "Finance";
    return "Control Center";
  }, [loc.pathname]);

  const pageSub = React.useMemo(() => {
    if (loc.pathname.startsWith("/orders")) return "Orderlogg • export • import • testlanseringsstatistik.";
    if (loc.pathname.startsWith("/reports")) return "Trender, topprodukter och daglig översikt för testlansering.";
    if (loc.pathname.startsWith("/payouts")) return "Utbetalningar & sammanställningar (kommer i nästa steg).";
    if (loc.pathname.startsWith("/settings")) return "Konfig & nycklar (visa aldrig publikt).";
    if (loc.pathname.startsWith("/ingest")) return "Planerade jobb, webhookar och manuella importer.";
    if (loc.pathname.startsWith("/system")) return "Drift, routing, QA och säkerhetskontroller.";
    if (loc.pathname.startsWith("/finance")) return "Kopplat till finance-service (säker vy).";
    return "Översikt för hela Calestra-ekosystemet — bakom kulisserna.";
  }, [loc.pathname]);

  function logout() {
    try {
      localStorage.removeItem("cw.admin");
    } catch {}
    nav("/login", { replace: true });
  }

  return (
    <div className="adminShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandTitle">CALESTRA ADMIN</div>
          <div className="brandSub">Control Core • Stable • v1.0-dev</div>
        </div>

        <div className="clusterCard">
          <div className="clusterTitle">Cluster Status</div>
          <div className="clusterText">
            Orders, finance-service, identity, status m.m. kan kopplas hit.
            <br />
            <span style={{ opacity: 0.75 }}>Tips: System-sidan blir nästa “QA panel”.</span>
          </div>
        </div>

        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/ingest">Ingest</NavLink>
          <NavLink to="/payouts">Payouts</NavLink>
          <NavLink to="/settings">Settings</NavLink>
          <NavLink to="/system">System</NavLink>

          {FINANCE_ENABLED ? <NavLink to="/finance">Finance</NavLink> : null}
        </nav>

        <div className="sidebarFooter">
          <div className="userCard">
            <div className="userTitle">Calestra Admin</div>
            <div className="userEmail">{email}</div>
            <button
              className="btn btnDanger"
              onClick={logout}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Logga ut
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbarLeft">
            <div className="pageTitle">{pageTitle}</div>
            <div className="pageSub">{pageSub}</div>
          </div>

          <div className="topbarRight">
            <span>Signed in</span>
            <span className="pill">
              <span className="dot" />
              {email}
            </span>
          </div>
        </div>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
