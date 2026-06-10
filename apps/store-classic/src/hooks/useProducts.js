import { useEffect, useState } from "react";
import { listProducts } from "../api/products";

/**
 * useProducts v2
 * - Läser produkter lokalt (ingen network fetch)
 * - Klarar tomma listor och fel utan att krascha
 */
export default function useProducts() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const items = await listProducts();
        if (!cancelled) {
          setData(Array.isArray(items) ? items : []);
          setError(null);
        }
      } catch (err) {
        console.error("[useProducts] error:", err);
        if (!cancelled) {
          setData([]);
          setError(err?.message || "Failed to load products");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error };
}
