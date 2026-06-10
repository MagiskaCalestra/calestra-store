// apps/store-classic/src/pages/Collections.jsx
import React from "react";

export default function Collections() {
  return (
    <main className="container" role="main" aria-labelledby="collectionsTitle" style={{ padding: "32px 0" }}>
      <h1 id="collectionsTitle" style={{ marginTop: 0 }}>All Collections</h1>
      <p style={{ color: "rgba(255,255,255,.9)" }}>
        Explore all collections. Curated drops and classic series will appear here.
      </p>

      <div className="collection-grid" style={{ marginTop: 18 }}>
        <article className="collection-card">
          <img src="/images/collections/harmonic-skies.jpg" alt="Harmonic Skies collection" />
          <div className="body">
            <h3 className="title">Harmonic Skies</h3>
            <p>Dreamlike scenes from the worldâ€™s calm zones.</p>
            <a className="btn" href="/collections/harmonic-skies">View</a>
          </div>
        </article>

        <article className="collection-card">
          <img src="/images/collections/gates-of-light.jpg" alt="Gates of Light collection" />
          <div className="body">
            <h3 className="title">Gates of Light</h3>
            <p>Symbols, gateways and guides in gold and jade.</p>
            <a className="btn" href="/collections/gates-of-light">View</a>
          </div>
        </article>

        <article className="collection-card">
          <img src="/images/collections/evening-plaza.jpg" alt="Evening Plaza collection" />
          <div className="body">
            <h3 className="title">Evening Plaza</h3>
            <p>Warm nights, music and stories in motion.</p>
            <a className="btn" href="/collections/evening-plaza">View</a>
          </div>
        </article>
      </div>
    </main>
  );
}
