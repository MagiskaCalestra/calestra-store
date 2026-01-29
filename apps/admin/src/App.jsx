// D:\WebProjects\Calestra\apps\admin\src\App.jsx
import React from "react";
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import AdminShell from "./layout/AdminShell.jsx";

import Login from "./pages/Login.jsx";
import Index from "./pages/Index.jsx";
import OrdersList from "./pages/OrdersList.jsx";
import Reports from "./pages/Reports.jsx";
import Ingest from "./pages/Ingest.jsx";
import Payouts from "./pages/Payouts.jsx";
import Settings from "./pages/Settings.jsx";
import System from "./pages/System.jsx";
import Finance from "./pages/Finance.jsx";

/* ==================== Auth (super-enkel för test) ==================== */
function isAuthed() {
  try {
    return localStorage.getItem("cw.admin") === "1";
  } catch {
    return false;
  }
}

function RequireAuth() {
  const location = useLocation();
  if (!isAuthed()) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function isOn(v) {
  return String(v || "").trim() === "1" || String(v || "").trim().toLowerCase() === "true";
}

function FinanceGate({ children }) {
  const enabled = isOn(import.meta?.env?.VITE_ADMIN_FINANCE);
  if (!enabled) return <Navigate to="/" replace />;
  return children;
}

/* ==================== App Routes ==================== */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={isAuthed() ? <Navigate to="/" replace /> : <Login />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<AdminShell />}>
          <Route index element={<Index />} />

          <Route path="orders" element={<OrdersList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="ingest" element={<Ingest />} />
          <Route path="payouts" element={<Payouts />} />
          <Route path="settings" element={<Settings />} />
          <Route path="system" element={<System />} />

          <Route
            path="finance"
            element={
              <FinanceGate>
                <Finance />
              </FinanceGate>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
