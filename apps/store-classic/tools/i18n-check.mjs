// tools/i18n-check.mjs
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Anpassa om din app ligger i t.ex. apps/store-classic/
const ROOT = path.resolve(__dirname, "..");
const LOCALES = path.join(ROOT, "src", "locales");
const LANGS = ["sv", "en", "tr"];

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function deepKeys(obj, prefix = "", out = new Set()) {
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object") {
        deepKeys(v, key, out);
      } else {
        out.add(key);
      }
    }
  }
  return out;
}

function mergeJsonInDir(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  let merged = {};
  for (const f of files) {
    const j = readJSON(path.join(dir, f));
    merged = deepMerge(merged, j);
  }
  // subfolder "pages", "common", etc.
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory()) {
      merged = deepMerge(merged, mergeJsonInDir(path.join(dir, f.name)));
    }
  }
  return merged;
}

function deepMerge(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  if (a && typeof a === "object" && b && typeof b === "object") {
    const out = { ...a };
    for (const k of Object.keys(b)) {
      out[k] = k in out ? deepMerge(out[k], b[k]) : b[k];
    }
    return out;
  }
  return b;
}

function run() {
  const maps = {};
  for (const lang of LANGS) {
    const dir = path.join(LOCALES, lang);
    if (!fs.existsSync(dir)) {
      console.warn(`(skip) ${lang} saknas: ${dir}`);
      continue;
    }
    const merged = mergeJsonInDir(dir);
    maps[lang] = deepKeys(merged);
  }

  // jämför mot första språket som “källsanning”
  const base = LANGS[0];
  for (const lang of LANGS) {
    if (lang === base || !maps[lang]) continue;
    const missing = [...maps[base]].filter(k => !maps[lang].has(k));
    const extra = [...maps[lang]].filter(k => !maps[base].has(k));

    console.log(`\n=== ${lang.toUpperCase()} ===`);
    if (missing.length) {
      console.log("SAKNAS:");
      missing.forEach(k => console.log(" -", k));
    } else {
      console.log("Inga saknade nycklar vs", base);
    }
    if (extra.length) {
      console.log("\nEXTRA (finns i", lang, "men inte i", base, "):");
      extra.forEach(k => console.log(" -", k));
    }
  }
}

run();
