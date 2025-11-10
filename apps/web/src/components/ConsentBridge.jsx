// apps/web/src/components/ConsentBridge.jsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getConsent, hasConsent } from "@utils/consent";

// Din enkla analytics-loader — ersätt med GA/GTM vid behov
function bootAnalytics() {
  if (window.__analyticsBooted) return;
  window.__analyticsBooted = true;
  // ex: dynamiskt ladda GA4-script här om du vill
}
function teardownAnalytics() {
  window.__analyticsBooted = false;
  // ex: disable GA tracking (ga('consent','update',...)) om du kör GA
}

export default function ConsentBridge() {
  const loc = useLocation();

  useEffect(() => {
    const c = getConsent();
    if (c && (c.analytics || c.marketing)) bootAnalytics();
    else teardownAnalytics();

    const onChange = () => {
      if (hasConsent("analytics") || hasConsent("marketing")) bootAnalytics();
      else teardownAnalytics();
    };
    window.addEventListener("consent:change", onChange);
    window.addEventListener("consent:clear", onChange);
    return () => {
      window.removeEventListener("consent:change", onChange);
      window.removeEventListener("consent:clear", onChange);
    };
  }, []);

  // track pageviews endast om analytics är godkänd
  useEffect(() => {
    if (hasConsent("analytics") && window.__analyticsBooted && window.gtag) {
      window.gtag("event", "page_view", { page_location: window.location.href });
    }
  }, [loc]);

  return null;
}
