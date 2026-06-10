import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";

const SoundContext = createContext(null);

const LS_KEY = "snd.muted";

const COIN_SOUND_SRC = "/sounds/get-coins-351945.mp3";
const STORE_MUSIC_SRC = "/sounds/calestra-store-theme.mp3";

function canUseAudio() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function createWebAudioPing() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  return new AC();
}

export function SoundProvider({ children }) {
  const [muted, setMutedState] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const coinRef = useRef(null);
  const musicRef = useRef(null);
  const fallbackCtxRef = useRef(null);
  const destroyedRef = useRef(false);
  const unlockedRef = useRef(false);

  const stopMusic = useCallback(() => {
    const audio = musicRef.current;
    if (!audio) return;

    try {
      audio.pause();
    } catch {
      // noop
    }
  }, []);

  const startMusic = useCallback(async () => {
    if (muted) return false;

    const audio = musicRef.current;
    if (!audio) return false;

    try {
      audio.loop = true;
      audio.volume = 0.18;

      const playPromise = audio.play();

      if (playPromise && typeof playPromise.then === "function") {
        await playPromise;
      }

      return true;
    } catch {
      return false;
    }
  }, [muted]);

  const setMuted = useCallback(
    (value) => {
      const next = !!value;
      setMutedState(next);

      if (next) {
        stopMusic();
      } else {
        void startMusic();
      }
    },
    [startMusic, stopMusic]
  );

  const toggle = useCallback(() => {
    setMutedState((current) => {
      const next = !current;

      if (next) {
        stopMusic();
      } else {
        window.setTimeout(() => {
          void startMusic();
        }, 0);
      }

      return next;
    });
  }, [startMusic, stopMusic]);

  useEffect(() => {
    destroyedRef.current = false;

    if (!canUseAudio()) {
      coinRef.current = null;
      musicRef.current = null;

      return () => {
        destroyedRef.current = true;
      };
    }

    try {
      const coinAudio = new Audio();
      coinAudio.src = COIN_SOUND_SRC;
      coinAudio.preload = "none";
      coinAudio.crossOrigin = "anonymous";
      coinRef.current = coinAudio;
    } catch {
      coinRef.current = null;
    }

    try {
      const musicAudio = new Audio();
      musicAudio.src = STORE_MUSIC_SRC;
      musicAudio.preload = "auto";
      musicAudio.loop = true;
      musicAudio.volume = 0.18;
      musicAudio.crossOrigin = "anonymous";
      musicRef.current = musicAudio;
    } catch {
      musicRef.current = null;
    }

    return () => {
      destroyedRef.current = true;

      try {
        if (coinRef.current) {
          coinRef.current.pause();
          coinRef.current.removeAttribute("src");
          coinRef.current.load();
        }
      } catch {
        // noop
      }

      try {
        if (musicRef.current) {
          musicRef.current.pause();
          musicRef.current.removeAttribute("src");
          musicRef.current.load();
        }
      } catch {
        // noop
      }

      coinRef.current = null;
      musicRef.current = null;

      try {
        if (fallbackCtxRef.current && fallbackCtxRef.current.state !== "closed") {
          fallbackCtxRef.current.close().catch(() => {});
        }
      } catch {
        // noop
      }

      fallbackCtxRef.current = null;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, muted ? "1" : "0");
    } catch {
      // noop
    }
  }, [muted]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function unlockStoreMusic() {
      if (unlockedRef.current) return;
      unlockedRef.current = true;

      if (!muted) {
        void startMusic();
      }

      window.removeEventListener("pointerdown", unlockStoreMusic);
      window.removeEventListener("keydown", unlockStoreMusic);
      window.removeEventListener("touchstart", unlockStoreMusic);
      window.removeEventListener("scroll", unlockStoreMusic);
    }

    window.addEventListener("pointerdown", unlockStoreMusic, { passive: true });
    window.addEventListener("keydown", unlockStoreMusic);
    window.addEventListener("touchstart", unlockStoreMusic, { passive: true });
    window.addEventListener("scroll", unlockStoreMusic, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlockStoreMusic);
      window.removeEventListener("keydown", unlockStoreMusic);
      window.removeEventListener("touchstart", unlockStoreMusic);
      window.removeEventListener("scroll", unlockStoreMusic);
    };
  }, [muted, startMusic]);

  const playFallbackPing = useCallback(() => {
    if (typeof window === "undefined") return;
    if (destroyedRef.current || muted) return;

    try {
      if (!fallbackCtxRef.current || fallbackCtxRef.current.state === "closed") {
        fallbackCtxRef.current = createWebAudioPing();
      }

      const ctx = fallbackCtxRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.exponentialRampToValueAtTime(1240, now + 0.08);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      oscillator.start(now);
      oscillator.stop(now + 0.2);

      oscillator.onended = () => {
        try {
          oscillator.disconnect();
          gain.disconnect();
        } catch {
          // noop
        }
      };
    } catch {
      // noop
    }
  }, [muted]);

  const playCoin = useCallback(() => {
    if (muted) return;

    const audio = coinRef.current;
    if (!audio) {
      playFallbackPing();
      return;
    }

    try {
      audio.currentTime = 0;

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          playFallbackPing();
        });
      }
    } catch {
      playFallbackPing();
    }
  }, [muted, playFallbackPing]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleCartAdd() {
      playCoin();
    }

    window.addEventListener("cart:add", handleCartAdd);
    return () => window.removeEventListener("cart:add", handleCartAdd);
  }, [playCoin]);

  const api = useMemo(
    () => ({
      muted,
      toggle,
      setMuted,
      startMusic,
      stopMusic,
      play: (name) => {
        if (muted) return;

        if (name === "add" || name === "coin" || name === "reward") {
          playCoin();
          return;
        }

        playFallbackPing();
      },
    }),
    [muted, toggle, setMuted, startMusic, stopMusic, playCoin, playFallbackPing]
  );

  return <SoundContext.Provider value={api}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within SoundProvider");
  return ctx;
}