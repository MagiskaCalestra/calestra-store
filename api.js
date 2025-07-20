// lib/api.js

export async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Nätverksfel vid hämtning av data');
  }
  return res.json();
}
