// D:\WebProjects\Calestra\apps\admin\src\pages\Login.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

function getAdminEmail() {
  try {
    return localStorage.getItem("cw.admin.email") || "admin@calestra.local";
  } catch {
    return "admin@calestra.local";
  }
}

function setAuthed(email) {
  try {
    localStorage.setItem("cw.admin", "1");
    localStorage.setItem("cw.admin.email", email || "admin@calestra.local");
  } catch {}
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state && loc.state.from) || "/";

  const [email, setEmail] = React.useState(getAdminEmail());
  const [code, setCode] = React.useState("");
  const [err, setErr] = React.useState("");

  function submit(e) {
    e.preventDefault();
    setErr("");

    const ok = String(code || "").trim();
    if (ok !== "1" && ok.toLowerCase() !== "calestra") {
      setErr('Fel kod. Skriv "1" eller "calestra".');
      return;
    }

    setAuthed(email);
    nav(from, { replace: true });
  }

  return (
    <div className="loginWrap">
      <div className="loginCard">
        <div className="loginHeader">
          <div className="loginTitle">Calestra Admin</div>
          <div className="loginSub">Säkert läge för testlansering</div>
        </div>

        <form onSubmit={submit} className="loginForm">
          <label className="label">Admin e-post</label>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label className="label" style={{ marginTop: 12 }}>
            Unlock code
          </label>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder='Skriv "1" eller "calestra"'
            autoComplete="off"
          />

          {err ? (
            <div style={{ marginTop: 10, color: "rgba(248,113,113,.92)", fontWeight: 900 }}>
              {err}
            </div>
          ) : null}

          <button className="btn btnAccent" type="submit" style={{ marginTop: 14, width: "100%" }}>
            Lås upp admin
          </button>

          <div className="tinyHelp" style={{ marginTop: 10 }}>
            Tips: detta är en snabb test-auth. Byt senare till riktig login när identity kopplas in.
          </div>
        </form>
      </div>
    </div>
  );
}
