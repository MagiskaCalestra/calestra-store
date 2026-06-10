function norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_/]+/g, " ")
    .replace(/[^a-z0-9\u00C0-\u024F -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function arr(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function getSearchText(p) {
  return norm(
    [
      p?.title,
      p?.subtitle,
      p?.description,
      p?.badge,
      p?.status,
      p?.availabilityLabel,
      p?.availabilityText,
      p?.preorderLabel,
      p?.preorderNote,
      p?.notifyLabel,
      p?.notifyNote,
      p?.backInStockLabel,
      p?.backInStockNote,
      p?.slug,
      p?.id,
      p?.type,
      ...arr(p?.tags),
      ...arr(p?.categories),
      p?.i18n?.sv?.title,
      p?.i18n?.sv?.subtitle,
      p?.i18n?.sv?.description,
      p?.i18n?.en?.title,
      p?.i18n?.en?.subtitle,
      p?.i18n?.en?.description,
      p?.i18n?.tr?.title,
      p?.i18n?.tr?.subtitle,
      p?.i18n?.tr?.description,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

/**
 * 🔥 NY LOGIK (VIKTIG)
 * "i lager" betyder:
 * - köpbar (stock)
 * - preorder (kan beställas)
 * - notify (visas / upcoming / intresse)
 */
function isAvailable(p) {
  const mode = String(p?.ctaMode || "").toLowerCase();
  const availability = String(p?.availabilityType || "").toLowerCase();

  // ✅ Notify = ska visas
  if (
    p?.notifyOnly ||
    p?.notifyMe ||
    p?.backInStockOnly ||
    mode === "notify" ||
    availability === "notify"
  ) {
    return true;
  }

  // ✅ Preorder = ska visas
  if (
    mode === "preorder" ||
    p?.preorder ||
    p?.isPreorder ||
    p?.preOrder
  ) {
    return Number(p?.price || 0) > 0;
  }

  // ✅ Variant stock
  const variants = Array.isArray(p?.variants) ? p.variants : [];
  if (variants.some((v) => Number(v?.qty || 0) > 0)) return true;

  // ✅ Normal stock
  return Number(p?.stock || 0) > 0;
}

export function hasActiveFilters(f) {
  if (!f) return false;
  if ((f.q || "").trim() !== "") return true;
  if (Array.isArray(f.categories) && f.categories.length) return true;
  if (Array.isArray(f.feel) && f.feel.length) return true;
  if (f.priceMax != null && String(f.priceMax).trim() !== "") return true;
  if (f.flags?.limited || f.flags?.support || f.flags?.inStock) return true;
  if (f.sort && f.sort !== "relevance") return true;
  return false;
}

export function applyFilters(items, f) {
  if (!Array.isArray(items) || !items.length) return [];
  if (!hasActiveFilters(f)) return items;

  const q = norm(f?.q || "");
  let out = items.slice();

  if (q) {
    out = out.filter((p) => getSearchText(p).includes(q));
  }

  if (Array.isArray(f?.categories) && f.categories.length) {
    const wanted = new Set(f.categories.map(norm).filter(Boolean));

    out = out.filter((p) => {
      const cats = [
        ...arr(p?.categories),
        ...arr(p?.catalogCategories),
        p?.primaryCategory,
        p?.category,
      ]
        .map(norm)
        .filter(Boolean);

      return cats.some((c) => wanted.has(c));
    });
  }

  if (Array.isArray(f?.feel) && f.feel.length) {
    const wanted = new Set(f.feel.map(norm).filter(Boolean));

    out = out.filter((p) => {
      const feelings = [
        ...arr(p?.feelings),
        ...arr(p?.tags),
        p?.mood,
        p?.tone,
      ]
        .map(norm)
        .filter(Boolean);

      const set = new Set(feelings);

      for (const w of wanted) {
        if (!set.has(w)) return false;
      }

      return true;
    });
  }

  if (f?.priceMax != null && String(f.priceMax).trim() !== "") {
    const limit = Number(f.priceMax);
    if (Number.isFinite(limit)) {
      out = out.filter((p) => Number(p?.price || 0) <= limit);
    }
  }

  if (f?.flags?.limited) out = out.filter((p) => !!p?.limited);
  if (f?.flags?.support) out = out.filter((p) => !!p?.support);

  // 🔥 FIX: visa även notify + preorder
  if (f?.flags?.inStock) {
    out = out.filter(isAvailable);
  }

  switch (f?.sort) {
    case "price-asc":
      out.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
      break;

    case "price-desc":
      out.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
      break;

    case "new":
      out.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
      break;

    default:
      break;
  }

  return out;
}