// apps/web/src/components/AdminFab.jsx
import { useState } from "react";
import AdminDashboard from "./AdminDashboard.jsx";

export default function AdminFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 9998,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
          color: "#fff",
          borderRadius: 12,
          padding: "10px 14px",
          boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
          cursor: "pointer",
          backdropFilter: "blur(6px)",
        }}
        title="Central Admin"
      >
        Admin
      </button>
      {open && <AdminDashboard onClose={() => setOpen(false)} />}
    </>
  );
}
