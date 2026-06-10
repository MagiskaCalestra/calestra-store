// D:\WebProjects\Calestra\apps\store-classic\src\components\ShopFilters.jsx
import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ShopFilters(props) {
  const {
    q, setQ,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    sort, setSort,
    feelings = [], setFeelings,
    onlyLimited, setOnlyLimited,
    onlySupport, setOnlySupport,
    onlyInStock, setOnlyInStock,
    onReset
  } = props;

  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  /* ---------- Helpers ---------- */
  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);

    if (value === null || value === "" || value === false) {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    setSearchParams(next, { replace: true });
  };

  /* ---------- Options ---------- */
  const feelOptions = useMemo(() => [
    { key: "joy", label: t("feel.joy") },
    { key: "dreamy", label: t("feel.dreamy") },
    { key: "practical", label: t("feel.practical") },
    { key: "present", label: t("feel.present") },
    { key: "cozy", label: t("feel.cozy") },
    { key: "warm", label: t("feel.warm") }
  ], [t]);

  const sortOptions = useMemo(() => [
    { key: "featured", label: t("shop.sortOptions.featured") },
    { key: "new", label: t("shop.sortOptions.new") },
    { key: "price-asc", label: t("shop.sortOptions.priceAsc") },
    { key: "price-desc", label: t("shop.sortOptions.priceDesc") }
  ], [t]);

  /* ---------- Handlers ---------- */
  const handleQueryChange = (val) => {
    setQ?.(val);
    updateParam("q", val);
  };

  const handleMinPrice = (val) => {
    const num = val ? Number(val) : "";
    setMinPrice?.(num);
    updateParam("min", num);
  };

  const handleMaxPrice = (val) => {
    const num = val ? Number(val) : "";
    setMaxPrice?.(num);
    updateParam("max", num);
  };

  const handleSort = (val) => {
    setSort?.(val);
    updateParam("sort", val);
  };

  const toggleFeel = (key) => {
    const has = feelings.includes(key);
    const next = has
      ? feelings.filter((k) => k !== key)
      : [...feelings, key];

    setFeelings?.(next);
    updateParam("feel", next.join(","));
  };

  const toggleBool = (key, setter, value) => {
    setter?.(value);
    updateParam(key, value ? "1" : "");
  };

  const resetAll = () => {
    onReset?.();
    setSearchParams({}, { replace: true });
  };

  /* ---------- UI ---------- */
  return (
    <aside className="shop-filters" aria-label={t("shop.filters.title")}>

      {/* Search */}
      <div className="filter-block">
        <label className="filter-label">{t("shop.filters.search")}</label>
        <div className="row">
          <input
            type="search"
            placeholder={t("shop.filters.searchPlaceholder")}
            value={q || ""}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
          <button className="btn ghost" onClick={() => handleQueryChange("")}>
            {t("shop.reset")}
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="filter-block">
        <span className="filter-label">{t("shop.filters.priceRange")}</span>
        <div className="row">
          <input
            type="number"
            placeholder={t("shop.filters.minPricePlaceholder")}
            value={minPrice ?? ""}
            onChange={(e) => handleMinPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder={t("shop.filters.maxPricePlaceholder")}
            value={maxPrice ?? ""}
            onChange={(e) => handleMaxPrice(e.target.value)}
          />
        </div>
      </div>

      {/* Sort */}
      <div className="filter-block">
        <label className="filter-label">{t("shop.filters.sortBy")}</label>
        <select value={sort || "featured"} onChange={(e) => handleSort(e.target.value)}>
          {sortOptions.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Feel */}
      <div className="filter-block">
        <span className="filter-label">{t("shop.tags")}</span>
        <div className="chip-row" role="group" aria-label={t("shop.tags")}>
          {feelOptions.map(opt => {
            const active = feelings.includes(opt.key);
            return (
              <button
                key={opt.key}
                className={`chip ${active ? "active" : ""}`}
                onClick={() => toggleFeel(opt.key)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="filter-block">
        <label>
          <input
            type="checkbox"
            checked={!!onlyLimited}
            onChange={(e) => toggleBool("limited", setOnlyLimited, e.target.checked)}
          />
          {t("shop.filters.onlyLimited")}
        </label>

        <label>
          <input
            type="checkbox"
            checked={!!onlySupport}
            onChange={(e) => toggleBool("support", setOnlySupport, e.target.checked)}
          />
          {t("shop.filters.onlySupport")}
        </label>

        <label>
          <input
            type="checkbox"
            checked={!!onlyInStock}
            onChange={(e) => toggleBool("stock", setOnlyInStock, e.target.checked)}
          />
          {t("shop.filters.inStockOnly")}
        </label>
      </div>

      {/* Reset */}
      <div className="filter-actions">
        <button className="btn ghost" onClick={resetAll}>
          {t("shop.reset")}
        </button>
      </div>

    </aside>
  );
}