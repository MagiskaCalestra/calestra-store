// D:\WebProjects\Calestra\apps\store-classic\src\components\SmartImg.jsx
import React from "react";

const FALLBACK_SRC = "/images/no-image.png";

export default function SmartImg({
  src,
  alt = "",
  className = "",
  loading = "lazy",
  decoding = "async",
  onError,
  ...rest
}) {
  const cleanSrc = typeof src === "string" && src.trim() ? src.trim() : FALLBACK_SRC;
  const [imgSrc, setImgSrc] = React.useState(cleanSrc);

  React.useEffect(() => {
    setImgSrc(cleanSrc);
  }, [cleanSrc]);

  function handleError(event) {
    if (typeof onError === "function") {
      onError(event);
    }

    if (imgSrc !== FALLBACK_SRC) {
      setImgSrc(FALLBACK_SRC);
    }
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={handleError}
      {...rest}
    />
  );
}