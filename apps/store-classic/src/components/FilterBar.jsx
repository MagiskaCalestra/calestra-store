// D:\WebProjects\Calestra\apps\store-classic\src\components\FilterBar.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useFilters } from "../context/FilterContext.jsx";
import { MOODS, MOOD_META } from "./FeelingBar.jsx";

function normalizeLang(lang = "sv") {
  const b = String(lang || "sv").slice(0, 2).toLowerCase();
  return b === "sv" || b === "en" || b === "tr" ? b : "sv";
}

function labelForMood(tag, t, lang = "sv") {
  const L = normalizeLang(lang);
  const fallback = MOOD_META[tag]?.[L] || MOOD_META[tag]?.sv || tag;
  return t(`shop.feel.${tag}`, fallback);
}

function noteForMood(tag, t, lang = "sv") {
  const L = normalizeLang(lang);
  const fallback = MOOD_META[tag]?.note?.[L] || MOOD_META[tag]?.note?.sv || "";
  return t(`shop.feel.${tag}.note`, fallback);
}

export default function FilterBar({ categories = [] }) {
  const { t, i18n } = useTranslation();
  const lang = normalizeLang(i18n?.language || "sv");

  const {
    state,
    setQuery,
    setCategories,
    toggleFeel,
    setPriceMax,
    setFlags,
    setSort,
    resetAll,
  } = useFilters();

  function toggleCategory(c) {
    const set = new Set(state.categories || []);
    set.has(c) ? set.delete(c) : set.add(c);
    setCategories(Array.from(set));
  }

  const feelActive = new Set(Array.isArray(state.feel) ? state.feel : []);

  const activeCount =
    (state.categories?.length || 0) +
    (state.feel?.length || 0) +
    (state.flags?.limited ? 1 : 0) +
    (state.flags?.support ? 1 : 0) +
    (state.flags?.inStock ? 1 : 0) +
    (state.priceMax ? 1 : 0) +
    (state.q ? 1 : 0);

  return (
    <div className="filterbar" role="region" aria-label={t("shop.filters", "Filter")}>
      <div className="filterbar-top">
        <div className="filterbar-head">
          <div className="filterbar-kicker">
            {t("shop.filtersKicker", "MOOD FILTER")}
          </div>

          <div className="filterbar-title-row">
            <div className="filterbar-title-wrap">
              <h2 className="filterbar-title">
                {t("shop.filters", "Filter")}
              </h2>

              <p className="filterbar-sub">
                {t(
                  "shop.filtersSub",
                  "Välj känsla, stil och tempo. Calestra anpassar sig efter din vibe – inte efter gamla mallar."
                )}
              </p>
            </div>

            <div className="filterbar-meta">
              {activeCount > 0 ? (
                <span className="filterbar-count">
                  {t("shop.filtersActive", "{{n}} aktiva", { n: activeCount })}
                </span>
              ) : (
                <span className="filterbar-count filterbar-count--soft">
                  {t("shop.filtersReady", "Redo att filtrera")}
                </span>
              )}

              <button className="btn ghost" type="button" onClick={resetAll}>
                {t("shop.reset", "Återställ")}
              </button>
            </div>
          </div>
        </div>

        <div className="row row-main">
          <input
            className="search"
            placeholder={t("shop.search", "Sök produkter…")}
            value={state.q}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("shop.search", "Sök produkter…")}
          />

          <select
            className="sort"
            value={state.sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label={t("shop.sort", "Sortering")}
          >
            <option value="relevance">{t("shop.sort.relevance", "Relevans")}</option>
            <option value="price-asc">{t("shop.sort.asc", "Pris: Lågt → Högt")}</option>
            <option value="price-desc">{t("shop.sort.desc", "Pris: Högt → Lågt")}</option>
            <option value="new">{t("shop.sort.new", "Nyast")}</option>
          </select>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="block">
          <div className="block-label">{t("shop.categories", "Kategorier")}</div>

          <div className="row wrap">
            {categories.map((c) => {
              const active = (state.categories || []).includes(c);

              return (
                <button
                  key={c}
                  type="button"
                  className={`filterbar-chip ${active ? "on" : ""}`}
                  onClick={() => toggleCategory(c)}
                  aria-pressed={active}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="block">
        <div className="block-label">
          {t("shop.feelTitle", "Välj känsla")}
        </div>

        <div className="row wrap">
          {MOODS.map((tag) => {
            const on = feelActive.has(tag);
            const label = labelForMood(tag, t, lang);
            const note = noteForMood(tag, t, lang);

            return (
              <button
                key={tag}
                type="button"
                className={`filterbar-chip filterbar-chip--feel filterbar-chip--${tag} ${on ? "on" : ""}`}
                onClick={() => toggleFeel(tag)}
                title={note || label}
                aria-pressed={on}
              >
                <span className="filterbar-chip-main">{label}</span>
                <span className="filterbar-chip-sub">{note}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="block block--tools">
        <div className="block-label">{t("shop.refine", "Förfina")}</div>

        <div className="row wrap row-tools">
          <label className="price">
            <span>{t("shop.max", "max")}:</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={state.priceMax ?? ""}
              onChange={(e) => setPriceMax(e.target.value)}
              aria-label={t("shop.max", "max")}
            />
          </label>

          <label className={`flag ${state.flags?.limited ? "is-on" : ""}`}>
            <input
              type="checkbox"
              checked={!!state.flags?.limited}
              onChange={(e) => setFlags({ limited: e.target.checked })}
            />
            <span>{t("shop.flag.limited", "Begränsad")}</span>
          </label>

          <label className={`flag ${state.flags?.support ? "is-on" : ""}`}>
            <input
              type="checkbox"
              checked={!!state.flags?.support}
              onChange={(e) => setFlags({ support: e.target.checked })}
            />
            <span>{t("shop.flag.support", "Support")}</span>
          </label>

          <label className={`flag ${state.flags?.inStock ? "is-on" : ""}`}>
            <input
              type="checkbox"
              checked={!!state.flags?.inStock}
              onChange={(e) => setFlags({ inStock: e.target.checked })}
            />
            <span>{t("shop.flag.inStock", "I lager")}</span>
          </label>
        </div>
      </div>

      <style>{css}</style>
    </div>
  );
}

const css = `
.filterbar {
  position: relative;
  z-index: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 0%, rgba(185, 215, 255, .26), transparent 30%),
    radial-gradient(circle at 95% 18%, rgba(241, 220, 167, .18), transparent 34%),
    linear-gradient(180deg, rgba(255,255,255,.97), rgba(248,250,252,.99));
  border: 1px solid rgba(185, 215, 255, 0.28);
  border-radius: 22px;
  padding: 14px;
  margin-bottom: 14px;
  box-shadow:
    0 14px 28px rgba(15, 23, 42, 0.06),
    0 0 0 1px rgba(255,255,255,.66) inset;
  touch-action: manipulation;
}

.filterbar::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, transparent, rgba(185, 215, 255, .13), transparent);
  opacity: .72;
}

.filterbar * {
  touch-action: manipulation;
}

.theme-dark .filterbar {
  background:
    radial-gradient(circle at 12% 0%, rgba(127, 180, 255, .20), transparent 34%),
    radial-gradient(circle at 92% 18%, rgba(214, 168, 79, .14), transparent 36%),
    linear-gradient(180deg, rgba(2,6,23,.94), rgba(11,18,32,.96));
  border-color: rgba(185, 215, 255, 0.18);
  box-shadow:
    0 16px 28px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(185,215,255,.05) inset;
}

.filterbar-top {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filterbar-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filterbar-kicker {
  display: inline-flex;
  align-self: flex-start;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(185, 215, 255, 0.24);
  border: 1px solid rgba(127, 180, 255, 0.20);
  color: #31527c;
  font-size: 11px;
  font-weight: 1000;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.theme-dark .filterbar-kicker {
  background: rgba(185,215,255,.10);
  border-color: rgba(185,215,255,.18);
  color: #dbeafe;
}

.filterbar-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.filterbar-title-wrap {
  min-width: 0;
}

.filterbar-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.06;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.theme-dark .filterbar-title {
  color: #f8fafc;
}

.filterbar-sub {
  margin: 6px 0 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 700;
  max-width: 66ch;
}

.theme-dark .filterbar-sub {
  color: #a9bad2;
}

.filterbar-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 0 0 auto;
}

.filterbar-count {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(185,215,255,.22);
  border: 1px solid rgba(127,180,255,.20);
  color: #0f172a;
  font-size: 12px;
  font-weight: 1000;
  white-space: nowrap;
}

.theme-dark .filterbar-count {
  background: rgba(185,215,255,.10);
  border-color: rgba(185,215,255,.18);
  color: #f8fafc;
}

.filterbar-count--soft {
  opacity: .82;
}

.row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.row.wrap {
  flex-wrap: wrap;
}

.row-main {
  flex-wrap: wrap;
}

.block {
  position: relative;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(127,180,255,.14);
}

.theme-dark .block {
  border-top-color: rgba(185,215,255,.12);
}

.block-label {
  margin-bottom: 8px;
  color: #64748b;
  font-size: 11px;
  font-weight: 1000;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.theme-dark .block-label {
  color: #a9bad2;
}

.search {
  flex: 1;
  min-width: 220px;
  height: 42px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(127,180,255,.26);
  background: rgba(255,255,255,.88);
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.search::placeholder {
  color: #94a3b8;
}

.search:focus {
  border-color: rgba(127,180,255,.62);
  box-shadow: 0 0 0 4px rgba(185,215,255,.24);
}

.theme-dark .search {
  background: rgba(2,6,23,.9);
  border-color: rgba(185,215,255,.20);
  color: #e5e7eb;
}

.theme-dark .search::placeholder {
  color: #64748b;
}

.sort {
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(127,180,255,.26);
  padding: 0 12px;
  font-size: 14px;
  font-weight: 800;
  background: rgba(255,255,255,.88);
  color: #111827;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.sort:focus {
  border-color: rgba(127,180,255,.62);
  box-shadow: 0 0 0 4px rgba(185,215,255,.24);
}

.theme-dark .sort {
  background: rgba(2,6,23,.9);
  border-color: rgba(185,215,255,.20);
  color: #e5e7eb;
}

.btn.ghost {
  height: 36px;
  border-radius: 999px;
  padding: 0 13px;
  background: rgba(255,255,255,.56);
  border: 1px solid rgba(127,180,255,.24);
  color: #111827;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}

.btn.ghost:hover {
  background: rgba(185,215,255,.18);
  border-color: rgba(127,180,255,.38);
}

.theme-dark .btn.ghost {
  background: rgba(255,255,255,.04);
  border-color: rgba(185,215,255,.18);
  color: #e5e7eb;
}

.theme-dark .btn.ghost:hover {
  background: rgba(185,215,255,.10);
}

.filterbar-chip {
  min-height: 36px;
  border-radius: 999px;
  padding: 6px 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255,255,255,.86);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 900;
  color: #0f172a;
  transition:
    transform .12s ease,
    background .12s ease,
    border-color .12s ease,
    color .12s ease,
    box-shadow .12s ease;
  -webkit-tap-highlight-color: transparent;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  line-height: 1.1;
}

.filterbar-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(127,180,255,.40);
  box-shadow: 0 8px 18px rgba(127,180,255,.12);
}

.filterbar-chip.on {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 58%, #7fb4ff 140%);
  color: #f9fafb;
  border-color: rgba(185,215,255,.48);
  box-shadow:
    0 10px 20px rgba(15,23,42,.14),
    0 0 22px rgba(127,180,255,.18);
}

.filterbar-chip--feel.on {
  background: linear-gradient(135deg, #1e3a5f 0%, #6c8fc9 58%, #f1dca7 145%);
  border-color: rgba(185,215,255,.52);
}

.filterbar-chip-main {
  font-weight: 1000;
}

.filterbar-chip-sub {
  margin-top: 2px;
  font-size: 10.5px;
  font-weight: 700;
  opacity: .68;
}

.filterbar-chip--soft {
  border-color: rgba(255,145,200,.26);
}

.filterbar-chip--dark {
  border-color: rgba(20,24,38,.24);
}

.filterbar-chip--premium {
  border-color: rgba(214,174,82,.30);
}

.filterbar-chip--cozy {
  border-color: rgba(255,170,90,.28);
}

.filterbar-chip--collector {
  border-color: rgba(150,120,255,.30);
}

.filterbar-chip--street {
  border-color: rgba(80,110,255,.28);
}

.filterbar-chip--gift {
  border-color: rgba(255,115,145,.28);
}

.filterbar-chip--practical {
  border-color: rgba(80,170,140,.28);
}

.theme-dark .filterbar-chip {
  background: rgba(2,6,23,.84);
  border-color: rgba(185,215,255,.16);
  color: #e5e7eb;
}

.theme-dark .filterbar-chip.on {
  background: linear-gradient(135deg, #dbeafe, #f8fafc);
  color: #0f172a;
  border-color: rgba(255,255,255,.42);
}

.theme-dark .filterbar-chip-sub {
  opacity: .72;
}

.block--tools {
  padding-bottom: 2px;
}

.row-tools {
  align-items: center;
}

.price {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.62);
  border: 1px solid rgba(127,180,255,.20);
  color: #334155;
  font-size: 13px;
  font-weight: 900;
}

.theme-dark .price {
  background: rgba(255,255,255,.04);
  border-color: rgba(185,215,255,.16);
  color: #cbd5e1;
}

.price input {
  width: 76px;
  height: 28px;
  border: 0;
  background: transparent;
  outline: none;
  color: inherit;
  font-weight: 900;
}

.flag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 11px;
  border-radius: 999px;
  background: rgba(255,255,255,.62);
  border: 1px solid rgba(127,180,255,.20);
  color: #334155;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.flag input {
  accent-color: #1e3a5f;
}

.flag.is-on {
  background: rgba(185,215,255,.22);
  border-color: rgba(127,180,255,.34);
}

.theme-dark .flag {
  background: rgba(255,255,255,.04);
  border-color: rgba(185,215,255,.16);
  color: #cbd5e1;
}

.theme-dark .flag.is-on {
  background: rgba(185,215,255,.12);
  border-color: rgba(185,215,255,.28);
}

@media (max-width: 640px) {
  .filterbar-title-row {
    flex-direction: column;
  }

  .filterbar-meta {
    width: 100%;
    justify-content: space-between;
  }

  .search {
    min-width: 100%;
  }

  .sort {
    width: 100%;
  }

  .filterbar-chip {
    max-width: 100%;
  }
}
`;