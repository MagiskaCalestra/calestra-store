import React, { useMemo, useState } from "react";

const API_BASE = import.meta?.env?.VITE_PUBLIC_API_BASE || "https://magiskacalestra.se";

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ loading: false, ok: false, msg: "" });

  const canSubmit = useMemo(() => isEmail(email) && !state.loading, [email, state.loading]);

  async function submit(e) {
    e?.preventDefault?.();
    const em = String(email || "").trim().toLowerCase();

    if (!isEmail(em)) {
      setState({ loading: false, ok: false, msg: "Skriv en giltig e-postadress." });
      return;
    }

    setState({ loading: true, ok: false, msg: "" });

    try {
      const res = await fetch(new URL("/api/subscribe", API_BASE).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, source: "store-footer" }),
      });

      const json = await res.json().catch(() => ({}));

      // Viktigt: 409 = redan registrerad/pending -> behandla som OK för UX
      if (res.status === 409) {
        setState({
          loading: false,
          ok: true,
          msg: "Du är redan registrerad. Kolla inkorgen om du behöver bekräfta.",
        });
        return;
      }

      if (!res.ok) {
        setState({
          loading: false,
          ok: false,
          msg: json?.error || `Något gick fel (${res.status}). Försök igen.`,
        });
        return;
      }

      setState({
        loading: false,
        ok: true,
        msg: "Klart! Kolla din e-post för att bekräfta.",
      });
      // valfritt: rensa input
      // setEmail("");
    } catch (err) {
      setState({
        loading: false,
        ok: false,
        msg: "Nätverksfel. Försök igen.",
      });
    }
  }

  return (
    <div className="newsletterBox">
      <div className="newsletterTitle">Nyhetsbrev</div>
      <div className="newsletterSub">Få en notis när nästa drop släpps. (Du behöver bekräfta via e-post.)</div>

      <form onSubmit={submit} style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@email.com"
          className="newsletterInput"
          inputMode="email"
          autoComplete="email"
        />
        <button className="newsletterBtn" disabled={!canSubmit}>
          {state.loading ? "…" : "Prenumerera"}
        </button>
      </form>

      {state.msg ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: state.ok ? "inherit" : "var(--danger, #ff6b6b)",
            opacity: state.ok ? 0.9 : 1,
          }}
        >
          {state.msg}
        </div>
      ) : null}
    </div>
  );
}