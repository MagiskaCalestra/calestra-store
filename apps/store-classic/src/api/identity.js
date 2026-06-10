// apps/store-classic/src/api/identity.js
const BASE =
  import.meta.env.VITE_IDENTITY_BASE_URL || "http://localhost:14070";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    throw new Error(`IDENTITY_HTTP_${res.status}`);
  }

  return res.json();
}

// 🔹 Hämtar en demo/profil – tills vi har riktig auth.
export async function getDemoMember() {
  return request("/members/demo");
}

// 🔹 Enkel registrering (V1 – utan login-system)
export async function registerMember(payload) {
  return request("/members", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 🔹 Uppdatera profil (emotioner, element, birthday m.m.)
export async function updateMember(id, patch) {
  return request(`/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
