// apps/web/src/hooks/useImagesLoaded.js
import { useEffect, useState } from "react";

/**
 * Preloadar en lista av bild-URL:er och returnerar true när alla är laddade.
 * Säker (avbryter setState vid unmount).
 */
export default function useImagesLoaded(urls = []) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!urls || urls.length === 0) {
      setReady(true);
      return;
    }
    let mounted = true;
    let done = 0;

    const onLoad = () => {
      done += 1;
      if (mounted && done >= urls.length) setReady(true);
    };

    const onError = () => {
      // Vi failar inte preload â€“ markerar ändå som loaded när alla försökt
      done += 1;
      if (mounted && done >= urls.length) setReady(true);
    };

    const imgs = urls.map((src) => {
      const img = new Image();
      img.onload = onLoad;
      img.onerror = onError;
      img.src = src;
      return img;
    });

    return () => {
      mounted = false;
      // Avregistrera handlers
      imgs.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [urls]);

  return ready;
}
