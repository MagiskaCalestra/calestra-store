const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:14000/api/store";
export async function fetchProgressSummary() {
  const res = await fetch(`${BASE}/progress/summary`);
  if (!res.ok) throw new Error(`Progress ${res.status}`);
  return res.json();
}
