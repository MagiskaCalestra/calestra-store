const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 14000;

app.use(cors());
app.use(express.json());

// --- dummy data / seeds ---
const products = require("../data/products.json");
const progress = require("../data/progress.json");

// GET /products?page=1&limit=200
app.get("/products", (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, parseInt(req.query.limit || "24", 10));
  const start = (page - 1) * limit;
  const end = start + limit;
  const slice = products.slice(start, end);
  res.json({
    page,
    limit,
    total: products.length,
    items: slice,
  });
});

// GET /progress/summary
app.get("/progress/summary", (req, res) => {
  res.json(progress);
});

app.listen(PORT, () => {
  console.log(`[mock-api] listening on http://localhost:${PORT}`);
});
