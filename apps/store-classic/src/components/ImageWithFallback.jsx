import React, { useState } from "react";

export default function ImageWithFallback({ src, alt, ratio = "1/1", ...rest }) {
  const [err, setErr] = useState(false);
  const display = err ? "/images/assets/placeholder.webp" : src;

  return (
    <div style={{
      aspectRatio: ratio,
      background: "linear-gradient(180deg,#0e1116,#0b0d12)",
      borderRadius: 12, overflow: "hidden", position: "relative"
    }}>
      <img
        src={display}
        alt={alt}
        onError={() => setErr(true)}
        style={{width:"100%",height:"100%",objectFit:"cover"}}
        {...rest}
      />
    </div>
  );
}
