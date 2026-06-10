import { api, endpoints } from "@core/api";

export const sendProgress = (payload) =>
  api(endpoints.progress, { method: "POST", body: payload });

export const getMembership = (id) =>
  api(endpoints.membership(id));

export const getProgressSummary = () =>
  api(endpoints.progressSummary);

export const pingHealth = async () => {
  const keys = Object.keys(endpoints.health);
  const out = {};
  await Promise.all(keys.map(async (k) => {
    try {
      const r = await api(endpoints.health[k]);
      out[k] = { ok: true, data: r };
    } catch (err) {
      out[k] = { ok: false, error: String(err) };
    }
  }));
  return out;
};
