// Gemensam normalisering från CSV-text till våra kolumner.
export function parseCSV(text) {
  const lines = (text || "").split(/\r?\n/);
  const hdr = (lines.shift() || "").split(",").map(s => s.trim().toLowerCase());
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = splitCsvLine(line);
    rows.push({ hdr, cols });
  }
  return { hdr, rows };
}

function splitCsvLine(line) {
  const out = [];
  let cur = "", q = false;
  for (let i=0;i<line.length;i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (c === '"') { q = false; }
      else { cur += c; }
    } else {
      if (c === '"') q = true;
      else if (c === ',') { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

function idx(hdr, nameArr) {
  for (const n of nameArr) {
    const k = String(n).toLowerCase();
    const i = hdr.findIndex(h => h === k);
    if (i >= 0) return i;
  }
  return -1;
}

export function mapRows({ hdr, rows }, mapping, flow, network) {
  const get = (r, keys, d="") => {
    const i = idx(hdr, keys);
    return i >= 0 ? (r.cols[i] ?? d) : d;
  };
  const out = [];
  for (const r of rows) {
    out.push({
      ts: get(r, mapping.ts, new Date().toISOString()),
      flow,
      network,
      ref: get(r, mapping.ref, ""),
      amount: get(r, mapping.amount, "0"),
      currency: (get(r, mapping.currency, "SEK") || "SEK").toUpperCase(),
      status: (get(r, mapping.status, "pending") || "pending").toLowerCase(),
    });
  }
  return out;
}
