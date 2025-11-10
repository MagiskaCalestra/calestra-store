import { createScriptOnce, removeById } from "@utils/scriptLoader";
import { hasConsent } from "@utils/consent";

const GA_TAG_ID = "ga4-tag";
const GA_BOOT_ID = "ga4-boot";
const GADS_TAG_ID = "gads-tag";

let _gaId = null;
let _gadsId = null;
let _booted = false;

export function initAnalytics({ gaId, gadsId } = {}) {
  if (!hasConsent("analytics")) return;
  _gaId = gaId || import.meta.env.VITE_GA_MEASUREMENT_ID || "";
  _gadsId = gadsId || import.meta.env.VITE_GADS_ID || "";

  if (_gaId) {
    createScriptOnce({
      id: GA_TAG_ID,
      src: `https://www.googletagmanager.com/gtag/js?id=${_gaId}`,
      attrs: { async: "" },
    });
    createScriptOnce({
      id: GA_BOOT_ID,
      text: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config','${_gaId}',{send_page_view:false});
        window.__calestra_gtag = gtag;
      `,
    });
    _booted = true;
  }

  if (_gadsId && window.__calestra_gtag) {
    createScriptOnce({
      id: GADS_TAG_ID,
      src: `https://www.googletagmanager.com/gtag/js?id=${_gadsId}`,
      attrs: { async: "" },
    });
    window.__calestra_gtag("config", _gadsId);
  }
}

export function teardownAnalytics() {
  removeById(GA_TAG_ID);
  removeById(GA_BOOT_ID);
  removeById(GADS_TAG_ID);
  if (window.dataLayer) window.dataLayer.length = 0;
  delete window.__calestra_gtag;
  _booted = false;
}

export function trackPageView(pathname) {
  if (_booted && window.__calestra_gtag) {
    window.__calestra_gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: pathname,
      page_title: document.title || "Calestra",
    });
  }
}

export function trackEvent(name, params = {}) {
  if (_booted && window.__calestra_gtag) {
    window.__calestra_gtag("event", name, params);
  }
}
