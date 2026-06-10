// D:\WebProjects\Calestra\apps\store-classic\src\analytics\AnalyticsAuto.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, trackEvent, flushAnalyticsQueue } from "./analyticsClient.js";

export default function AnalyticsAuto({ appName = "store-classic" }) {
  const loc = useLocation();

  React.useEffect(() => {
    trackPageView(loc.pathname + (loc.search || ""), { appName });
    flushAnalyticsQueue().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, loc.search]);

  React.useEffect(() => {
    const onError = (ev) => {
      trackEvent("error", "window.onerror", {
        app: appName,
        meta: {
          message: ev?.message,
          filename: ev?.filename,
          lineno: ev?.lineno,
          colno: ev?.colno,
        },
      });
    };

    const onRejection = (ev) => {
      trackEvent("error", "unhandledrejection", {
        app: appName,
        meta: { reason: String(ev?.reason?.message || ev?.reason || "unknown") },
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [appName]);

  return null;
}
