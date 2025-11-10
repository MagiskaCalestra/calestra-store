// apps/web/src/data/partners.js
// Struktur för partnerdata + spårningshjälpare

/**
 * Hjälpare som lägger på UTM/ref-parametrar.
 * withTracking("https://exempel.com", {campaign:"portal", medium:"partner"})
 */
export function withTracking(rawUrl, ctx = {}) {
  try {
    const u = new URL(rawUrl);
    const qs = u.searchParams;

    // ev. sparad referral (från din /go-redirect eller liknande)
    const storedRef = (typeof window !== "undefined" && localStorage.getItem("affiliate_ref")) || "";
    if (storedRef) qs.set("ref", storedRef);

    // UTM standard
    if (ctx.source) qs.set("utm_source", ctx.source);
    qs.set("utm_medium", ctx.medium || "partner");
    if (ctx.campaign) qs.set("utm_campaign", ctx.campaign);

    // valfri extra metadata
    if (ctx.extra && typeof ctx.extra === "object") {
      Object.entries(ctx.extra).forEach(([k, v]) => qs.set(k, v));
    }

    u.search = qs.toString();
    return u.toString();
  } catch {
    return rawUrl; // om ogiltig URL – returnera original
  }
}

/** Namngiven export som dina komponenter förväntar sig */
export const PARTNERS = [
  {
    id: "google",
    name: "Google",
    role: "Annons-partner",
    type: "ads",
    url: "https://ads.google.com/",
    logo: "/img/partners/google.svg",
  },
  {
    id: "youtube",
    name: "YouTube",
    role: "Huvudsajt (video)",
    type: "media",
    url: "https://youtube.com/",
    logo: "/img/partners/youtube.svg",
  },
  {
    id: "meta",
    name: "Meta",
    role: "Social / annonser",
    type: "ads",
    url: "https://www.facebook.com/business/ads",
    logo: "/img/partners/meta.svg",
  },
  {
    id: "printful",
    name: "Printful",
    role: "Fulfillment",
    type: "ops",
    url: "https://www.printful.com/",
    logo: "/img/partners/printful.svg",
  },
  {
    id: "vercel",
    name: "Vercel",
    role: "Deploy",
    type: "infra",
    url: "https://vercel.com/",
    logo: "/img/partners/vercel.svg",
  },
];

/** (Valfritt) default-export om något i koden råkar använda default */
export default PARTNERS;
