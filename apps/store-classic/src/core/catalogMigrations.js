// apps/store-classic/src/core/catalogMigrations.js
export function runCatalogMigrations() {
  try {
    const productKey = "calestra.products.v1";
    const cartKey = "calestra.cart.v2";

    // --- Rensa produkter ---
    const raw = localStorage.getItem(productKey);
    if (raw) {
      const arr = JSON.parse(raw);
      const cleaned = (Array.isArray(arr) ? arr : []).filter(
        (p) => p?.id !== "support-001" && p?.slug !== "support-light-pack"
      );
      localStorage.setItem(productKey, JSON.stringify(cleaned));
    }

    // --- Rensa kundvagn ---
    const cartRaw = localStorage.getItem(cartKey);
    if (cartRaw) {
      const cart = JSON.parse(cartRaw);
      const cleanedCart = (Array.isArray(cart) ? cart : []).filter(
        (it) => it?.id !== "support-001" && it?.slug !== "support-light-pack"
      );
      localStorage.setItem(cartKey, JSON.stringify(cleanedCart));
    }
  } catch (err) {
    console.warn("Migrationsfel:", err);
  }
}
