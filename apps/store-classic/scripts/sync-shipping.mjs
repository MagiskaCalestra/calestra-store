import fs from "fs";
import path from "path";

const root = process.cwd();

const src = path.join(root, "src", "data", "shipping.js");
const dstDir = path.join(root, "public", "data");
const dst = path.join(dstDir, "shipping.js");

function readSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

fs.mkdirSync(dstDir, { recursive: true });

const raw = fs.readFileSync(src, "utf8");
const existing = readSafe(dst);

if (existing === raw) {
  console.log("[sync-shipping] No changes:", dst);
} else {
  fs.writeFileSync(dst, raw, "utf8");
  console.log("[sync-shipping] Synced:", src, "->", dst);
}
