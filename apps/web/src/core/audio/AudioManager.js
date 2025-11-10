// Calestra — AudioManager (hel fil)
// Singleton som överlever HMR/route-byten och lagrar användarens val.

const STORAGE_KEY = "cw_audio_enabled";

const TRACKS = {
  default: "/audio/cw_theme_main.mp3", // landningslåt
  store: "/audio/cw_theme_store.mp3",  // butikslåt
};

class AudioManager {
  constructor() {
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.audio.volume = 0.35;

    this.enabled = (localStorage.getItem(STORAGE_KEY) ?? "true") !== "false";
    this.channel = "default";
    this._userGesture = false;

    const prime = () => {
      this._userGesture = true;
      if (this.enabled) this._applySrcAndPlay(true);
      window.removeEventListener("pointerdown", prime, { capture: true });
      window.removeEventListener("keydown", prime, { capture: true });
    };
    window.addEventListener("pointerdown", prime, { capture: true, once: true });
    window.addEventListener("keydown", prime, { capture: true, once: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.audio.pause();
      else if (this.enabled && this._userGesture) this.audio.play().catch(() => {});
    });
  }

  setEnabled(next) {
    this.enabled = !!next;
    localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
    if (!this.enabled) this.audio.pause();
    else if (this._userGesture) this._applySrcAndPlay();
  }

  toggle() {
    this.setEnabled(!this.enabled);
  }

  setChannel(ch) {
    const next = TRACKS[ch] ? ch : "default";
    if (this.channel === next) return;
    this.channel = next;
    if (this.enabled && this._userGesture) this._applySrcAndPlay(true);
  }

  _applySrcAndPlay(forceReload = false) {
    const src = TRACKS[this.channel] || TRACKS.default;
    if (forceReload || !this.audio.src.includes(src)) {
      this.audio.src = src;
      this.audio.load();
    }
    this.audio.play().catch(() => {});
  }
}

export function getAudio() {
  if (!window.__cwAudio) window.__cwAudio = new AudioManager();
  return window.__cwAudio;
}
