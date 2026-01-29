// D:\WebProjects\Calestra\apps\admin-core\src\hooks\useStoreBridge.js
import { useEffect, useMemo, useState } from "react";
import {
  LS,
  readOrders,
  readCampaignOverride,
  readAudit,
  computeKpisFromOrders,
} from "../core/storeBridge";

export default function useStoreBridge() {
  const [orders, setOrders] = useState(() => readOrders());
  const [campaign, setCampaign] = useState(() => readCampaignOverride());
  const [audit, setAudit] = useState(() => readAudit(60));

  useEffect(() => {
    function refresh() {
      setOrders(readOrders());
      setCampaign(readCampaignOverride());
      setAudit(readAudit(60));
    }

    // fånga ändringar från andra flikar + egen dispatch
    function onStorage(e) {
      if (!e || !e.key) return refresh();
      if (e.key === LS.ORDERS || e.key === LS.CAMPAIGN || e.key === LS.AUDIT) {
        refresh();
      }
    }

    window.addEventListener("storage", onStorage);
    // liten poll som “failsafe” om vissa events missas
    const iv = window.setInterval(refresh, 1500);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(iv);
    };
  }, []);

  const kpis = useMemo(() => computeKpisFromOrders(orders), [orders]);

  return { orders, campaign, audit, kpis };
}
