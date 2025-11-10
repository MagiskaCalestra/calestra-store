import React from "react";

/**
 * Endast dekor: ett subtilt overlay med gradientkorn (filmisk look).
 */
export default function HeroBackground() {
  return (
    <div className="hero-overlay" aria-hidden="true">
      <div className="grain" />
      <div className="vignette" />
    </div>
  );
}
