import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { attachRefToUrl, getUtm } from "@core/AffiliateManager";

export default function GoRedirect() {
  const [sp] = useSearchParams();

  useEffect(() => {
    const target = sp.get("to");
    if (!target) return;

    // bevara ref & UTM
    let url = attachRefToUrl(target);
    const utm = getUtm() || {};
    for (const [k, v] of Object.entries(utm)) {
      if (!v || k === "ts") continue;
      const key = `utm_${k}`;
      const sep = url.includes("?") ? "&" : "?";
      url = `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(v)}`;
    }
    try { window.location.replace(url); } catch { window.location.href = url; }
  }, [sp]);

  return <div className="container section-lg">Skickar vidare…</div>;
}
