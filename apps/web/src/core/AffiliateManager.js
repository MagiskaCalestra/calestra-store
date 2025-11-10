// Enkel, robust affiliate-hantering för WEB (ingen extern beroendekedja)

const REF_KEY = "cw:ref";
const ADMIN_KEY = "cw.admin"; // används av admin-lås om du vill

function ensureRef() {
  try {
    let ref = localStorage.getItem(REF_KEY);
    if (!ref) {
      ref = "cw-" + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(REF_KEY, ref);
    }
    return ref;
  } catch {
    return "cw";
  }
}

export function attachRefToUrl(url) {
  try {
    const u = new URL(url, window.location.origin);
    const ref = ensureRef();
    if (!u.searchParams.has("ref")) u.searchParams.set("ref", ref);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "calestra-world");
    return u.toString();
  } catch {
    return url;
  }
}

/** Dekorera alla <a data-affiliate="true"> inom root (default: document) */
export function decorateAnchors(root = document) {
  try {
    const links = root.querySelectorAll('a[data-affiliate="true"]');
    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      a.setAttribute("href", attachRefToUrl(href));
    });
  } catch {}
}

/** Init: spara ref/utm från URL → localStorage */
export function bootstrapAffiliate() {
  try {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref") || url.searchParams.get("cw_ref");
    if (ref) localStorage.setItem(REF_KEY, ref);
  } catch {}
}

/** Track + öppna länk (om given) */
export function clickTrack(name, url, meta = {}) {
  try {
    // Enkel logg – byt mot riktig analytics när som helst
    console.info("[track] click", { name, url, ...meta, ref: ensureRef() });
  } catch {}
  if (url) {
    const finalUrl = attachRefToUrl(url);
    if (/^https?:\/\//i.test(finalUrl)) window.open(finalUrl, "_blank", "noopener,noreferrer");
    else window.location.href = finalUrl;
  }
}

export default {
  attachRefToUrl,
  decorateAnchors,
  bootstrapAffiliate,
  clickTrack,
};
