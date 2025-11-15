// Bygger enkel HTML-rapport av snapshot + bankDirectory.
import { fmtMoneySEK, fmtMoneyCCY } from "@core/FX";

export function buildMonthlyReportHTML({ title = "Calestra â€“ Monthly Report", snapshot, bankDirectory, myRef }) {
  const snap = snapshot || {};
  const rows = snap?.earnings?.rows || [];
  const tot  = snap?.earnings?.totals || {};

  const head = `
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(title)}</title>
  <style>
    body{font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111;margin:24px;}
    h1{font-size:22px;margin:0 0 6px}
    h2{font-size:16px;margin:18px 0 6px}
    table{width:100%;border-collapse:collapse}
    th,td{padding:8px 6px;border-bottom:1px solid #ddd;text-align:left}
    .muted{opacity:.75}
    .pill{display:inline-block;border:1px solid #ddd;border-radius:999px;padding:2px 8px;margin-right:6px}
    .kpis{display:flex;gap:10px;flex-wrap:wrap}
    .kpi{border:1px solid #eee;border-radius:10px;padding:10px 12px;min-width:200px}
    .small{font-size:12px}
  </style>`;

  const kpi = (label, val) => `<div class="kpi"><div class="small muted">${esc(label)}</div><div style="font-size:18px;font-weight:700">${esc(val)}</div></div>`;

  const kpis = `
  <div class="kpis">
    ${kpi("Approved (SEK)", fmtMoneySEK(tot.approvedSek || 0))}
    ${kpi("Pending (SEK)",  fmtMoneySEK(tot.pendingSek  || 0))}
    ${kpi("Inbound approved", fmtMoneySEK(tot.inboundApprovedSek || 0))}
    ${kpi("Outbound approved",fmtMoneySEK(tot.outboundApprovedSek|| 0))}
    ${kpi("Transaktioner", (snap?.salesCount || 0))}
  </div>`;

  const tblRows = rows.map(r => `
    <tr>
      <td>${esc(r.ref)}</td>
      <td>${esc((r.commissionRate*100).toFixed?.(0) || 0)}%</td>
      <td class="small">${fmtMoneySEK(r.approvedSek || 0)}</td>
      <td class="small">${fmtMoneySEK(r.pendingSek  || 0)}</td>
      <td class="small">${fmtMoneySEK(r.earningsInboundSek || 0)}</td>
      <td class="small">${fmtMoneySEK(r.earningsOutboundSek || 0)}</td>
      <td><b>${fmtMoneySEK(r.earningsSek || 0)}</b></td>
      <td class="small">${esc(r.countApproved || 0)}</td>
    </tr>`).join("");

  const bankWarn = myRef && !bankDirectory?.[myRef]
    ? `<div class="small" style="color:#cc8800">âš  Utbetalningsuppgifter saknas för <b>${esc(myRef)}</b>.</div>` : "";

  return `
  <!doctype html><html><head>${head}</head><body>
    <h1>${esc(title)}</h1>
    <div class="muted small">Genererad: ${new Date().toLocaleString()}</div>
    ${bankWarn}
    <h2>Översikt</h2>
    ${kpis}

    <h2>Per ref</h2>
    <table>
      <thead>
        <tr>
          <th>Ref</th><th>Kommission</th><th>Approved SEK</th><th>Pending SEK</th>
          <th>Intjäning inbound</th><th>Intjäning outbound</th><th>Tot. intjäning</th><th>Ordrar (approved)</th>
        </tr>
      </thead>
      <tbody>${tblRows || `<tr><td colspan="8" class="muted">Inga rader.</td></tr>`}</tbody>
    </table>
  </body></html>`;
}

export function downloadHTML(filename, html) {
  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function esc(s){ return String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
