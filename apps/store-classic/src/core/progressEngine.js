// D:\WebProjects\Calestra\apps\store-classic\src\core\progressEngine.js
import { fetchGoals, fetchProgress } from "../api/progress.js";
import { normalizeProgress } from "../utils/progress-normalize.js";

export const PROGRESS_REFRESH_EVENT = "cw:progress-refresh";
export const PROGRESS_CACHE_LS_KEY = "cw.store.progress.snapshot.v1";

const DEFAULT_GOAL_SEK = 3500000;
const DEFAULT_MILESTONES = [25, 50, 75, 100];

function safeNum(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, safeNum(n, 0)));
}

function inferPercent(total, goal) {
  const t = safeNum(total, 0);
  const g = safeNum(goal, 0);
  if (g <= 0) return 0;
  return clamp((t / g) * 100);
}

function buildMilestones(goal) {
  const g = safeNum(goal, DEFAULT_GOAL_SEK);
  return DEFAULT_MILESTONES.map((pct) => ({
    id: `progress-${pct}`,
    pct,
    amountSEK: Math.round((g * pct) / 100),
  }));
}

function formatUpdatedAt(value) {
  const raw = value == null ? "" : String(value).trim();
  if (!raw) return "";
  return raw;
}

function fromCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROGRESS_CACHE_LS_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw);
    if (!json || typeof json !== "object") return null;
    return normalizeSnapshot(json);
  } catch {
    return null;
  }
}

function toCache(snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_CACHE_LS_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function normalizeSnapshot(input) {
  const source = input && typeof input === "object" ? input : {};
  const normalized = normalizeProgress(source);

  const goal =
    safeNum(source.goal, NaN) ||
    safeNum(source.target, NaN) ||
    safeNum(normalized.goal, NaN) ||
    DEFAULT_GOAL_SEK;

  const total =
    safeNum(source.total, NaN) ||
    safeNum(source.totals, NaN) ||
    safeNum(source.store, NaN) ||
    safeNum(normalized.store, NaN) ||
    safeNum(normalized.total, 0);

  const percent =
    safeNum(source.percent, NaN) ||
    safeNum(source.progress, NaN) ||
    safeNum(source.percentage, NaN) ||
    inferPercent(total, goal);

  const supporters =
    safeNum(source.supporters, NaN) ||
    safeNum(source.backers, NaN) ||
    safeNum(source.members, NaN) ||
    safeNum(source.supporterCount, 0);

  const updatedAt =
    formatUpdatedAt(source.updatedAt || source.updated_at || source.lastUpdated || source.timestamp);

  const channel = String(source.channel || source.scope || "store").trim() || "store";
  const sourceName = String(source.source || source.engine || "progress_api").trim() || "progress_api";

  return {
    ok: true,
    loading: false,
    percent: clamp(percent),
    totalSEK: safeNum(total, 0),
    goalSEK: safeNum(goal, DEFAULT_GOAL_SEK),
    supporters: safeNum(supporters, 0),
    updatedAt,
    channel,
    source: sourceName,
    milestones: buildMilestones(goal),
    raw: source,
  };
}

export function getFallbackProgressSnapshot() {
  const cached = fromCache();
  if (cached) return cached;

  return normalizeSnapshot({
    percent: 0,
    total: 0,
    goal: DEFAULT_GOAL_SEK,
    supporters: 0,
    updatedAt: "",
    channel: "store",
    source: "fallback",
  });
}

export async function getProgressSnapshot() {
  const [summaryRes, goalsRes] = await Promise.allSettled([fetchProgress(), fetchGoals()]);

  const summary =
    summaryRes.status === "fulfilled" && summaryRes.value && typeof summaryRes.value === "object"
      ? summaryRes.value
      : {};

  const goals =
    goalsRes.status === "fulfilled" && goalsRes.value && typeof goalsRes.value === "object"
      ? goalsRes.value
      : {};

  const merged = {
    ...summary,
    ...goals,
    summary:
      summary.summary || goals.summary
        ? {
            ...(summary.summary || {}),
            ...(goals.summary || {}),
          }
        : undefined,
    goals:
      Array.isArray(goals.goals) ? goals.goals : Array.isArray(summary.goals) ? summary.goals : undefined,
    source: "progress_api",
  };

  const snapshot = normalizeSnapshot(merged);
  toCache(snapshot);
  return snapshot;
}

export async function readProgressSnapshotSafe() {
  try {
    return await getProgressSnapshot();
  } catch (err) {
    const fallback = getFallbackProgressSnapshot();
    return {
      ...fallback,
      ok: false,
      error: String(err?.message || err || "progress_fetch_failed"),
      source: "fallback_cache",
    };
  }
}

export function emitProgressRefresh() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(PROGRESS_REFRESH_EVENT));
  } catch {
    /* ignore */
  }
}