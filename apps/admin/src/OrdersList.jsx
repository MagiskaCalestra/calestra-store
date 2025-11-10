// apps/admin/src/pages/OrdersList.jsx
import React, { useEffect, useMemo, useState } from "react";

// OBS: vi återanvänder butikens lokala orders-API via webens localStorage-format.
// Om admin körs i egen domän blir detta en mock-vy tills server-API kopplas.
function loadLocalOrders() {
  try {
    const raw = localStorage.getItem("calestra.orders.v1");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function toCSV(rows) {
  const esc = (s) =>
    `"${String(s ?? "").replaceAll(`"`, `""`).replaceAll(/\r?\n/g, " ")}"`;
  const header = [
    "ID",
    "Status",
    "CreatedAt",
    "Customer",
    "Email",
    "Phone",
    "ItemsCount",
    "SubSEK",
    "ShipSEK",
    "TaxSEK",
    "TotalSEK",
    "Affiliate",
  ];
  const lines = rows.map((o) =>
    [
      o.id,
      o.status,
      o.createdAt,
      o.customer?.name || "",
      o.customer?.email || "",
      o.customer?.phone || "",
      o.items?.reduce((a, it) => a + Number(it.qty || 0), 0) || 0,
      o.totalsSEK?.sub ?? 0,
      o.totalsSEK?.ship ?? 0,
      o.totalsSEK?.tax ?? 0,
      o.totalsSEK?.grand ?? 0,
      o.affiliate || "",
    ].map(esc).join(",")
  );
  return [header.map(esc).join(","), ...lines].join("\r\n");
}

export default function OrdersList() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setRows(loadLocalOrders());
  }, []);

  const totalSum = useMemo(
    () => rows.reduce((a, o) => a + Number(o?.totalsSEK?.grand || 0), 0),
    [rows]
  );

  function exportCSV() {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calestra-orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Orders</h1>
      <div style={{ margin: "12px 0" }}>
        <button onClick={exportCSV}>Export CSV</button>{" "}
        <span style={{ marginLeft: 12 }}>
          Orders: <b>{rows.length}</b> – Sum SEK: <b>{totalSum.toFixed(2)}</b>
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                "ID",
                "Status",
                "Created",
                "Customer",
                "Email",
                "Phone",
                "Items",
                "Sub (SEK)",
                "Ship (SEK)",
                "Tax (SEK)",
                "Total (SEK)",
                "Affiliate",
              ].map((h) => (
                <th
                  key={h}
                  style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td style={{ padding: 8 }}>{o.id}</td>
                <td style={{ padding: 8 }}>{o.status}</td>
                <td style={{ padding: 8 }}>{new Date(o.createdAt).toLocaleString()}</td>
                <td style={{ padding: 8 }}>{o.customer?.name}</td>
                <td style={{ padding: 8 }}>{o.customer?.email}</td>
                <td style={{ padding: 8 }}>{o.customer?.phone}</td>
                <td style={{ padding: 8 }}>
                  {o.items?.reduce((a, it) => a + Number(it.qty || 0), 0) || 0}
                </td>
                <td style={{ padding: 8 }}>{o.totalsSEK?.sub?.toFixed(2)}</td>
                <td style={{ padding: 8 }}>{o.totalsSEK?.ship?.toFixed(2)}</td>
                <td style={{ padding: 8 }}>{o.totalsSEK?.tax?.toFixed(2)}</td>
                <td style={{ padding: 8, fontWeight: 700 }}>
                  {o.totalsSEK?.grand?.toFixed(2)}
                </td>
                <td style={{ padding: 8 }}>{o.affiliate || ""}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={12} style={{ padding: 20, color: "#666" }}>
                  Inga ordrar ännu. Slutför ett köp i Store för att testa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
