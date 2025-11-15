import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// data-katalog RELATIVT repo-roten, så vi slipper dubbel "services\c-core"
const DATA_DIR = path.resolve(process.cwd(), "services", "c-core", "data");

function readJson(name) {
  const p = path.join(DATA_DIR, name);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/store/products", (req, res) => {
  const data = readJson("products.json"); // { items: [...] }
  res.json(data);
});

app.get("/api/store/progress/summary", (req, res) => {
  const data = readJson("progress.json"); // { goal, raised, updatedAt }
  res.json(data);
});

const PORT = 14000;
app.listen(PORT, () => console.log(`[c-core] http://localhost:${PORT}`));
