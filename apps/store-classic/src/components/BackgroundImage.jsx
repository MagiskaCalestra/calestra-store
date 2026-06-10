// apps/store-classic/src/components/BackgroundImage.jsx
import { useEffect, useRef, useState } from "react";

/**
 * BackgroundImage
 * Laddar bild via new Image() och sätter som background-image på en <div>.
 * Testar automatiskt .jpg -> .png -> .webp och sedan placeholder.
 *
 * Props:
 *  - src: primär URL (krävs)
 *  - alt: används bara som aria-label på containern
 *  - placeholder: säker fallback (default: set-promo du har i repo)
 *  - style: extra container-styles (width/height etc)
 */
export default function BackgroundImage({
  src,
  alt = "",
  placeholder = "/images/sets/black-star-collection-001-promo.jpg",
  style,
  ...rest
}) {
  const tried = useRef(new Set());
  const [url, setUrl] = useState(src || placeholder);

  useEffect(() => {
    tried.current = new Set();
    tryLoad(src || placeholder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  function candidates(from) {
    const list = [];
    if (from) {
      try {
        const u = new URL(from, window.location.origin);
        const path = u.pathname;
        if (/\.\w+$/.test(path)) {
          const base = path.replace(/\.\w+$/, "");
          list.push(from); // original först
          list.push(base + ".png");
          list.push(base + ".webp");
        } else {
          list.push(from);
        }
      } catch {
        list.push(from);
      }
    }
    list.push(placeholder);
    // unika
    return list.filter((x, i, a) => a.indexOf(x) === i);
  }

  function tryLoad(start) {
    const list = candidates(start);
    const next = list.find((c) => !tried.current.has(c));
    if (!next) {
      setUrl(placeholder);
      return;
    }
    tried.current.add(next);
    const img = new Image();
    img.onload = () => setUrl(next);
    img.onerror = () => tryLoad(next);
    img.src = next;
  }

  return (
    <div
      role="img"
      aria-label={alt}
      style={{
        backgroundImage: `url('${url}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "block",
        ...style
      }}
      {...rest}
    />
  );
}
