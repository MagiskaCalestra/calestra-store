import React from "react";

export default function Navigation() {
  return (
    <header className="cw-nav">
      <div className="cw-nav__inner cw-container">
        <a href="/" className="cw-logo">Calestra World</a>
        <nav className="cw-menu">
          <a href="http://localhost:5175/" className="cw-link">Butik</a>
          <a href="http://localhost:5175/shop" className="cw-link">Produkter</a>
          <a href="#" className="cw-link" aria-disabled="true" title="Kommer snart">C-Wish</a>
          <a href="#" className="cw-link" aria-disabled="true" title="Kommer snart">Berättelser</a>
        </nav>
      </div>
    </header>
  );
}
