// apps/web/src/core/system/index.js
import defaults from "./flags.json";
import { emit, on } from "../ccore/eventBus";

const LS_FLAGS = "cw_flags_override";
const LS_AUDIT = "cw_audit";

function deepMerge(base, over) {
  if (!over) return JSON.parse(JSON.stringify(base));
  const out = JSON.parse(JSON.stringify(base));
  for (const k of Object.keys(over)) {
    if (typeof over[k] === "object" && over[k] && !Array.isArray(over[k])) {
      out[k] = deepMerge(base[k] || {}, over[k]);
    } else out[k] = over[k];
  }
  return out;
}

export function getFlags() {
  let over = null;
  try { over = JSON.parse(localStorage.getItem(LS_FLAGS) || "null"); } catch { over = null; }
  return deepMerge(defaults, over);
}

export function setModuleEnabled(mod, enabled) {
  const cur = getFlags();
  cur.modules[mod] = cur.modules[mod] || { enabled: false, mode: "manual" };
  cur.modules[mod].enabled = !!enabled;
  saveOverride(cur);
  audit("flags.module.toggle", { module: mod, enabled: !!enabled });
  emit("system.flags.updated", { flags: cur });
  return cur;
}

export function setModuleMode(mod, mode) {
  const cur = getFlags();
  if (!cur.modes.includes(mode)) throw new Error("Ogiltigt mode: " + mode);
  cur.modules[mod] = cur.modules[mod] || { enabled: false, mode: "manual" };
  cur.modules[mod].mode = mode;
  saveOverride(cur);
  audit("flags.module.mode", { module: mod, mode });
  emit("system.flags.updated", { flags: cur });
  return cur;
}

export function getModuleMode(mod) {
  const cur = getFlags();
  return cur.modules?.[mod]?.mode || "manual";
}

export function isModuleEnabled(mod) {
  const cur = getFlags();
  return !!cur.modules?.[mod]?.enabled;
}

export function subscribeFlags(fn) {
  return on("system.flags.updated", (e) => fn(e.flags));
}

function saveOverride(flags) {
  // spara ENDAST diff mot defaults (enkelt: spara hela för nu)
  localStorage.setItem(LS_FLAGS, JSON.stringify(flags));
}

/* ---------------- AUDIT ---------------- */

export function audit(action, meta) {
  const item = {
    id: "audit_" + Math.random().toString(36).slice(2, 10),
    action,
    meta: meta || {},
    at: new Date().toISOString()
  };
  const list = getAudit();
  list.push(item);
  localStorage.setItem(LS_AUDIT, JSON.stringify(list));
  emit("system.audit.new", { item });
  return item;
}

export function getAudit() {
  try { return JSON.parse(localStorage.getItem(LS_AUDIT) || "[]"); } catch { return []; }
}

export function clearAudit() {
  localStorage.removeItem(LS_AUDIT);
  emit("system.audit.cleared", {});
}
