import React from "react";
import { useLocation } from "react-router-dom";
import { bootstrapAffiliate } from "@core/AffiliateManager";
import { ensureFreshFX } from "@core/FX";

export default function AffiliateInit(){
  const loc = useLocation();
  React.useEffect(() => {
    bootstrapAffiliate();
    ensureFreshFX(); // hämta/refresh valutakurser i bakgrunden
  }, [loc.pathname, loc.search]);
  return null;
}
