// D:\WebProjects\Calestra\apps\admin\src\core\financeModel.js

import { readHR, getTotalMonthlyPayroll } from "./hrModel.js";
import {
  getFinanceSummary,
  getFinanceSummaryRange,
  formatSEK,
  formatMoney,
  pct,
  fmtSEK,
  formatSek,
} from "./finance/financeClient.js";

// Local-only keys (för UI-beräkningar)
export const FINANCE_CFG_KEY = "cc.finance.config.v1";
export const FINANCE_METRICS_KEY = "cc.finance.metrics.v1";

// Re-export (så andra delar kan importera stabilt)
export { getFinanceSummary, getFinanceSummaryRange, formatSEK, formatMoney, pct, fmtSEK, formatSek };

// Backward compat (om något importerar gamla namn)
export const formatSekCompat = formatSEK;

/** UI-defaults (local-first) */
export function defaultFinanceConfig() {
  return {
    currency: "SEK",

    fixedCostsMonthly: 9000,
    adsMonthly: 0,

    paymentFeePct: 2.9,
    paymentFeeFixed: 3.0,

    refundRatePct: 2.0,

    avgCOGSPerOrder: 145,
    avgShippingCostPaidByYou: 0,
    avgShippingPaidByCustomer: 49,

    avgOrderValue: 299,

    targetNetMarginPct: 25, // mål
  };
}

export function defaultFinanceMetrics() {
  return {
    visitorsPerDay: 350,
    conversionRatePct: 1.2,
    ordersPerDayOverride: 0,
    daysPerMonth: 30,
    revenueTodayOverride: 0,
  };
}

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/**
 * computeFinance — UI/beräkningar lokalt (får inte bero på backend).
 * Denna ska vara 100% “safe” och aldrig kasta, men om något blir NaN
 * hanterar vi det i UI (eller du kan lägga try/catch där den används).
 */
export function computeFinance(cfg, m) {
  const days = Number(m?.daysPerMonth || 30);

  const visitors = Number(m?.visitorsPerDay || 0);
  const cr = Number(m?.conversionRatePct || 0) / 100;

  const ordersPerDay =
    Number(m?.ordersPerDayOverride || 0) > 0 ? Number(m.ordersPerDayOverride) : visitors * cr;

  const revenuePerOrder =
    Number(cfg?.avgOrderValue || 0) + Number(cfg?.avgShippingPaidByCustomer || 0);

  const revenueMonthly = ordersPerDay * revenuePerOrder * days;

  const paymentFees =
    revenueMonthly * (Number(cfg?.paymentFeePct || 0) / 100) + ordersPerDay * days * Number(cfg?.paymentFeeFixed || 0);

  const refunds = revenueMonthly * (Number(cfg?.refundRatePct || 0) / 100);

  const cogs =
    ordersPerDay *
    days *
    (Number(cfg?.avgCOGSPerOrder || 0) + Number(cfg?.avgShippingCostPaidByYou || 0));

  // HR
  const hr = readHR();
  const payrollObj = getTotalMonthlyPayroll(hr);
  const payroll = Number(payrollObj?.total || 0);

  const fixed = Number(cfg?.fixedCostsMonthly || 0) + Number(cfg?.adsMonthly || 0) + payroll;

  const totalCosts = paymentFees + refunds + cogs + fixed;
  const net = revenueMonthly - totalCosts;
  const netMargin = revenueMonthly > 0 ? (net / revenueMonthly) * 100 : 0;

  const founderSafe = net >= 0 && netMargin >= Number(cfg?.targetNetMarginPct || 0);

  return {
    revenueMonthly,
    totalCosts,
    payroll: payrollObj,
    net,
    netMarginPct: netMargin,

    founderStatus: founderSafe ? "SAFE" : net >= 0 ? "RISK" : "UNSAFE",
  };
}
