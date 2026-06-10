import fs from "fs";
import path from "path";

const file = path.resolve("apps/store-classic/src/data/products.json");
const raw = JSON.parse(fs.readFileSync(file, "utf8"));

const issues = [];
for (const p of raw) {
  const id = p.slug || p.id || "<no-id>";

  // Bildkontroller
  const arr = Array.isArray(p.images) ? p.images : [];
  const imgs = [
    p.image,
    ...arr.map(x => x?.image).filter(Boolean),
  ].filter(Boolean);

  if (imgs.length === 0) {
    issues.push({ id, type: "image", msg: "Inga bilder – fallback triggas" });
  }
  // Föreslå normalisering: prefixa /images/ om det saknas http(s)/leading-slash
  const toFix = imgs.filter(u => !/^https?:\/\//.test(u) && !u.startsWith("/"));
  if (toFix.length) {
    issues.push({ id, type: "imagePath", msg: `Relativa paths ${toFix.length}st – föreslås '/images/...` });
  }

  // Pris
  const price = Number(p.price || 0);
  if (Number.isNaN(price) || price < 0) {
    issues.push({ id, type: "price", msg: `Orimligt pris: ${p.price}` });
  }

  // Lager
  if (p.stock != null && Number(p.stock) < 0) {
    issues.push({ id, type: "stock", msg: `Negativt lager: ${p.stock}` });
  }
}

if (issues.length === 0) {
  console.log("✅ products.json ser bra ut.");
} else {
  console.log("⚠️  Hittade potentiella problem:\n");
  for (const i of issues) console.log(`- [${i.type}] ${i.id}: ${i.msg}`);
  console.log("\nTips: normalisera relativ bild -> '/images/<fil>' i seeds.");
}
