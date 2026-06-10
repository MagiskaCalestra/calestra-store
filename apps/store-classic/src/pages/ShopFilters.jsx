// apps/store-classic/src/pages/ShopFilters.jsx
import React from "react";
import { useSearchParams } from "react-router-dom";

export default function ShopFilters() {
  const [params, setParams] = useSearchParams();
  const sort = params.get("sort") || "featured";
  const limited = params.get("limited") === "1";
  const instock = params.get("instock") === "1";
  const support = params.get("support") === "1";

  function set(k, v) {
    const p = new URLSearchParams(params);
    if (v === null || v === "" || v === false) p.delete(k);
    else p.set(k, String(v));
    setParams(p, { replace: true });
  }

  return (
    <div className="filters">
      <input
        placeholder="Sök produkterâ€¦"
        defaultValue={params.get("q") || ""}
        onKeyDown={(e) => e.key === "Enter" && set("q", e.currentTarget.value)}
      />
      <select value={sort} onChange={(e) => set("sort", e.target.value)}>
        <option value="featured">Utvalda</option>
        <option value="newest">Nyast</option>
        <option value="price_asc">Pris â†‘</option>
        <option value="price_desc">Pris â†“</option>
        <option value="popular">Populärast</option>
      </select>
      <label><input type="checkbox" checked={instock} onChange={e=>set("instock", e.target.checked ? 1 : null)} /> I lager</label>
      <label><input type="checkbox" checked={limited} onChange={e=>set("limited", e.target.checked ? 1 : null)} /> Endast limiterat</label>
      <label><input type="checkbox" checked={support} onChange={e=>set("support", e.target.checked ? 1 : null)} /> Supportpaket</label>
      <style>{`
        .filters{position:sticky;top:64px;z-index:20;background:var(--bg);
          border:1px solid var(--border);border-radius:14px;display:flex;
          gap:10px;align-items:center;padding:10px 12px;margin-bottom:16px}
        .filters input,.filters select{border:1px solid var(--c-border,#d7dbe3);
          border-radius:10px;padding:8px 10px;background:var(--c-input,#fff)}
        @media (max-width:720px){.filters{flex-wrap:wrap}}
      `}</style>
    </div>
  );
}
