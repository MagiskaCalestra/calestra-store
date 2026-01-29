import "dotenv/config";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const DB_PATH = process.env.DB_PATH || "./data/analytics.sqlite";

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(DB_PATH);

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

db.exec(`
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  env TEXT NOT NULL,              -- green|blue
  app TEXT NOT NULL,              -- store|web|admin
  name TEXT NOT NULL,             -- event name
  path TEXT DEFAULT '',
  sessionId TEXT DEFAULT '',
  userId TEXT DEFAULT '',
  ref TEXT DEFAULT '',
  currency TEXT DEFAULT '',
  value REAL DEFAULT NULL,
  metaJson TEXT DEFAULT '{}',
  ip TEXT DEFAULT '',
  ua TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_env ON events(env);
CREATE INDEX IF NOT EXISTS idx_events_app ON events(app);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(sessionId);
`);

export function nowMs() {
  return Date.now();
}
