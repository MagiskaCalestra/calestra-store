// apps/web/src/api/progress.js
// Fetch wrapper with timeout, single retry and graceful fallback

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5399";

function withTimeout(ms, promise) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((res) => {
        clearTimeout(id);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

export async function fetchProgress(locale = "sv") {
  const url = `${API_BASE}/api/progress?locale=${encodeURIComponent(locale)}`;
  const attempt = async () => {
    const res = await withTimeout(5000, fetch(url, { headers: { "Accept": "application/json" } }));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  try {
    return await attempt();
  } catch (e) {
    // one retry
    try {
      return await attempt();
    } catch (e2) {
      // fallback if API is down
      return {
        totalGoal: 25000000000,
        segments: [
          { id: "global",    label: "Global Journey",   current: 1000000, goal: 25000000000 },
          { id: "founders",  label: "Founders Drop",    current:  300000, goal:   3500000 },
          { id: "community", label: "Community Support",current:  100000, goal:   500000 },
        ],
        updatedAt: new Date().toISOString(),
        __fallback: true,
      };
    }
  }
}
