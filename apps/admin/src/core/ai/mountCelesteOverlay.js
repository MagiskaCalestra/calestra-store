// apps/admin/src/core/ai/mountCelesteOverlay.js
import React from "react";
import { createRoot } from "react-dom/client";
import CelesteOverlay from "../../components/CelesteOverlay.jsx";

function ensureHost() {
  let el = document.getElementById("cw-celeste-host");
  if (!el) {
    el = document.createElement("div");
    el.id = "cw-celeste-host";
    document.body.appendChild(el);
  }
  return el;
}

export default function mountCelesteOverlay() {
  if (typeof window === "undefined") return;
  const host = ensureHost();
  const root = createRoot(host);
  root.render(React.createElement(CelesteOverlay, { appName: "admin" }));
}

mountCelesteOverlay();
