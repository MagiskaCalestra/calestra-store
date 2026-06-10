import fs from "fs";
import path from "path";

const root = process.cwd();

const src = path.join(root, "src", "data", "products.json");
const dstDir = path.join(root, "public", "data");
const dst = path.join(dstDir, "products.json");

function readSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

fs.mkdirSync(dstDir, { recursive: true });

const raw = fs.readFileSync(src, "utf8");

// validate JSON (fail fast)
JSON.parse(raw);

const existing = readSafe(dst);

if (existing === raw) {
  console.log("[sync-products] No changes:", dst);
} else {
  fs.writeFileSync(dst, raw, "utf8");
  console.log("[sync-products] Synced:", src, "->", dst);
}
