import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/status", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 14661; // du körde finance på ~14661 i loggen
app.listen(PORT, () => {
  console.log(`[finance] listening on http://localhost:${PORT}`);
});
