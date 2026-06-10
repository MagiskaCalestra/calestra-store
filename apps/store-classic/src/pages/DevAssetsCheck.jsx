// apps/store-classic/src/pages/DevAssetsCheck.jsx
import React from "react";
import AssetsDebugPanel from "../components/dev/AssetsDebugPanel.jsx";

export default function DevAssetsCheck() {
  return (
    <div className="container" role="main">
      <h1>Assets / Bild-debug</h1>
      <AssetsDebugPanel />
      <style>{`
        .container { max-width: 980px; margin: 0 auto; padding: 16px; }
        h1 { font-size: 24px; margin: 4px 0 12px; }
      `}</style>
    </div>
  );
}
