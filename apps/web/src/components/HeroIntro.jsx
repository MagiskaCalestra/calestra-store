import React from "react";

export default function HeroIntro({ title, subtitle, description, onEnter }) {
  return (
    <section className="hero-intro">
      <div className="hero-intro__orb" onClick={onEnter} role="button" aria-label="Enter portal" />
      <h1 className="hero-intro__title">{title}</h1>
      <p className="hero-intro__subtitle">{subtitle}</p>
      <p className="hero-intro__desc">{description}</p>
      <p className="hero-intro__hint">Tips: Du kan alltid klicka på ljuskärnan för att gå vidare.</p>
    </section>
  );
}
