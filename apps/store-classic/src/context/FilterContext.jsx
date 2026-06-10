import React from "react";

/**
 * FilterContext v2 (Store)
 * - Matchar din Shop.jsx: setQuery, setFeel, setFlags, setSort, setPriceMax
 * - Behåller även categories (för FilterBar)
 */

const DEFAULT = {
  q: "",
  categories: [],
  feel: [], // <-- NY: feelings/tags (cozy, warm, gift, etc)
  priceMax: null,
  flags: { limited: false, support: false, inStock: false },
  sort: "relevance",
};

function sanitize(state) {
  const s = { ...DEFAULT, ...(state || {}) };

  // q
  s.q = String(s.q || "");

  // categories
  if (!Array.isArray(s.categories)) s.categories = [];
  s.categories = s.categories.map(String).filter(Boolean);

  // feel
  if (!Array.isArray(s.feel)) s.feel = [];
  s.feel = s.feel.map((x) => String(x || "").trim().toLowerCase()).filter(Boolean);

  // priceMax
  if (s.priceMax != null) {
    const n = Number(s.priceMax);
    s.priceMax = Number.isFinite(n) && n > 0 ? n : null;
  }

  // flags
  s.flags = {
    limited: !!s.flags?.limited,
    support: !!s.flags?.support,
    inStock: !!s.flags?.inStock,
  };

  // sort
  if (!["relevance", "price-asc", "price-desc", "new"].includes(s.sort)) {
    s.sort = "relevance";
  }

  return s;
}

const FilterContext = React.createContext(null);

export function FilterProvider({ children }) {
  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem("shop.filters.v2");
      return sanitize(raw ? JSON.parse(raw) : DEFAULT);
    } catch {
      return DEFAULT;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("shop.filters.v2", JSON.stringify(sanitize(state)));
    } catch {}
  }, [state]);

  const setQuery = React.useCallback((q) => {
    setState((s) => sanitize({ ...s, q: q ?? "" }));
  }, []);

  const setCategories = React.useCallback((arr) => {
    const v = Array.isArray(arr) ? arr : [];
    setState((s) => sanitize({ ...s, categories: v }));
  }, []);

  const setFeel = React.useCallback((arr) => {
    const v = Array.isArray(arr) ? arr : [];
    setState((s) => sanitize({ ...s, feel: v }));
  }, []);

  const toggleFeel = React.useCallback((name) => {
    const key = String(name || "").trim().toLowerCase();
    if (!key) return;
    setState((s) => {
      const cur = Array.isArray(s.feel) ? s.feel : [];
      const set = new Set(cur);
      set.has(key) ? set.delete(key) : set.add(key);
      return sanitize({ ...s, feel: Array.from(set) });
    });
  }, []);

  const setPriceMax = React.useCallback((val) => {
    setState((s) =>
      sanitize({
        ...s,
        priceMax: val == null || val === "" ? null : Number(val) > 0 ? Number(val) : null,
      })
    );
  }, []);

  const setFlags = React.useCallback((patch) => {
    setState((s) => sanitize({ ...s, flags: { ...s.flags, ...(patch || {}) } }));
  }, []);

  const setSort = React.useCallback((v) => {
    setState((s) => sanitize({ ...s, sort: v || "relevance" }));
  }, []);

  const resetAll = React.useCallback(() => setState(DEFAULT), []);

  const value = React.useMemo(
    () => ({
      state: sanitize(state),
      setState,
      setQuery,
      setCategories,
      setFeel,
      toggleFeel,
      setPriceMax,
      setFlags,
      setSort,
      resetAll,
    }),
    [state, setQuery, setCategories, setFeel, toggleFeel, setPriceMax, setFlags, setSort, resetAll]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = React.useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within <FilterProvider>");
  return ctx;
}
