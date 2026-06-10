// D:\WebProjects\Calestra\apps\store-classic\src\hooks\useLaunchGate.js
import React from "react";

const API_BASE =
  import.meta?.env?.VITE_PUBLIC_API_BASE || "https://magiskacalestra.se";

const DEFAULT_BUY_LIMIT = 4;
const DEFAULT_PREORDER_LIMIT = 1;

function cleanString(value, max = 240) {
  const s = value == null ? "" : String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function cleanSlug(value) {
  return cleanString(value, 180)
    .toLowerCase()
    .replace(/[^a-z0-9._:-]/g, "");
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function truthyFlag(value) {
  if (value === true) return true;
  if (value === false) return false;

  const s = String(value ?? "").trim().toLowerCase();

  return [
    "1",
    "true",
    "yes",
    "y",
    "preorder",
    "pre-order",
    "pre_order",
    "reserve",
    "reservation",
    "notify",
    "notify_me",
    "notify-me",
    "notify me",
    "back_in_stock",
    "back-in-stock",
    "back in stock",
    "watch_only",
    "watch-only",
    "coming_soon",
    "coming-soon",
    "launch_only",
  ].includes(s);
}

function normalizeCtaMode(value) {
  const s = normalizeText(value);

  if (!s) return "";
  if (s === "pre order") return "preorder";
  if (s === "notify me") return "notify";
  if (s === "back in stock") return "notify";

  return s;
}

function detectBaseCtaMode(product) {
  if (!product || typeof product !== "object") return "buy";

  const direct = normalizeCtaMode(product.ctaMode);
  if (direct === "buy" || direct === "preorder" || direct === "notify") return direct;

  const notifyFlags = [
    product.notifyMe,
    product.notify_me,
    product.notifyOnly,
    product.backInStockOnly,
    product.watchOnly,
    product.meta?.notifyMe,
    product.meta?.notifyOnly,
    product.meta?.backInStockOnly,
    product.flags?.notifyMe,
    product.flags?.backInStockOnly,
  ];

  if (notifyFlags.some(truthyFlag)) return "notify";

  const preorderFlags = [
    product.preorder,
    product.isPreorder,
    product.preOrder,
    product.preorderActive,
    product.preorderOnly,
    product.comingSoon,
    product.launchOnly,
    product.meta?.preorder,
    product.meta?.isPreorder,
    product.meta?.preOrder,
    product.meta?.preorderOnly,
    product.meta?.comingSoon,
    product.meta?.launchOnly,
    product.flags?.preorder,
    product.flags?.comingSoon,
    product.flags?.launchOnly,
  ];

  if (preorderFlags.some(truthyFlag)) return "preorder";

  const fulfillment = normalizeCtaMode(
    product.fulfillmentType ||
      product.availabilityType ||
      product.meta?.fulfillmentType ||
      product.meta?.availabilityType ||
      ""
  );

  if (fulfillment === "preorder") return "preorder";
  if (fulfillment === "notify") return "notify";

  return "buy";
}

function zeroVariants(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.map((variant) => ({
    ...variant,
    qty: 0,
    launchGateQtyBeforeClose: Number(variant?.qty || 0),
  }));
}

function notifyI18n(reason) {
  if (reason === "preorder_limit_reached") {
    return {
      sv: {
        notifyLabel: "Meddela mig",
        notifyNote:
          "Första förköpsplatsen är redan tagen. Lämna din e-post så meddelar vi dig när nästa våg öppnar.",
        availabilityLabel: "Nästa våg",
        availabilityText:
          "Förköpsgränsen är nådd. Produkten ligger kvar för intresseanmälan.",
      },
      en: {
        notifyLabel: "Notify me",
        notifyNote:
          "The first pre-order slot has already been taken. Leave your email and we will notify you when the next wave opens.",
        availabilityLabel: "Next wave",
        availabilityText:
          "The pre-order limit has been reached. The product remains open for interest.",
      },
      tr: {
        notifyLabel: "Bana haber ver",
        notifyNote:
          "İlk ön sipariş yeri alındı. E-postanızı bırakın, sonraki dalga açıldığında haber verelim.",
        availabilityLabel: "Sonraki dalga",
        availabilityText:
          "Ön sipariş sınırına ulaşıldı. Ürün ilgi bildirimi için açık kalır.",
      },
    };
  }

  return {
    sv: {
      notifyLabel: "Meddela mig",
      notifyNote:
        "Första live-vågen är slut. Lämna din e-post så meddelar vi dig när nästa våg öppnar.",
      availabilityLabel: "Nästa våg",
      availabilityText:
        "Live-gränsen är nådd. Produkten ligger kvar för intresseanmälan.",
    },
    en: {
      notifyLabel: "Notify me",
      notifyNote:
        "The first live wave is sold out. Leave your email and we will notify you when the next wave opens.",
      availabilityLabel: "Next wave",
      availabilityText:
        "The live limit has been reached. The product remains open for interest.",
    },
    tr: {
      notifyLabel: "Bana haber ver",
      notifyNote:
        "İlk canlı dalga tükendi. E-postanızı bırakın, sonraki dalga açıldığında haber verelim.",
      availabilityLabel: "Sonraki dalga",
      availabilityText:
        "Canlı satış sınırına ulaşıldı. Ürün ilgi bildirimi için açık kalır.",
    },
  };
}

function switchToNotify(product, gate, reason) {
  const extraI18n = notifyI18n(reason);

  return {
    ...product,

    ctaMode: "notify",
    fulfillmentType: "notify",
    availabilityType: "notify",
    availabilityLabel: extraI18n.sv.availabilityLabel,
    availabilityText: extraI18n.sv.availabilityText,
    status: "notify",
    badge: extraI18n.sv.notifyLabel,

    notifyOnly: true,
    notifyMe: true,
    backInStockOnly: true,
    notifyLabel: extraI18n.sv.notifyLabel,
    notifyNote: extraI18n.sv.notifyNote,

    preorder: false,
    isPreorder: false,
    preorderOnly: false,
    preorderActive: false,

    stock: 0,
    variants: zeroVariants(product),

    printfulEligible: false,
    launchGate: {
      ...(product.launchGate || {}),
      ...(gate || {}),
      enabled: true,
      effectiveCtaMode: "notify",
      previousCtaMode: detectBaseCtaMode(product),
      reason,
      closedAtClient: new Date().toISOString(),
    },

    i18n: {
      ...(product.i18n || {}),
      sv: {
        ...(product.i18n?.sv || {}),
        ...extraI18n.sv,
      },
      en: {
        ...(product.i18n?.en || {}),
        ...extraI18n.en,
      },
      tr: {
        ...(product.i18n?.tr || {}),
        ...extraI18n.tr,
      },
    },
  };
}

function applyGateToProduct(product, gate) {
  if (!product || typeof product !== "object") return product;

  const baseMode = detectBaseCtaMode(product);
  const safeGate = gate || {};

  const buyLimit = Number(safeGate.buyLimit || DEFAULT_BUY_LIMIT);
  const preorderLimit = Number(safeGate.preorderLimit || DEFAULT_PREORDER_LIMIT);

  const buyCount = Number(safeGate.buyCount || 0);
  const preorderCount = Number(safeGate.preorderCount || 0);

  if (baseMode === "buy" && buyCount >= buyLimit) {
    return switchToNotify(
      product,
      {
        ...safeGate,
        buyLimit,
        buyCount,
        buyRemaining: Math.max(0, buyLimit - buyCount),
      },
      "buy_limit_reached"
    );
  }

  if (baseMode === "preorder" && preorderCount >= preorderLimit) {
    return switchToNotify(
      product,
      {
        ...safeGate,
        preorderLimit,
        preorderCount,
        preorderRemaining: Math.max(0, preorderLimit - preorderCount),
      },
      "preorder_limit_reached"
    );
  }

  return {
    ...product,
    launchGate: {
      ...(product.launchGate || {}),
      ...(safeGate || {}),
      enabled: true,
      effectiveCtaMode: baseMode,
      previousCtaMode: baseMode,
      buyLimit,
      preorderLimit,
      buyCount,
      preorderCount,
      buyRemaining: Math.max(0, buyLimit - buyCount),
      preorderRemaining: Math.max(0, preorderLimit - preorderCount),
      reason: "",
    },
  };
}

async function fetchLaunchGate(slugs, signal) {
  const safeSlugs = Array.from(new Set((slugs || []).map(cleanSlug).filter(Boolean))).slice(0, 80);

  if (!safeSlugs.length) return {};

  const url = new URL("/api/launch-gate", API_BASE);
  url.searchParams.set("slugs", safeSlugs.join(","));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
    signal,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.detail || data?.error || `launch_gate_http_${res.status}`);
  }

  return data?.items && typeof data.items === "object" ? data.items : {};
}

export default function useLaunchGate(products, options = {}) {
  const enabled = options.enabled !== false;
  const refreshKey = String(options.refreshKey || "");

  const safeProducts = React.useMemo(
    () => (Array.isArray(products) ? products.filter(Boolean) : products ? [products] : []),
    [products]
  );

  const slugs = React.useMemo(
    () =>
      Array.from(
        new Set(safeProducts.map((product) => cleanSlug(product?.slug)).filter(Boolean))
      ),
    [safeProducts]
  );

  const [state, setState] = React.useState({
    loading: false,
    error: "",
    gates: {},
  });

  React.useEffect(() => {
    if (!enabled || !slugs.length) {
      setState({ loading: false, error: "", gates: {} });
      return;
    }

    let alive = true;
    const controller = new AbortController();

    async function run() {
      setState((prev) => ({ ...prev, loading: true, error: "" }));

      try {
        const gates = await fetchLaunchGate(slugs, controller.signal);

        if (!alive) return;

        setState({
          loading: false,
          error: "",
          gates,
        });
      } catch (e) {
        if (!alive || e?.name === "AbortError") return;

        setState({
          loading: false,
          error: String(e?.message || e),
          gates: {},
        });
      }
    }

    run();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [enabled, slugs.join(","), refreshKey]);

  const gatedProducts = React.useMemo(() => {
    if (!enabled) return safeProducts;

    return safeProducts.map((product) => {
      const slug = cleanSlug(product?.slug);
      const gate = slug ? state.gates?.[slug] : null;
      return applyGateToProduct(product, gate);
    });
  }, [enabled, safeProducts, state.gates]);

  const bySlug = React.useMemo(() => {
    const map = {};
    gatedProducts.forEach((product) => {
      const slug = cleanSlug(product?.slug);
      if (slug) map[slug] = product;
    });
    return map;
  }, [gatedProducts]);

  return {
    products: gatedProducts,
    bySlug,
    gates: state.gates,
    loading: state.loading,
    error: state.error,
  };
}