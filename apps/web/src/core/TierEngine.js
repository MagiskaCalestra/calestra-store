// Nivåer som gäller både affiliates och ambassadörer
export const TIERS = [
  { code: "BRONZE",  minTotal: 0,        commission: 0.15 },
  { code: "SILVER",  minTotal: 1000,     commission: 0.18 },
  { code: "GOLD",    minTotal: 5000,     commission: 0.22 },
  { code: "CELESTIAL", minTotal: 20000,  commission: 0.28 },
];

export function tierFor(totalApprovedSek) {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (totalApprovedSek >= t.minTotal) current = t;
  }
  return current;
}
