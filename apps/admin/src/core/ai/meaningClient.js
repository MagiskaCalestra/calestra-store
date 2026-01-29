async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { message: txt }; }
}

export async function meaningUpsert({ text, meta = {} }) {
  const payload = {
    text,
    content: text,
    value: text,
    meta,
    metadata: meta,
  };

  const res = await fetch("/api/meaning/upsert", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || `meaningUpsert failed (${res.status})`);
  return data;
}

export async function meaningSearch({ q, k = 5, filter = null }) {
  const payload = {
    q,
    query: q,
    text: q,
    k,
    topK: k,
    limit: k,
    filter,
    where: filter,
  };

  const res = await fetch("/api/meaning/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || `meaningSearch failed (${res.status})`);
  return data;
}
