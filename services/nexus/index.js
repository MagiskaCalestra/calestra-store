import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
const PORT = Number(process.env.PORT || 14000);
const BASE_PATH = process.env.BASE_PATH || "/api";

// ---- Data loaders ----
const SEED_DIR = path.join(__dirname, "seed");
const PRODUCTS_JSON = path.join(SEED_DIR, "products.json");
const CATEGORIES_JSON = path.join(SEED_DIR, "categories.json");

async function loadJson(p) {
  const buf = await fs.readFile(p, "utf8");
  return JSON.parse(buf);
}

let PRODUCTS = [];
let CATEGORIES = [];

async function refreshSeed() {
  PRODUCTS = await loadJson(PRODUCTS_JSON);
  CATEGORIES = await loadJson(CATEGORIES_JSON);
  // index for fast lookup
  PRODUCTS._byId = new Map(PRODUCTS.map((p) => [String(p.id), p]));
  PRODUCTS._bySlug = new Map(PRODUCTS.map((p) => [String(p.slug), p]));
}

await refreshSeed();

// ---- App ----
const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Static (optional). Add images here if you want to serve via Nexus:
// GET /static/...
app.use("/static", express.static(path.join(__dirname, "static"), { fallthrough: true }));

// Small helper for pagination
function paginate(items, { limit = 24, offset = 0 } = {}) {
  limit = Math.max(1, Math.min(100, Number(limit)));
  offset = Math.max(0, Number(offset));
  const total = items.length;
  const slice = items.slice(offset, offset + limit);
  return { items: slice, total, limit, offset };
}

// Search/filter helpers
function filterSortProducts(all, { q, category, sort, order } = {}) {
  let arr = all;

  if (q) {
    const needle = String(q).toLowerCase();
    arr = arr.filter(
      (p) =>
        String(p.name).toLowerCase().includes(needle) ||
        String(p.slug).toLowerCase().includes(needle) ||
        String(p.description || "").toLowerCase().includes(needle)
    );
  }

  if (category) {
    const c = String(category).toLowerCase();
    arr = arr.filter(
      (p) =>
        String(p.category || "").toLowerCase() === c ||
        (Array.isArray(p.categories) && p.categories.some((x) => String(x).toLowerCase() === c))
    );
  }

  if (sort) {
    const key = String(sort);
    const dir = String(order || "asc").toLowerCase() === "desc" ? -1 : 1;
    arr = arr.slice().sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  return arr;
}

// ---- Routes ----
const r = express.Router();

r.get("/health", (req, res) => res.json({ ok: true }));
r.get("/version", (req, res) =>
  res.json({ name: "Calestra Nexus", version: "0.1.0", time: new Date().toISOString() })
);

r.get("/categories", (req, res) => {
  res.json({ items: CATEGORIES, total: CATEGORIES.length });
});

r.get("/products", (req, res) => {
  const { q, category, sort, order, limit, offset } = req.query;
  const filtered = filterSortProducts(PRODUCTS, { q, category, sort, order });
  const page = paginate(filtered, { limit, offset });
  res.json(page);
});

r.get("/products/:idOrSlug", (req, res) => {
  const key = String(req.params.idOrSlug);
  let prod = PRODUCTS._byId.get(key);
  if (!prod) prod = PRODUCTS._bySlug.get(key);
  if (!prod) return res.status(404).json({ error: "Not Found" });
  res.json(prod);
});

// quick reload endpoint during dev to pick up seed changes
r.post("/admin/reload", async (req, res) => {
  await refreshSeed();
  res.json({ ok: true, products: PRODUCTS.length, categories: CATEGORIES.length });
});

app.use(BASE_PATH, r);

// ---- Start ----
app.listen(PORT, () => {
  const local = `http://localhost:${PORT}${BASE_PATH}`;
  console.log(`Nexus listening at ${local}`);
});
