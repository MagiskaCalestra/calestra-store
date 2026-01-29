// apps/admin/src/core/featureFlags.js
export function isTestLaunch() {
  try {
    // default: test launch ON tills du flippar
    const v = import.meta?.env?.VITE_TEST_LAUNCH_MODE;
    if (v === undefined || v === null || v === "") return true;
    return String(v).trim() === "1" || String(v).trim().toLowerCase() === "true";
  } catch {
    return true;
  }
}

export const Feature = {
  orders: true,     // ALWAYS on
  reports: true,    // ALWAYS on
  ingest: true,     // ALWAYS on

  finance: false,   // testlaunch: off (men health i QA kan vara on)
  analytics: false, // testlaunch: off

  // när du vill:
  enableFinanceUI() { return !isTestLaunch(); },
  enableAnalyticsUI() { return !isTestLaunch(); },
};
