// apps/store-classic/src/components/Logo.jsx
import React from "react";

/**
 * Visar Calestra-loggan och väljer rätt variant (dark/light)
 * via <picture> + prefers-color-scheme. Faller tillbaka till symbolen om något saknas.
 */
export default function Logo({ height = 36, withText = true }) {
  const light = withText ? "/images/logo/calestra-logo-light.svg" : "/images/logo/calestra-symbol.svg";
  const dark = withText ? "/images/logo/calestra-logo-dark.svg" : "/images/logo/calestra-symbol.svg";

  return (
    <picture>
      <source srcSet={dark} media="(prefers-color-scheme: dark)" />
      <img
        src={light}
        alt="Calestra Store"
        height={height}
        style={{ height, width: "auto", display: "block" }}
        loading="eager"
      />
    </picture>
  );
}
