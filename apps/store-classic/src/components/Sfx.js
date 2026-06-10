// D:\WebProjects\Calestra\apps\store-classic\src\components\Sfx.js

let audioCache = null;
let isUnlocked = false;

/**
 * Initieras vid första user interaction (click/touch)
 * För att kringgå autoplay restrictions
 */
export function unlockAudio() {
  if (isUnlocked) return;

  try {
    audioCache = new Audio("/sfx/click-1.mp3");
    audioCache.volume = 0.5;

    // "fake play" för att låsa upp
    audioCache.play().then(() => {
      audioCache.pause();
      audioCache.currentTime = 0;
      isUnlocked = true;
    }).catch(() => {});
  } catch {}
}

/**
 * Spela klickljud
 */
export function playClick({ volume = 0.5 } = {}) {
  if (!audioCache) {
    audioCache = new Audio("/sfx/click-1.mp3");
  }

  try {
    audioCache.volume = volume;
    audioCache.currentTime = 0;

    const playPromise = audioCache.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch {}
}

/**
 * Glow-effekt (med fallback)
 */
export function flash(el) {
  if (!el) return;

  if (typeof el.animate === "function") {
    el.animate(
      [
        { boxShadow: "0 0 0 0 rgba(255,255,255,0.0)" },
        { boxShadow: "0 0 28px 6px rgba(255,255,255,0.45)" },
        { boxShadow: "0 0 0 0 rgba(255,255,255,0.0)" },
      ],
      { duration: 450, easing: "ease-out" }
    );
  } else {
    // fallback (klassbaserad)
    el.classList.add("flash-fallback");
    setTimeout(() => el.classList.remove("flash-fallback"), 450);
  }
}