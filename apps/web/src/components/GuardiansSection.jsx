import React from "react";

/**
 * Calestra Guardians — korsande titlar i känslofantasi.
 * Visas som en enkel sektion på förstasidan (informativ + varumärkesbyggande).
 */

const GUARDIANS = [
  {
    id: "stillhet",
    color: "#7dd3fc",
    titleEmotion: "Stillhetsväktare",
    titleFunction: "Gästvärd",
    blurb:
      "De som håller rummet lugnt. Mjuk guidning, stilla röster, trygga vägar.",
  },
  {
    id: "gladje",
    color: "#facc15",
    titleEmotion: "Ljusbärare",
    titleFunction: "Parkvärd",
    blurb:
      "De som sprider glädje där du går. Ett skratt, en blick, en gnista i natten.",
  },
  {
    id: "aventyr",
    color: "#34d399",
    titleEmotion: "Spårvävare",
    titleFunction: "Attraktionsvärd",
    blurb:
      "De som öppnar stigar och leder modet framåt. Äventyret börjar med ett ja.",
  },
  {
    id: "karlek",
    color: "#fb7185",
    titleEmotion: "Hjärtväktare",
    titleFunction: "Concierge",
    blurb:
      "De som knyter samman. Värme i rösten, omtanke i detaljerna, hem i världen.",
  },
];

export default function GuardiansSection() {
  return (
    <section className="guardians">
      <div className="guardians-head">
        <h2>Möt våra Väktare</h2>
        <p className="muted">
          I Calestra bär varje medarbetare två namn: ett för känslan, ett för
          funktionen. Det skapar värdskap som känns levande, nära och äkta.
        </p>
      </div>

      <div className="guardians-grid">
        {GUARDIANS.map((g) => (
          <article key={g.id} className="guardian-card">
            <div
              className="guardian-pill"
              style={{ background: `${g.color}22`, borderColor: `${g.color}55` }}
            >
              <span
                className="dot"
                style={{ background: g.color, boxShadow: `0 0 16px ${g.color}` }}
              />
              <strong>{g.titleEmotion}</strong> <span>– {g.titleFunction}</span>
            </div>
            <p className="muted">{g.blurb}</p>
          </article>
        ))}
      </div>

      <p className="muted guardians-foot">
        Våra Väktare (Guardians) kan även möta dig i parken, ibland
        överraskande – inte bara i fasta möten. Ibland bär de ledtrådar till
        hemliga portar. Håll ögonen öppna.
      </p>
    </section>
  );
}
