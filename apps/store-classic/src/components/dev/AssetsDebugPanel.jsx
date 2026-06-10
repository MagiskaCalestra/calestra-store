// apps/store-classic/src/components/dev/AssetsDebugPanel.jsx
import React from "react";
import { ImageProbeRow } from "./ImageProbe.jsx";

/**
 * Panelen testar både:
 *  - Absolut public-väg (/images/...)
 *  - Bundlat importerat asset (via Vite)
 *
 * Tips:
 *  1) Lägg en fil i public/images som heter _test-public.jpg
 *  2) Lägg en fil i src/assets som heter _test-import.jpg
 *  3) Starta dev: npm run dev och mounta <AssetsDebugPanel/> på valfri sida
 */

let importedAssetSrc = "";
try {
  // Prova dynamiskt import â€” om filen saknas blir importedAssetSrc tom.
  importedAssetSrc = new URL("../../assets/_test-import.jpg", import.meta.url).href;
} catch {
  importedAssetSrc = "";
}

export default function AssetsDebugPanel() {
  const [extra, setExtra] = React.useState("");

  const cases = [
    { label: "Public OK", src: "/images/_test-public.jpg" },
    { label: "Import OK", src: importedAssetSrc || "" },

    // Vanliga felvägar (ska visa ERROR om man råkat använda dessa)
    { label: "âš ï¸Ž Relativ till public (fel)", src: "./public/images/_test-public.jpg" },
    { label: "âš ï¸Ž Dubbelpunkt ut ur src (fel)", src: "../public/images/_test-public.jpg" },
  ];

  const userCase = extra?.trim()
    ? [{ label: "Din egen test-URL", src: extra.trim() }]
    : [];

  const all = [...cases, ...userCase];

  return (
    <div className="assets-panel">
      <h2>Asset-kontroll</h2>
      <p className="hint">
        Vite servar allt i <code>public/</code> på <code>/</code>. Lägg statiska bilder i
        <code> public/images/</code> och använd <code>/images/fil.jpg</code>.
        Bundlade assets i <code>src/assets</code> importeras (eller URL-beräknas) och funkar i build.
      </p>

      <div className="add">
        <input
          className="input"
          placeholder="Klistra in valfri bild-URL att testa (t.ex. /images/hero.jpg)"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
        />
      </div>

      <div className="table">
        <div className="hdr">Case</div>
        <div className="hdr">Path/URL</div>
        <div className="hdr">Status</div>
        <div className="hdr">Size</div>
        <div className="hdr">Thumb</div>
        {all.map((c, i) => (
          <ImageProbeRow key={i} label={c.label} src={c.src} />
        ))}
      </div>

      <style>{`
        .assets-panel { background:#fff; border:1px solid #E2E8F0; border-radius:12px; padding:16px; }
        .theme-dark .assets-panel { background:#0f1622; border-color:#243041; }
        h2 { margin:4px 0 10px; }
        .hint { color:#475569; margin:0 0 12px; }
        .theme-dark .hint { color:#9aa3af; }
        .add { margin:12px 0 6px; }
        .input { width:100%; height:42px; border:1px solid #CBD5E1; border-radius:8px; padding:0 12px; }
        .theme-dark .input { background:#0b1018; color:#e6e7ea; border-color:#2b3546; }
        .table { display:grid; grid-template-columns: 180px 1fr 120px 110px 80px; gap:12px; align-items:center; }
        .hdr { font-weight:800; opacity:.85; padding:6px 0; }
      `}</style>
    </div>
  );
}
