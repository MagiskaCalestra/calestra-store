// Simple localStorage-based consent store
const KEY = "cw.consent.v1";

// shape: { status: 'unset'|'essential'|'granted', analytics: boolean, marketing: boolean, ts: number }
export function getConsent() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { status: "unset", analytics: false, marketing: false, ts: 0 };
    const parsed = JSON.parse(raw);
    return {
      status: parsed?.status ?? "unset",
      analytics: !!parsed?.analytics,
      marketing: !!parsed?.marketing,
      ts: Number(parsed?.ts || 0),
    };
  } catch {
    return { status: "unset", analytics: false, marketing: false, ts: 0 };
  }
}

export function setConsent(next) {
  try {
    const cur = getConsent();
    const val = {
      status: next?.status ?? cur.status ?? "unset",
      analytics: !!(next?.analytics ?? cur.analytics),
      marketing: !!(next?.marketing ?? cur.marketing),
      ts: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(val));
    return val;
  } catch {
    return getConsent();
  }
}

// <-- Ny export som CookieBanner behöver
export function clearConsent() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  return { status: "unset", analytics: false, marketing: false, ts: 0 };
}

export function hasAnalyticsConsent() {
  const c = getConsent();
  // analytics==true = samtycke ok för analys/affiliate-tracking
  return !!c.analytics;
}
