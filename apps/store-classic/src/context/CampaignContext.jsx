import React, { createContext, useContext, useMemo } from "react";
import useCampaignMaster from "../hooks/useCampaign.jsx";

const CampaignContext = createContext(null);

function normalizeCampaignPayload(state) {
  const src =
    state?.resolvedCampaign ||
    state?.campaign ||
    state?.activeCampaign ||
    state?.current ||
    state ||
    {};

  const campaign =
    src && typeof src === "object"
      ? {
          ...src,
          key: String(src.key || src.id || src.campaignKey || "standard"),
          title: String(src.title || src.label || "Standard"),
          theme: String(src.theme || "neutral"),
        }
      : {
          key: "standard",
          title: "Standard",
          theme: "neutral",
        };

  return {
    ...state,
    campaign,
    resolvedCampaign: campaign,
    activeCampaign: campaign,
    current: campaign,
    override:
      state?.override ??
      state?.campaignOverride ??
      state?.manualOverride ??
      "",
  };
}

export function CampaignProvider({ children }) {
  const master = useCampaignMaster();
  const value = useMemo(() => normalizeCampaignPayload(master), [master]);

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error("useCampaign must be used inside <CampaignProvider>");
  }
  return ctx;
}

export default CampaignContext;