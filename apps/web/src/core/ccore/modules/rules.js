// apps/web/src/core/ccore/modules/rules.js
// Enkel regelmotor (mock) med localStorage-lagring.
// Regler påverkar availability (blackout) och prissättning (grupprabatt).
import { emit } from "../eventBus";

const LS_RULES = "ccore_rules";

export const defaultRules = {
  blackoutDates: [],              // ["2025-12-24", ...]
  groupDiscount: {
    threshold: 4,                 // minsta antal gäster för rabatt
    pct: 5                        // procent (heltal) som dras av
  }
};

export function getRules() {
  try {
    const r = JSON.parse(localStorage.getItem(LS_RULES) || "null");
    if (!r) return { ...defaultRules };
    return {
      blackoutDates: Array.isArray(r.blackoutDates) ? r.blackoutDates : [],
      groupDiscount: {
        threshold: Number(r?.groupDiscount?.threshold ?? defaultRules.groupDiscount.threshold),
        pct: Number(r?.groupDiscount?.pct ?? defaultRules.groupDiscount.pct)
      }
    };
  } catch {
    return { ...defaultRules };
  }
}

export function setRules(next) {
  const current = getRules();
  const merged = {
    blackoutDates: Array.isArray(next.blackoutDates) ? next.blackoutDates : current.blackoutDates,
    groupDiscount: {
      threshold: Number(next?.groupDiscount?.threshold ?? current.groupDiscount.threshold),
      pct: Number(next?.groupDiscount?.pct ?? current.groupDiscount.pct)
    }
  };
  localStorage.setItem(LS_RULES, JSON.stringify(merged));
  emit("rules.updated", { rules: merged });
  return merged;
}

// Exportera regler som snygg JSON-sträng
export function exportRules() {
  const rules = getRules();
  return JSON.stringify(rules, null, 2);
}

// Importera regler från JSON-sträng
export function importRules(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    return setRules(parsed);
  } catch (e) {
    throw new Error("Ogiltig JSON â€“ kunde inte importera regler.");
  }
}
