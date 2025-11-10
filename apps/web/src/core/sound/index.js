// apps/web/src/core/sound/index.js
// Facade kring audioEngine + "cues" (DOM-sektioner som triggar ljud)
import { audioEngine } from "./engine";

/**
 * initSectionObserver
 * - Observerar element med attributet data-audio="TRACK_ID"
 * - När en sektion blir ~60% synlig spelas dess spår
 * - Lämnar route-regler i fred (om inga cues syns, fall tillbaka till route-ljud)
 */
let _observer = null;
let _lastCue = null;

export function initSectionObserver() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (_observer) { try { _observer.disconnect(); } catch {} }
  const opts = { root: null, rootMargin: "0px", threshold: 0.6 };

  _observer = new IntersectionObserver((entries) => {
    // Kolla om någon sektion med data-audio blir dominerande
    const visible = entries
      .filter(e => e.isIntersecting)
      .map(e => ({ el: e.target, id: e.target.getAttribute("data-audio") }))
      .filter(v => v.id);

    if (visible.length > 0) {
      const id = visible[0].id;
      _lastCue = id;
      audioEngine.play(id);
    } else {
      // Om ingen cue syns och vi hade en cue, återgå till route-ljud
      if (_lastCue) {
        _lastCue = null;
        audioEngine.playForPath(location.pathname);
      }
    }
  }, opts);

  Array.from(document.querySelectorAll("[data-audio]")).forEach(el => _observer.observe(el));
}

export function teardownSectionObserver() {
  if (_observer) { try { _observer.disconnect(); } catch {} }
  _observer = null;
  _lastCue = null;
}

export { audioEngine };
