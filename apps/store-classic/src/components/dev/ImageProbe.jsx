// apps/store-classic/src/components/dev/ImageProbe.jsx
import React from "react";

/**
 * useImageProbe
 * - Provar ladda en bild-URL.
 * - Returnerar status: "idle" | "loading" | "ok" | "error" + timing + naturalsize
 */
export function useImageProbe(src) {
  const [state, setState] = React.useState({
    status: src ? "loading" : "idle",
    width: 0,
    height: 0,
    ms: 0,
    error: "",
  });

  React.useEffect(() => {
    if (!src) return setState((s) => ({ ...s, status: "idle" }));
    let ok = true;
    const t0 = performance.now();
    const img = new Image();
    img.onload = () => {
      if (!ok) return;
      const ms = Math.round(performance.now() - t0);
      setState({ status: "ok", width: img.naturalWidth, height: img.naturalHeight, ms, error: "" });
    };
    img.onerror = (e) => {
      if (!ok) return;
      const ms = Math.round(performance.now() - t0);
      const msg = (e?.message || "load error") + "";
      setState({ status: "error", width: 0, height: 0, ms, error: msg });
      // Hjälpsam logg i konsolen:
      // Markera 404 etc. tydligt
      // eslint-disable-next-line no-console
      console.warn(`[ImageProbe] FAIL ${src} (${ms} ms) â€” ${msg}`);
    };
    img.src = src;
    return () => {
      ok = false;
    };
  }, [src]);

  return state;
}

/**
 * ImageProbeRow
 * - Visar rad i debugtabell + renderar bilden själv.
 */
export function ImageProbeRow({ label, src, size = 72 }) {
  const p = useImageProbe(src);
  const color =
    p.status === "ok" ? "#16a34a" : p.status === "error" ? "#dc2626" : p.status === "loading" ? "#4b6bfa" : "#64748b";

  return (
    <div className="ipr-row">
      <div className="ipr-col label">{label}</div>
      <div className="ipr-col src"><code>{src || "â€”"}</code></div>
      <div className="ipr-col status" style={{ color }}>
        {p.status.toUpperCase()}
        {p.status !== "idle" ? ` â€¢ ${p.ms} ms` : ""}
      </div>
      <div className="ipr-col meta">{p.width && p.height ? `${p.width}Ã—${p.height}` : ""}</div>
      <div className="ipr-col thumb">
        {p.status === "ok" ? (
          <img src={src} alt="" style={{ width: size, height: size, objectFit: "cover", borderRadius: 8 }} />
        ) : (
          <div className="thumb-placeholder" />
        )}
      </div>
      <style>{`
        .ipr-row {
          display:grid;
          grid-template-columns: 180px 1fr 120px 110px 80px;
          gap:12px;
          align-items:center;
          padding:8px 0;
          border-bottom:1px dashed #E2E8F0;
        }
        .theme-dark .ipr-row { border-color:#243041; }
        .ipr-col.code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; }
        .thumb-placeholder { width:${size}px; height:${size}px; border-radius:8px; background:#E5E7EB; }
        .theme-dark .thumb-placeholder { background:#1f2937; }
        .src code { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display:block; }
      `}</style>
    </div>
  );
}
