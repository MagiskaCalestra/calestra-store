import React from "react";

export default function Membership() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="h2">Medlemskap</h1>
      <p className="small opacity-80 mt-1">
        Minsta fungerande medlemskap till lansering: registrera e-post och få ditt medlems-ID.
      </p>

      <form className="card" style={{ marginTop: 14 }}>
        <div className="card-pad">
          <label className="label">E-post</label>
          <input className="input" type="email" placeholder="namn@exempel.se" required />
          <div className="small opacity-70" style={{ marginTop: 6 }}>
            Du kan när som helst avsluta din prenumeration. Vi säljer inte dina uppgifter.
          </div>
          <button type="submit" className="btn btn-acc" style={{ marginTop: 10 }}>
            Skapa minimalistiskt konto
          </button>
        </div>
      </form>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-pad">
          <div className="h3">Ambassadör / Affiliate</div>
          <p className="small opacity-80">
            Få provision per såld vara via din länk. Systemet kopplar dina besökare med <code>?ref=DITTID</code>.
          </p>
          <a className="btn btn-ghost" href="/help">Läs mer / få din länk</a>
        </div>
      </div>
    </div>
  );
}
