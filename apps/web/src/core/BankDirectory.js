const KEY = "cw.bankdir.v1";

function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }

export function loadBankDirectory() { return read(); }
export function saveBankDirectory(map) { write(map || {}); }

// Verktyg: konvertera katalogen till CSV (för banker)
export function bankDirToCSV(map = null) {
  const src = map || read();
  const header = ["ref","name","email","iban","swift","bankName","swish"];
  const lines = [header.join(",")];
  for (const [ref, v] of Object.entries(src)) {
    const row = [
      ref,
      v.name || "",
      v.email || "",
      v.iban || "",
      v.swift || "",
      v.bankName || "",
      v.swish || "",
    ].map(csvEsc).join(",");
    lines.push(row);
  }
  return lines.join("\n");
}

function csvEsc(s=""){ const needs = /[",\n]/.test(String(s)); return needs ? `"${String(s).replace(/"/g,'""')}"` : String(s); }
