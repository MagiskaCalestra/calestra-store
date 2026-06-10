// D:\WebProjects\Calestra\apps\store-classic\src\pages\checkout\checkoutConfig.js
// apps/store-classic/src/pages/checkout/checkoutConfig.js

function envValue(key, fallback = "") {
  try {
    const value =
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env[key];

    const clean = String(value || "").trim();
    return clean || fallback;
  } catch {
    return fallback;
  }
}

export const CHECKOUT_MODE = envValue("VITE_CHECKOUT_MODE", "preview");
export const IS_PREVIEW = String(CHECKOUT_MODE).toLowerCase() !== "live";

export const ORDER_REGISTER_URL = envValue(
  "VITE_ORDER_REGISTER_URL",
  "https://magiskacalestra.se/api/orders/register"
);

export const ORDERS_INGEST_URL = envValue("VITE_ORDERS_INGEST_URL", "");

export const CHECKOUT_DRAFT_URL = envValue(
  "VITE_CHECKOUT_DRAFT_URL",
  "https://magiskacalestra.se/api/checkout-draft"
);

export const DISCOUNT_VALIDATE_URL = envValue(
  "VITE_DISCOUNT_VALIDATE_URL",
  "https://magiskacalestra.se/api/discounts/validate"
);

export const CHECKOUT_DRAFT_ID_KEY = "cw.checkoutDraftId";
export const CHECKOUT_DRAFT_SNAPSHOT_KEY = "cw.checkoutDraft";
export const PENDING_ORDER_LS_KEY = "cw.orders.pendingServerWrite";
export const CHECKOUT_PREFILL_KEY = "cw.checkout.prefill";
export const MEMBER_PROFILE_CUSTOMER_KEY = "cw.member.profile.customer";
export const MEMBER_PROFILE_SHIPPING_KEY = "cw.member.profile.shipping";
export const MEMBER_PROFILE_BILLING_KEY = "cw.member.profile.billing";
export const ANALYTICS_QUEUE_KEY = "cw.analytics.queue.v1";
export const CHECKOUT_BEGIN_FALLBACK_KEY = "cw.checkout.begin_checkout.fallback.v1";

export const ORDER_LIST_KEY = "cw.orders";
export const ORDER_LAST_KEY = "cw.order.last";
export const ORDER_CURRENT_KEY = "cw.order.current";
export const PURCHASE_TRACKED_KEY = "cw.analytics.purchaseSuccessReported";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[0-9+\-().\s]{6,}$/;
export const ZIP_SE = /^\d{3}\s?\d{2}$/;
export const ZIP_US = /^\d{5}(-{1}\d{4})?$/;
export const ZIP_FALLBACK = /^[A-Za-z0-9\- ]{3,10}$/;