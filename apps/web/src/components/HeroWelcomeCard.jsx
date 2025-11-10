import React from "react";
import { Link } from "react-router-dom";

export default function HeroWelcomeCard({ userName = "Gäst" }) {
  return (
    <div className="card hero-welcome">
      <h3>Välkommen tillbaka, {userName}!</h3>
      <p className="muted">Vi minns var du slutade. Vill du fortsätta resan?</p>
      <Link className="btn solid" to="/booking">Fortsätt</Link>
    </div>
  );
}
