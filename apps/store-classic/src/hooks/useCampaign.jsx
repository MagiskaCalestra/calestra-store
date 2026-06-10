// D:\WebProjects\Calestra\apps\store-classic\src\hooks\useCampaign.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import {
  CAMPAIGN_OVERRIDE_EVENT,
  CAMPAIGN_OVERRIDE_LS_KEY,
  getActiveCampaign,
  normalizeCampaignLang,
} from "../core/campaignEngine.js";

export function useCampaign() {
  const { i18n } = useTranslation();
  const lang = normalizeCampaignLang(i18n?.resolvedLanguage || i18n?.language || "sv");

  const [campaign, setCampaign] = React.useState(() => getActiveCampaign(new Date(), lang));

  React.useEffect(() => {
    function sync() {
      setCampaign(getActiveCampaign(new Date(), lang));
    }

    sync();

    function onFocus() {
      sync();
    }

    function onStorage(e) {
      if (!e || e.key === CAMPAIGN_OVERRIDE_LS_KEY) {
        sync();
      }
    }

    function onOverrideChanged() {
      sync();
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener(CAMPAIGN_OVERRIDE_EVENT, onOverrideChanged);

    let lastCookieValue = "";

    function readOverrideCookie() {
      try {
        const match = document.cookie.match(/(?:^|;\s*)cw_campaign_override=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : "";
      } catch {
        return "";
      }
    }

    const pollId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;

      const next = readOverrideCookie();
      if (next !== lastCookieValue) {
        lastCookieValue = next;
        sync();
      }
    }, 1200);

    const longId = window.setInterval(sync, 30 * 60 * 1000);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CAMPAIGN_OVERRIDE_EVENT, onOverrideChanged);
      window.clearInterval(pollId);
      window.clearInterval(longId);
    };
  }, [lang]);

  return campaign;
}

export default useCampaign;