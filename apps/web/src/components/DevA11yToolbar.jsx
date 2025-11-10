// apps/web/src/components/DevA11yToolbar.jsx
import React, { useEffect, useState } from "react";

export default function DevA11yToolbar() {
  const [show, setShow] = useState(false);
  const isDev =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
    (typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.hostname));

  useEffect(() => {
    if (!isDev) return;
    const saved = localStorage.getItem("a11yToolbar.show");
    setShow(saved !== "0");
  }, [isDev]);

  if (!isDev || !show) {
    return (
      <button
        type="button"
        aria-label="Toggle a11y toolbar"
        onClick={() => {
          setShow(true);
          localStorage.setItem("a11yToolbar.show", "1");
        }}
        style={{
          position: "fixed",
          bottom: 12,
          right: 12,
          zIndex: 10000,
          border: "1px solid rgba(255,255,255,.25)",
          borderRadius: 10,
          background: "rgba(12,16,36,.9)",
          color: "#fff",
          padding: "8px 10px",
          cursor: "pointer"
        }}
      >
        a11y
      </button>
    );
  }

  const box = {
    position: "fixed",
    right: 12,
    bottom: 12,
    zIndex: 10000,
    border: "1px solid rgba(255,255,255,.25)",
    borderRadius: 12,
    background: "rgba(12,16,36,.9)",
    color: "#fff",
    padding: 12,
    width: 280
  };

  function toggleOutline() {
    const flag = document.documentElement.getAttribute("data-debug-focus");
    const on = flag !== "1";
    document.documentElement.setAttribute("data-debug-focus", on ? "1" : "0");
    const cssId = "debug-focus-style";
    let el = document.getElementById(cssId);
    if (on && !el) {
      el = document.createElement("style");
      el.id = cssId;
      el.textContent = `
        *:focus { outline: 2px dashed #ffca3a !important; outline-offset: 2px !important; }
        *:focus-visible { outline: 2px dashed #ffca3a !important; outline-offset: 2px !important; }
      `;
      document.head.appendChild(el);
    } else if (!on && el) {
      el.remove();
    }
  }

  function toggleTabIndex() {
    // highlighting tabbables
    const cssId = "debug-tabindex-style";
    const on = !document.getElementById(cssId);
    if (on) {
      const st = document.createElement("style");
      st.id = cssId;
      st.textContent = `
        a, button, input, select, textarea, [tabindex] {
          box-shadow: 0 0 0 2px rgba(255,200,64,.6) !important;
        }
      `;
      document.head.appendChild(st);
    } else {
      document.getElementById(cssId)?.remove();
    }
  }

  function toggleAltCheck() {
    const cssId = "debug-alt-style";
    const on = !document.getElementById(cssId);
    if (on) {
      const st = document.createElement("style");
      st.id = cssId;
      st.textContent = `
        img:not([alt]), img[alt=""], img[alt=" "] {
          outline: 3px solid #ff595e !important;
        }
      `;
      document.head.appendChild(st);
    } else {
      document.getElementById(cssId)?.remove();
    }
  }

  return (
    <div style={box} role="dialog" aria-label="Accessibility tools">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>Accessibility tools</strong>
        <button
          type="button"
          onClick={() => {
            setShow(false);
            localStorage.setItem("a11yToolbar.show", "0");
          }}
          aria-label="Close a11y toolbar"
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,.3)",
            color: "#fff",
            borderRadius: 8,
            padding: "4px 8px",
            cursor: "pointer"
          }}
        >
          Close
        </button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <button type="button" onClick={toggleOutline} style={btn()}>Toggle focus outline</button>
        <button type="button" onClick={toggleTabIndex} style={btn()}>Highlight tabbables</button>
        <button type="button" onClick={toggleAltCheck} style={btn()}>Mark images without alt</button>
      </div>
    </div>
  );
}

function btn() {
  return {
    background: "transparent",
    border: "1px solid rgba(255,255,255,.3)",
    color: "#fff",
    borderRadius: 8,
    padding: "8px 10px",
    cursor: "pointer",
    textAlign: "left"
  };
}
