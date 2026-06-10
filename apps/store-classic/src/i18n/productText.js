// D:\WebProjects\Calestra\apps\store-classic\src\i18n\productText.js

export function getProductText(product, t, field, fallback = "") {
  if (!product) return fallback;

  const slug = product.slug || product.id || "";
  const key = slug ? `products.${slug}.${field}` : "";

  try {
    if (key && typeof t === "function") {
      const translated = t(key, { defaultValue: "" });
      if (translated && translated !== key) return translated;
    }
  } catch {
    // ignore
  }

  return product?.[field] ?? fallback;
}

export function getProductView(product, t) {
  if (!product) return null;

  return {
    ...product,
    title: getProductText(product, t, "title", product.title || ""),
    description: getProductText(product, t, "description", product.description || ""),
    subtitle: getProductText(product, t, "subtitle", product.subtitle || ""),
    preorderLabel: getProductText(product, t, "preorderLabel", product.preorderLabel || ""),
    preorderNote: getProductText(product, t, "preorderNote", product.preorderNote || ""),
    preorderText: getProductText(product, t, "preorderText", product.preorderText || ""),
    preorderEta: getProductText(product, t, "preorderEta", product.preorderEta || ""),
    availabilityLabel: getProductText(
      product,
      t,
      "availabilityLabel",
      product.availabilityLabel || ""
    ),
    availabilityText: getProductText(
      product,
      t,
      "availabilityText",
      product.availabilityText || ""
    ),
    notifyLabel: getProductText(product, t, "notifyLabel", product.notifyLabel || ""),
    notifyNote: getProductText(product, t, "notifyNote", product.notifyNote || ""),
    badge: getProductText(product, t, "badge", product.badge || ""),
  };
}