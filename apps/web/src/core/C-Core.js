const SALES_KEY = "cw.sales.v1";
const SNAP_KEY  = "cw.snapshot.v1";
const AMB_SHARE_KEY = "cw.amb.share"; // <-- NYTT

const DEFAULT_COMMISSION_RATE = 0.15;

function readJSON(k, d = null) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function getLiveSales() { return readJSON(SALES_KEY, []); }
export function addSalesRows(rows = []) {
  const cur = getLiveSales();
  let added = 0;
  for (const r of rows) {
    if (!r) continue;
    const row = {
      id: uid(),
      ts: r.ts || new Date().toISOString(),
      flow: (r.flow || "inbound").toLowerCase(),
      network: r.network || "Custom",
      ref: r.ref || "",
      amount: Number(r.amount || 0),
      currency: (r.currency || "SEK").toUpperCase(),
      status: (r.status || "pending").toLowerCase(),
    };
    cur.push(row); added++;
  }
  writeJSON(SALES_KEY, cur);
  return added;
}

export async function runNightlySync() {
  const sales = getLiveSales();

  // <-- HÄMTA ANDEL DYNAMISKT
  let ambShare = Number(localStorage.getItem(AMB_SHARE_KEY));
  if (!isFinite(ambShare)) ambShare = 0.20;

  const totals = {
    approvedSek: sumSek(sales.filter(s => s.status === "approved")),
    pendingSek:  sumSek(sales.filter(s => s.status !== "approved")),
    countApproved: sales.filter(s => s.status === "approved").length,
    outboundApprovedSek: sumSek(sales.filter(s => s.status === "approved" && s.flow === "outbound")),
    inboundApprovedSek:  sumSek(sales.filter(s => s.status === "approved" && s.flow !== "outbound")),
  };

  const byRef = {};
  function ensureRef(ref) {
    if (!byRef[ref]) {
      byRef[ref] = {
        ref,
        approvedSek: 0,
        pendingSek: 0,
        countApproved: 0,
        tier: "standard",
        commissionRate: DEFAULT_COMMISSION_RATE,
        earningsSek: 0,
        earningsInboundSek: 0,
        earningsOutboundSek: 0,
      };
    }
    return byRef[ref];
  }

  for (const s of sales) {
    const ref = (s.ref || "_none");
    const bucket = ensureRef(ref);
    const sek = toSEK(s.amount, s.currency);

    if (s.status === "approved") {
      bucket.approvedSek += sek;
      bucket.countApproved++;

      if (s.flow === "outbound") {
        if (ref !== "_none" && ambShare > 0) {
          const share = sek * ambShare;
          bucket.earningsSek += share;
          bucket.earningsOutboundSek += share;
        }
      } else {
        const earn = sek * bucket.commissionRate;
        bucket.earningsSek += earn;
        bucket.earningsInboundSek += earn;
      }
    } else {
      bucket.pendingSek += sek;
    }
  }

  const rows = Object.values(byRef).sort((a,b)=>b.earningsSek - a.earningsSek);
  const snapshot = { ts: Date.now(), salesCount: sales.length, earnings: { totals, rows } };
  writeJSON(SNAP_KEY, snapshot);
  return snapshot;
}

/* SEK-konvertering */
function toSEK(amount, currency) {
  const n = Number(amount || 0);
  const c = (currency || "SEK").toUpperCase();
  if (c === "SEK") return n;
  const rates = { EUR: 0.088, USD: 0.094, TRY: 3.00 };
  if (!rates[c]) return n;
  return n * (1 / rates[c]);
}
function sumSek(arr) { let t = 0; for (const s of arr) t += toSEK(s.amount, s.currency) || 0; return Math.round(t*100)/100; }

export function getSnapshot() {
  return readJSON(SNAP_KEY, {
    ts: null, salesCount: 0,
    earnings: { totals: { approvedSek:0, pendingSek:0, countApproved:0, outboundApprovedSek:0, inboundApprovedSek:0 }, rows: [] }
  });
}
