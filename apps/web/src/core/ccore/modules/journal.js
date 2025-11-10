// apps/web/src/core/ccore/modules/journal.js
// InnerJourney – enkel lokal journal (mock, lokalStorage). Ej medicinsk, ej server.
// API: listEntries, getEntry, createEntry, updateEntry, deleteEntry, exportJSON, importJSON

import { emit } from "../eventBus";

const LS_JOURNAL = "ccore_journal";

function uid() { return Math.random().toString(36).slice(2, 10); }

function load() {
  try { return JSON.parse(localStorage.getItem(LS_JOURNAL) || "[]"); }
  catch { return []; }
}
function save(list) {
  localStorage.setItem(LS_JOURNAL, JSON.stringify(list));
  emit("journal.changed", { count: list.length });
  return list;
}

export function listEntries() {
  const data = load();
  // senaste överst
  return data.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function getEntry(id) {
  return load().find(e => e.id === id) || null;
}

export function createEntry({ date, mood, moodEmoji, title, text, tags = [], links = {} }) {
  const now = new Date();
  const itm = {
    id: `j_${uid()}`,
    createdAt: now.toISOString(),
    date: date || now.toISOString().slice(0,10),
    mood: Number(mood) || undefined,
    moodEmoji: moodEmoji || undefined,
    title: (title || "").slice(0, 120),
    text: (text || "").slice(0, 5000),
    tags: Array.isArray(tags) ? tags.slice(0, 24) : [],
    links: links || {}
  };
  const list = load();
  list.push(itm);
  save(list);
  return itm;
}

export function updateEntry(id, patch) {
  const list = load();
  const idx = list.findIndex(e => e.id === id);
  if (idx === -1) return null;
  const prev = list[idx];
  const next = {
    ...prev,
    ...patch,
    title: ("title" in patch ? (patch.title || "").slice(0,120) : prev.title),
    text: ("text" in patch ? (patch.text || "").slice(0,5000) : prev.text),
    tags: ("tags" in patch ? (Array.isArray(patch.tags) ? patch.tags.slice(0,24) : prev.tags) : prev.tags),
  };
  list[idx] = next;
  save(list);
  return next;
}

export function deleteEntry(id) {
  const list = load();
  const next = list.filter(e => e.id !== id);
  save(next);
  return next.length !== list.length;
}

export function exportJSON() {
  return JSON.stringify(load(), null, 2);
}

export function importJSON(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) throw new Error("Fel format: förväntade en JSON-array.");
  // enkel sanering
  const cleaned = parsed.map(x => ({
    id: String(x.id || `j_${uid()}`),
    createdAt: String(x.createdAt || new Date().toISOString()),
    date: String(x.date || new Date().toISOString().slice(0,10)),
    mood: x.mood != null ? Number(x.mood) : undefined,
    moodEmoji: x.moodEmoji || undefined,
    title: String(x.title || "").slice(0,120),
    text: String(x.text || "").slice(0,5000),
    tags: Array.isArray(x.tags) ? x.tags.slice(0,24).map(String) : [],
    links: typeof x.links === "object" && x.links ? x.links : {}
  }));
  save(cleaned);
  return cleaned.length;
}
