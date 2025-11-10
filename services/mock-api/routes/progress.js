// apps/mock-api/routes/progress.js
// Simple Express route for /api/progress
// Assumes your mock-api server creates an Express `app` and calls each route file as a function(app).
// Example server index: const app = express(); require('./routes/progress')(app);

const DAY = 24 * 60 * 60 * 1000;

// seed values (can be swapped for file/DB later)
let seed = {
  totalGoal: 25000000000, // 25 bn
  segments: [
    { id: "global",    label: "Global Journey",   current: 1250000, goal: 25000000000 },
    { id: "founders",  label: "Founders Drop",    current:  350000, goal:   3500000 },
    { id: "community", label: "Community Support",current:  120000, goal:   500000 },
  ],
  updatedAt: new Date().toISOString(),
};

// small drift over time so it feels alive (optional)
function drift(seedObj) {
  const now = Date.now();
  const last = new Date(seedObj.updatedAt).getTime();
  if (now - last > 0.5 * DAY) {
    const bump = Math.floor(Math.random() * 9000) + 1000; // 1k-10k
    seedObj.segments = seedObj.segments.map((s) => ({
      ...s,
      current: Math.min(s.goal, s.current + Math.floor(bump / (1 + Math.random() * 3))),
    }));
    seedObj.updatedAt = new Date().toISOString();
  }
}

module.exports = function registerProgressRoute(app) {
  app.get("/api/progress", (req, res) => {
    const { locale } = req.query; // reserved for future multi-locale logic
    drift(seed);
    res.json(seed);
  });
};
