/* 
 * Calestra AudioManager – singelton som överlever HMR och route-byten.
 * - Startar först efter första användargest (autoplay-policy)
 * - Behåller "enabled" i localStorage (nyckel: cw_audio_enabled)
 * - Byter spår baserat på "channel" (t.ex. 'default', 'store')
 * - Robust mot HMR: återanvänder global instans på window.__cwAudio
 */

const STORAGE_KEY = "cw_audio_enabled";

// Peka på dina statiska mp3 i /public/audio (Vite/CRA serverar dem på /audio/…)
const TRACKS = {
  default: "/audio/cw_theme_main.mp3",   // landningslåt
  store:   "/audio/cw_theme_store.mp3",  // butikslåt
};

class AudioManager {
  constructor() {
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.audio.volume = 0.35;

    this.enabled = (localStorage.getItem(STORAGE_KEY) ?? "true") !== "false";
    this.channel = "default";
    this._boundResume = null;
    this._armed = false; // har vi kopplat gest-listeners?

    // Om användaren tidigare valt av: se till att allt är stoppat
    if (!this.enabled) {
      this.audio.pause();
    }
  }

  setEnabled(flag) {
    this.enabled = !!flag;
    localStorage.setItem(STORAGE_KEY, this.enabled ? "true" : "false");
    if (this.enabled) {
      this._armAutoplay();
    } else {
      this.audio.pause();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  setVolume(v) {
    this.audio.volume = Math.max(0, Math.min(1, v));
  }

  /** Byt “kanal” (vilket spår) och spela om musiken är på */
  async switchChannel(channel = "default") {
    if (!TRACKS[channel]) channel = "default";
    if (this.channel === channel && this.audio.src.endsWith(TRACKS[channel])) {
      // inget byte behövs
      if (this.enabled) this._armAutoplay();
      return;
    }
    this.channel = channel;
    this.audio.src = TRACKS[channel];
    if (this.enabled) {
      await this._safePlay();
    }
  }

  /** Säker play med catch som inte spammar konsolen */
  async _safePlay() {
    try {
      await this.audio.play();
    } catch {
      // Ofta pga autoplay-policy – beväpna på nytt
      this._armAutoplay();
    }
  }

  /** Koppla engångs-lyssnare till första gesten (autoplay-policy) */
  _armAutoplay() {
    if (!this.enabled || this._armed) return;

    const resume = async () => {
      await this._safePlay();
      // rensa alla engångs-lyssnare
      ["pointerdown","click","keydown","touchstart"].forEach(ev =>
        window.removeEventListener(ev, this._boundResume, true)
      );
      document.removeEventListener("visibilitychange", this._boundResume, true);
      this._armed = false;
    };

    this._boundResume = resume.bind(this);
    ["pointerdown","click","keydown","touchstart"].forEach(ev =>
      window.addEventListener(ev, this._boundResume, { once: true, capture: true })
    );
    // Om användaren byter tillbaka flik – försök igen
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.enabled) this._safePlay();
    });
    this._armed = true;
  }
}

// ----- Singleton som överlever HMR -----
export function getAudio() {
  if (typeof window !== "undefined") {
    if (!window.__cwAudio) {
      window.__cwAudio = new AudioManager();
      // starta med default spår
      window.__cwAudio.switchChannel("default");
    }
    return window.__cwAudio;
  }
  // SSR-säkerhet
  return new AudioManager();
}
