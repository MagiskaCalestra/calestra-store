import React from "react";
import { Link } from "react-router-dom";

/**
 * Sektion med Lyra + "Välkommen tillbaka"-kortet
 * Lätt att byta ut text/CTA.
 */
export default function LyraSection() {
  return (
    <section className="lyra-sec">
      <div className="wrap">
        <div className="panel hero-card glass">
          <h2>Välkommen tillbaka, Mira!</h2>
          <p>Din nästa parkresa börjar snart â€“ vill du fortsätta där du slutade?</p>
          <div className="cta-row">
            <Link to="/plan" className="btn pill">Visa alternativ</Link>
            <Link to="/account/orders" className="btn ghost">Mina bokningar</Link>
          </div>
        </div>

        <div className="viz">
          <img className="lyra" src="/images/characters/lyra.png" alt="Lyra" />
          <div className="phone glass">
            <img src="/images/ui/phone.png" alt="" aria-hidden="true" />
            <div className="phone-copy">
              <div className="star">âœ¶</div>
              <div className="line1">Välkommen tillbaka.</div>
              <div className="line2">Fortsätt din resa â†’</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
