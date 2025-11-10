let inited = false;

export function initPageView() {
  if (inited) return;
  // Här kan du initiera GA4/gtag om VITE_GA_MEASUREMENT_ID finns
  // window.dataLayer = window.dataLayer || [];
  inited = true;
}
export function trackPageView(path) {
  if (!inited) return;
  // gtag("event", "page_view", { page_location: path });
}
export function teardownAnalytics() {
  // Ingen riktig teardown för gtag, men vi kan blockera vidare events
  // (låt inited vara som det är; vi skickar inga events utan consent).
}
