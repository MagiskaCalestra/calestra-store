// Synkar filter <-> URLSearchParams (pushState + popstate)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function useURLFilters(defaults) {
  const firstLoad = useRef(true);
  const [filters, setFilters] = useState(() => {
    const url = new URL(window.location.href);
    const qp = url.searchParams;
    return {
      q: qp.get("q") ?? defaults.q ?? "",
      min: qp.get("min") ?? defaults.min ?? "",
      max: qp.get("max") ?? defaults.max ?? "",
      limited: qp.get("limited") === "1" || defaults.limited || false,
      support: qp.get("support") === "1" || defaults.support || false,
      stock: qp.get("stock") === "1" || defaults.stock || false,
      sort: qp.get("sort") ?? defaults.sort ?? "popular",
      // taggar som csv
      tags: (qp.get("tags") ?? "").split(",").filter(Boolean),
      page: +(qp.get("page") ?? "1"),
    };
  });

  // Skriv till URL när filters ändras
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    const url = new URL(window.location.href);
    const qp = url.searchParams;
    const set = (k, v) => (v ? qp.set(k, v) : qp.delete(k));
    set("q", filters.q?.trim());
    set("min", filters.min);
    set("max", filters.max);
    set("limited", filters.limited ? "1" : "");
    set("support", filters.support ? "1" : "");
    set("stock", filters.stock ? "1" : "");
    set("sort", filters.sort);
    set("tags", filters.tags?.length ? filters.tags.join(",") : "");
    set("page", String(filters.page || 1));
    history.pushState({}, "", url.toString());
  }, [filters]);

  // Läs tillbaka vid back/forward
  useEffect(() => {
    function onPop() {
      const url = new URL(window.location.href);
      const qp = url.searchParams;
      setFilters((f) => ({
        ...f,
        q: qp.get("q") ?? "",
        min: qp.get("min") ?? "",
        max: qp.get("max") ?? "",
        limited: qp.get("limited") === "1",
        support: qp.get("support") === "1",
        stock: qp.get("stock") === "1",
        sort: qp.get("sort") ?? "popular",
        tags: (qp.get("tags") ?? "").split(",").filter(Boolean),
        page: +(qp.get("page") ?? "1"),
      }));
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const update = useCallback((patch) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const reset = useCallback(() => setFilters({ ...defaults, page: 1 }), [defaults]);

  return { filters, setFilters: update, reset };
}
