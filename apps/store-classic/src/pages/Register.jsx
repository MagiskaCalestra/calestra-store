import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext.jsx";

function cleanError(error) {
  const key = String(error || "").trim().toLowerCase();

  if (key === "email_already_exists") return "Den e-posten används redan.";
  if (key === "weak_password") return "Lösenordet måste vara minst 8 tecken.";
  if (key === "email_required") return "E-post krävs.";
  return "Kunde inte skapa konto just nu.";
}

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { register, isAuthenticated, booting } = useAuth();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  if (!booting && isAuthenticated) {
    return <Navigate to="/mitt-calestra" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;

    if (password !== password2) {
      setError("Lösenorden matchar inte.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await register({
        name,
        email,
        password,
        locale: i18n?.language || "sv-SE",
        currency: "SEK",
      });

      if (!result?.ok) {
        setError(cleanError(result?.error));
        return;
      }

      navigate("/mitt-calestra", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authPage container">
      <div className="authCard">
        <div className="authKicker">HARMONIC STAR</div>

        <h1 className="authTitle">
          {t("auth.register.title", "Skapa ditt Calestra-konto")}
        </h1>

        <p className="authLead">
          {t(
            "auth.register.lead",
            "Börja samla DreamPoints, spara dina uppgifter och följ dina beställningar."
          )}
        </p>

        <form onSubmit={handleSubmit} className="authForm">
          <label className="authLabel">
            {t("form.name", "Namn")}
            <input
              className="authInput"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="authLabel">
            {t("form.email", "E-post")}
            <input
              className="authInput"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="authLabel">
            {t("form.password", "Lösenord")}
            <input
              className="authInput"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label className="authLabel">
            {t("form.passwordRepeat", "Upprepa lösenord")}
            <input
              className="authInput"
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </label>

          {error ? <div className="authError">{error}</div> : null}

          <button className="authBtn" type="submit" disabled={busy}>
            {busy ? "Skapar konto..." : t("auth.register.submit", "Skapa konto")}
          </button>
        </form>

        <div className="authFooter">
          <span>{t("auth.register.haveAccount", "Har du redan konto?")}</span>{" "}
          <Link to="/login">{t("auth.register.loginInstead", "Logga in")}</Link>
        </div>
      </div>

      <style>{`
        .container{max-width:1200px;margin:0 auto;padding:16px;}
        .authPage{display:flex;justify-content:center;padding-top:24px;padding-bottom:32px;}
        .authCard{
          width:min(520px,100%);
          border-radius:24px;
          padding:24px;
          background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(248,250,252,.99));
          border:1px solid rgba(15,23,42,.06);
          box-shadow:0 18px 42px rgba(15,23,42,.08);
        }
        .theme-dark .authCard{
          background:linear-gradient(180deg,rgba(15,22,34,.98),rgba(8,12,20,.98));
          border-color:rgba(255,255,255,.08);
          box-shadow:0 16px 40px rgba(0,0,0,.35);
        }
        .authKicker{
          display:inline-flex;padding:6px 10px;border-radius:999px;
          background:rgba(15,23,42,.05);border:1px solid rgba(15,23,42,.08);
          color:#475569;font-size:11px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;
        }
        .theme-dark .authKicker{
          background:rgba(255,255,255,.05);border-color:rgba(148,163,184,.18);color:#cbd5e1;
        }
        .authTitle{margin:14px 0 8px;font-size:clamp(28px,4vw,44px);line-height:1.03;letter-spacing:-.04em;color:#0f172a;}
        .theme-dark .authTitle{color:#f8fafc;}
        .authLead{margin:0 0 18px;color:#475569;font-size:14px;line-height:1.6;font-weight:700;}
        .theme-dark .authLead{color:#cbd5e1;}
        .authForm{display:grid;gap:14px;}
        .authLabel{display:grid;gap:6px;color:#0f172a;font-weight:800;}
        .theme-dark .authLabel{color:#e6e7ea;}
        .authInput{
          width:100%;height:46px;border:1px solid rgba(201,209,219,.95);
          border-radius:12px;padding:0 12px;background:#fff;color:#111;font-weight:700;
        }
        .theme-dark .authInput{background:#0f1622;color:#e6e7ea;border:1px solid #243041;}
        .authInput:focus{outline:2px solid rgba(75,107,250,.18);border-color:#4B6BFA;box-shadow:0 0 0 4px rgba(75,107,250,.08);}
        .authError{color:#D0342C;font-size:14px;font-weight:800;}
        .authBtn{
          min-height:48px;border:0;border-radius:999px;background:linear-gradient(135deg,#4B6BFA,#3558ff);
          color:#fff;font-weight:900;font-size:14px;cursor:pointer;box-shadow:0 16px 30px rgba(75,107,250,.18);
        }
        .authBtn[disabled]{opacity:.7;cursor:not-allowed;box-shadow:none;}
        .authFooter{margin-top:16px;color:#64748b;font-size:14px;font-weight:700;}
        .authFooter a{color:#3558ff;text-decoration:underline;}
      `}</style>
    </div>
  );
}