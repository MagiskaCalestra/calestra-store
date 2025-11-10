# Calestra STATE-LOCK™ Release Ritual

**Syfte:** Frysa ett fungerande läge innan nästa patch.

## Steg
1. Uppdatera version i `docs/release-notes.md` (valfritt) och skriv en kort notis.
2. Kör backup:
   - Windows: `powershell -ExecutionPolicy Bypass -File scripts/state-lock/STATE-LOCK.ps1 v1.7`
   - macOS/Linux: `bash scripts/state-lock/STATE-LOCK.sh v1.7`
3. Kontrollera output i `backups/`:
   - `STATE-LOCK_<stamp>_v1.7.zip`
   - `STATE-LOCK_<stamp>_v1.7.manifest.json`
4. Fortsätt med nästa patch.

**Innehåll i backuper:**
- `apps/` (web, store-classic, admin)
- `services/` (mock-api configs och routes)
- `docs/`, `packages/`, `scripts/` (exkl. denna backups-mapp)
- Rotfiler: `package.json`, `package-lock.json`, `.gitignore`, `.env*` (om finns)

**Exkluderas:** `node_modules`, `dist`, `.vite`, `.DS_Store`.

> Backup är zip + manifest med SHA-256 för varje fil.
