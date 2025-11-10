// apps/web/src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="container" role="main" aria-labelledby="nfTitle" style={{ padding: "64px 0" }}>
      <h1 id="nfTitle" style={{ marginTop: 0 }}>Page not found</h1>
      <p style={{ color: "rgba(255,255,255,.9)" }}>
        The page you were looking for doesn’t exist, has moved, or is temporarily unavailable.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Link className="btn" to="/">Go to Home</Link>
        <Link className="btn" to="/plan">Plan your visit</Link>
      </div>
    </main>
  );
}
