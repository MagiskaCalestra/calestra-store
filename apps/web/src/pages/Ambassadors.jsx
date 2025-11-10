import React from "react";

export default function Ambassadors() {
  return (
    <div className="container">
      <h1>Bli Calestra-ambassadör ✨</h1>
      <p>
        Sprid magin – få betalt per såld vara. Du får en personlig länk och kod som spårar varje köp.
      </p>

      <ul className="bullets">
        <li>💰 Provision: <b>10–15 % av varje såld vara</b></li>
        <li>📤 Utbetalning sker månadsvis (Swish/PayPal)</li>
        <li>🌍 Inga krav på exklusivitet – bara respektfullt och äkta innehåll</li>
      </ul>

      <h2>Ansök här</h2>
      {/* Byt action till din Formspree/Netlify Forms/Google Form */}
      <form method="POST" action="https://formspree.io/f/YOUR_FORM_ID">
        <input name="name" placeholder="Namn" required />
        <input name="email" type="email" placeholder="E-post" required />
        <input name="social" placeholder="Instagram/TikTok/URL" required />
        <textarea name="why" placeholder="Varför vill du vara ambassadör?" />
        <button type="submit">Skicka ansökan</button>
      </form>

      <p className="after">
        Efter godkännande får du en unik länk som <code>/go?p=dittnamn</code> samt en rabattkod
        till dina följare. Delningslänkar kan peka mot portal eller butik, t.ex.
        <code> /go?p=dittnamn&amp;to=https://store.calestraworld.com/shop</code>.
      </p>

      <style>{`
        .container { max-width: 860px; margin: 0 auto; padding: 24px; }
        .bullets { margin: 12px 0 22px; }
        .bullets li { margin: 6px 0; }
        form { display: grid; gap: 12px; margin-top: 12px; }
        input, textarea {
          padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; background: #fff; color:#0f172a;
        }
        .theme-dark input, .theme-dark textarea {
          background:#0f1622; color:#e6e7ea; border-color:#243041;
        }
        button {
          background:#4B6BFA; color:#fff; font-weight:800; border:0; border-radius:12px; height:46px;
        }
        button:hover { background:#3F5BE0; }
        .after { margin-top: 18px; color:#64748b; }
        code { background: rgba(148,163,184,.15); padding: 2px 6px; border-radius: 6px; }
      `}</style>
    </div>
  );
}
