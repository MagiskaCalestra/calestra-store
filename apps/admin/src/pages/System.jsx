// D:\WebProjects\Calestra\apps\admin\src\pages\System.jsx
import React from "react";
import QAPanel from "../pages/system/QAPanel.jsx";

export default function System() {
  return (
    <div style={{ padding: 18 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.92)" }}>
          System
        </div>
        <div style={{ opacity: 0.72, color: "rgba(255,255,255,0.82)", marginTop: 6 }}>
          Drift, routing, QA och säkerhetskontroller inför testlansering.
        </div>
      </div>

      <QAPanel />
    </div>
  );
}
