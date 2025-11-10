import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";

import Index from "./pages/Index.jsx";
import Payouts from "./pages/Payouts.jsx";
import Settings from "./pages/Settings.jsx";
import Ingest from "./pages/Ingest.jsx";
import OrdersList from "./pages/OrdersList.jsx"; // ⬅️ NY

function Guard({ children }) {
  const nav = useNavigate();
  React.useEffect(() => {
    const ok = localStorage.getItem("cw.admin") === "1";
    if (!ok) nav("/"); // blockera om inte upplåst
  }, [nav]);
  return children;
}

export default function App() {
  return (
    <div className="container">
      <header className="row" style={{ justifyContent: "space-between", padding: "12px 0" }}>
        <nav className="row" style={{ gap: 10 }}>
          <Link className="btn btn-sm" to="/">Dashboard</Link>
          <Link className="btn btn-sm" to="/orders">Orders</Link>     {/* ⬅️ NY */}
          <Link className="btn btn-sm" to="/payouts">Payouts</Link>
          <Link className="btn btn-sm" to="/settings">Settings</Link>
          <Link className="btn btn-sm" to="/ingest">Ingest</Link>
        </nav>
        <button
          className="btn btn-sm"
          onClick={() => {
            localStorage.removeItem("cw.admin");
            location.reload();
          }}
        >
          Logga ut
        </button>
      </header>

      <Routes>
        <Route index element={<Guard><Index /></Guard>} />
        <Route path="orders" element={<Guard><OrdersList /></Guard>} /> {/* ⬅️ NY */}
        <Route path="payouts" element={<Guard><Payouts /></Guard>} />
        <Route path="settings" element={<Guard><Settings /></Guard>} />
        <Route path="ingest" element={<Guard><Ingest /></Guard>} />
      </Routes>
    </div>
  );
}
