import React from "react";

const Btn = ({ href, children, variant = "solid" }) => (
  <a
    href={href}
    className={`cw-cta cw-cta--${variant}`}
    {...(href === "#" ? { "aria-disabled": "true" } : {})}
  >
    {children}
  </a>
);

export default function ActionBar() {
  return (
    <section className="cw-section">
      <div className="cw-ctaRow">
        <Btn href="#" variant="ghost">Boka ditt magiska paket</Btn>
        <Btn href="http://localhost:5175/">Calestra Store</Btn>
        <Btn href="#" variant="ghost">Streama Calestra â™ª</Btn>
        <Btn href="#" variant="ghost">C-Wish âœ§</Btn>
      </div>
    </section>
  );
}
