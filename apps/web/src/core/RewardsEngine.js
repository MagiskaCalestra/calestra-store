import { tierFor } from "./TierEngine";

/**
 * Räknar intjänat per ref över alla försäljningar
 * - konverterar grovt till SEK (mock: USDâ†’SEK ~ 10.5 om ingen kurs satt)
 */
export function computeEarnings({ sales, fx = { USD_SEK: 10.5 } }) {
  const perRef = new Map(); // ref -> { totalApprovedSek, totalPendingSek, countApproved, countPending }

  for (const s of sales) {
    const amountSek = toSek(s.amount, s.currency, fx);
    const bucket = perRef.get(s.ref) || { totalApprovedSek: 0, totalPendingSek: 0, countApproved: 0, countPending: 0 };
    if (s.status === "approved") {
      bucket.totalApprovedSek += amountSek;
      bucket.countApproved += 1;
    } else {
      bucket.totalPendingSek += amountSek;
      bucket.countPending += 1;
    }
    perRef.set(s.ref, bucket);
  }

  const rows = [];
  for (const [ref, aggr] of perRef.entries()) {
    const tier = tierFor(aggr.totalApprovedSek);
    const earningsSek = aggr.totalApprovedSek * tier.commission;
    rows.push({
      ref,
      tier: tier.code,
      commissionRate: tier.commission,
      approvedSek: round2(aggr.totalApprovedSek),
      pendingSek: round2(aggr.totalPendingSek),
      earningsSek: round2(earningsSek),
      countApproved: aggr.countApproved,
      countPending: aggr.countPending
    });
  }
  // total
  const totals = rows.reduce((acc, r) => {
    acc.approvedSek += r.approvedSek;
    acc.pendingSek += r.pendingSek;
    acc.earningsSek += r.earningsSek;
    acc.countApproved += r.countApproved;
    acc.countPending += r.countPending;
    return acc;
  }, { approvedSek: 0, pendingSek: 0, earningsSek: 0, countApproved: 0, countPending: 0 });

  // sort by earnings
  rows.sort((a,b) => b.earningsSek - a.earningsSek);
  return { rows, totals: { ...totals, approvedSek: round2(totals.approvedSek), pendingSek: round2(totals.pendingSek), earningsSek: round2(totals.earningsSek) } };
}

function toSek(amount, currency, fx) {
  if (currency === "SEK") return amount;
  if (currency === "USD") return amount * (fx.USD_SEK || 10.5);
  // fallback
  return amount;
}
function round2(n){ return Math.round(n * 100) / 100; }
