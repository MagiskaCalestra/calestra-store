// apps/store-classic/src/core/ai/mountCelesteOverlay.js

/**
 * Legacy no-op.
 *
 * CelesteOverlay renderas nu inne i App.jsx, vilket betyder att den ligger
 * korrekt under BrowserRouter och övriga providers.
 *
 * Den gamla separata mounten via createRoot() skapade en extra React-root
 * utanför routerträdet och kunde orsaka runtime-fel eftersom CelesteOverlay
 * använder router-hooks som useLocation().
 *
 * Vi behåller filen som en säker kompatibilitets-wrapper så att befintlig
 * import i main.jsx inte kraschar, men den gör inte längre någon mount.
 */
export default function mountCelesteOverlay() {
  return null;
}