import { useMemo, useCallback } from "react";
import { useCart } from "../context/CartContext";

/**
 * Adapter som gör korgen robust även om contextet sparar
 * dubbletter eller inte uppdaterar qty korrekt.
 */
export default function useSafeCart() {
  const raw = useCart(); // { items, add, dec, remove, clear } (kan variera)

  // Grupp/merga per id och summera qty
  const items = useMemo(() => {
    const map = new Map();
    for (const it of raw.items || []) {
      const key = String(it.id);
      if (!map.has(key)) {
        map.set(key, {
          id: it.id,
          title: it.title,
          price: Number(it.price || 0),
          image: it.image,
          qty: 0,
        });
      }
      const rec = map.get(key);
      rec.qty += Number(it.qty || 1); // funkar både med dubbletter och qty-fält
    }
    return Array.from(map.values());
  }, [raw.items]);

  // Öka: lägg till en kopia av item (fungerar både vid qty & dubbletter)
  const onInc = useCallback(
    (it) => raw.add?.({ id: it.id, title: it.title, price: it.price, image: it.image }),
    [raw]
  );

  // Minska: om dec finns, använd den. Annars ta bort en instans (remove tar 1 st i de flesta impls)
  const onDec = useCallback(
    (it) => {
      if (raw.dec) raw.dec(it.id);
      else raw.remove?.(it.id); // fallback: ta bort en
    },
    [raw]
  );

  const remove = raw.remove;
  const clear = raw.clear;

  const totalQty = useMemo(() => items.reduce((s, x) => s + Number(x.qty || 0), 0), [items]);

  return { items, onInc, onDec, remove, clear, totalQty, __raw: raw };
}
