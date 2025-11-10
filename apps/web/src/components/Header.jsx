// apps/web/src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import Tagline from "./Tagline";
import "../styles/Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo-group" aria-label="Go to start">
          <img
            src="/brand/harmonic-star.svg"
            alt="Calestra – The Harmonic Star"
            className="logo"
            width="48"
            height="48"
          />
          <div className="brand-text">
            <h1>Calestra</h1>
            <Tagline />
          </div>
        </Link>

        <nav className="nav" aria-label="Main navigation">
          <Link to="/tickets">Tickets</Link>
          <Link to="/hotels">Hotels</Link>
          <Link to="/dining">Dining</Link>
          <Link to="/plan">Plan</Link>
          <Link to="/store">Store</Link>
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
