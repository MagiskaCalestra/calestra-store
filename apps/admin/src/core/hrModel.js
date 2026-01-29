// D:\WebProjects\Calestra\apps\admin\src\core\hrModel.js
// HR model v1 (local-first)
// - read/write till localStorage
// - total payroll-beräkning (för Finance)
// - hiring readiness (koppling HR -> Finance via netto/proj)

export const HR_KEY = "cc.hr.v1";

export function fmtSEK(n) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(x);
}

export function defaultHR() {
  return {
    currency: "SEK",
    // Arbetsgivaravgift (ungefär). Du kan ändra i UI.
    employerFeePct: 31.42,
    // Tjänstepension etc (om du vill räkna "all-in"). Du kan ändra i UI.
    pensionPct: 4.5,

    // Team / roller (enkelt v1)
    roles: [
      { id: "founder", title: "Founder", monthlySalary: 38000, active: true },
    ],

    // “Första person”-mål i HR-sidan (baseline)
    firstHire: {
      monthlySalary: 38000,   // lön (brutto)
      allInMonthly: 42000,    // all-in (lön+avgifter+övrigt) uppskattning
    },
  };
}

export function readHR() {
  try {
    const raw = localStorage.getItem(HR_KEY);
    if (!raw) return defaultHR();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultHR();

    // Backfill om nya fält tillkommer
    const d = defaultHR();
    return {
      ...d,
      ...parsed,
      firstHire: { ...d.firstHire, ...(parsed.firstHire || {}) },
    };
  } catch {
    return defaultHR();
  }
}

export function writeHR(next) {
  localStorage.setItem(HR_KEY, JSON.stringify(next, null, 2));
  return next;
}

/**
 * Total månadskostnad för HR (payroll).
 * - Summerar aktiva roller
 * - Inkluderar arbetsgivaravgift + pension (om du vill)
 * Detta används av Finance via import: getTotalMonthlyPayroll().
 */
export function getTotalMonthlyPayroll(hr) {
  const h = hr || readHR();
  const roles = Array.isArray(h.roles) ? h.roles : [];
  const employerFeePct = Number(h.employerFeePct || 0);
  const pensionPct = Number(h.pensionPct || 0);

  const baseSalaries = roles
    .filter((r) => r && r.active)
    .reduce((sum, r) => sum + Number(r.monthlySalary || 0), 0);

  const employerFees = (baseSalaries * employerFeePct) / 100;
  const pension = (baseSalaries * pensionPct) / 100;

  const total = Math.round(baseSalaries + employerFees + pension);

  return {
    baseSalaries: Math.round(baseSalaries),
    employerFees: Math.round(employerFees),
    pension: Math.round(pension),
    total,
    employerFeePct,
    pensionPct,
  };
}

/**
 * Koppling HR -> Finance (1 beräkning):
 * Hur många dagar av projicerad netto/dag krävs för att “bära” första anställning.
 *
 * Förväntar sig att Finance skickar in:
 *   finance.projectedNetPerMonth (t.ex. från Finance.jsx/financeModel)
 *   finance.daysPerMonth (default 30)
 */
export function computeHiringReadiness({ hr, finance }) {
  const h = hr || readHR();
  const f = finance || {};

  const daysPerMonth = Number(f.daysPerMonth || 30);
  const projectedNetPerMonth = Number(f.projectedNetPerMonth || 0);
  const projectedNetPerDay = daysPerMonth > 0 ? projectedNetPerMonth / daysPerMonth : 0;

  const salary = Number(h.firstHire?.monthlySalary || 0);
  const allIn = Number(h.firstHire?.allInMonthly || 0);

  const daysToSalary =
    projectedNetPerDay > 0 ? Math.ceil(salary / projectedNetPerDay) : Infinity;

  const daysToAllIn =
    projectedNetPerDay > 0 ? Math.ceil(allIn / projectedNetPerDay) : Infinity;

  return {
    salary,
    allIn,
    projectedNetPerDay: Math.round(projectedNetPerDay),
    projectedNetPerMonth: Math.round(projectedNetPerMonth),
    daysPerMonth,
    daysToSalary,
    daysToAllIn,
    ready: Number.isFinite(daysToAllIn) && daysToAllIn <= 10, // enkel “ready”-regel
  };
}
