import React from "react";
import { Link } from "react-router-dom";

const VERSION = "track_page_v1_2026-04-24_transport_feel";

function clean(v) {
  return String(v || "").trim();
}

function getStatus(input) {
  const q = clean(input).toLowerCase();

  if (!q) {
    return {
      tone: "neutral",
      title: "Ange ordernummer eller trackingnummer",
      text: "När din order har skickats visas spårningsinformation här.",
      step: 0,
    };
  }

  if (q.length < 4) {
    return {
      tone: "warn",
      title: "Numret verkar för kort",
      text: "Kontrollera ordernummer eller trackingnummer och försök igen.",
      step: 0,
    };
  }

  return {
    tone: "ok",
    title: "Spårning förberedd",
    text: "När Printful eller transportören skickar trackingdata kan denna sida visa aktuell leveransstatus.",
    step: 2,
  };
}

export default function Track() {
  const [query, setQuery] = React.useState("");
  const status = getStatus(query);

  return (
    <main style={page()}>
      <section style={hero()}>
        <div style={badge()}>CALESTRA TRANSPORT</div>

        <h1 style={title()}>Spåra din leverans</h1>

        <p style={lead()}>
          Följ din Calestra-order från produktion till dörr. När din order har skickats visas tracking från
          transportören här.
        </p>

        <div style={searchBox()}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ordernummer eller trackingnummer"
            style={input()}
          />
          <button type="button" style={button()}>
            Spåra
          </button>
        </div>

        <div style={statusCard(status.tone)}>
          <strong>{status.title}</strong>
          <span>{status.text}</span>
        </div>
      </section>

      <section style={timeline()}>
        {[
          ["Order mottagen", "Din beställning har registrerats i Calestra."],
          ["Produktion", "Produkten tillverkas efter beställning."],
          ["Skickad", "Paketet lämnar produktionen och får tracking."],
          ["På väg", "Transportören hanterar leveransen."],
          ["Levererad", "Paketet når kundens dörr."],
        ].map((item, index) => {
          const active = index <= status.step;
          return (
            <div key={item[0]} style={step(active)}>
              <div style={dot(active)} />
              <div>
                <strong>{item[0]}</strong>
                <p>{item[1]}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section style={infoGrid()}>
        <div style={infoCard()}>
          <h2>Produktion efter beställning</h2>
          <p>
            Calestra använder print-on-demand i startfasen. Det betyder att produkten skapas när ordern läggs.
          </p>
        </div>

        <div style={infoCard()}>
          <h2>Tracking aktiveras vid skickad order</h2>
          <p>
            Trackingnummer visas först när produkten är färdigproducerad och överlämnad till transportör.
          </p>
        </div>

        <div style={infoCard()}>
          <h2>Behöver du hjälp?</h2>
          <p>
            Har du frågor om en order kan du kontakta Calestra-supporten med ordernummer.
          </p>
        </div>
      </section>

      <div style={backWrap()}>
        <Link to="/shop" style={backLink()}>
          Tillbaka till butiken
        </Link>
      </div>
    </main>
  );
}

function page() {
  return {
    minHeight: "100vh",
    padding: "36px 16px 56px",
    background:
      "radial-gradient(circle at top, rgba(92,120,255,.20), transparent 34%), linear-gradient(180deg,#07111f,#0b1020 48%,#070a12)",
    color: "rgba(255,255,255,.92)",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  };
}

function hero() {
  return {
    maxWidth: 920,
    margin: "0 auto",
    padding: "34px 22px",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
    boxShadow: "0 24px 70px rgba(0,0,0,.38)",
  };
}

function badge() {
  return {
    display: "inline-flex",
    padding: "7px 11px",
    borderRadius: 999,
    border: "1px solid rgba(255,215,90,.45)",
    color: "rgba(255,225,140,.95)",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: ".12em",
  };
}

function title() {
  return {
    margin: "16px 0 10px",
    fontSize: "clamp(34px, 6vw, 64px)",
    lineHeight: 1,
    letterSpacing: "-.06em",
  };
}

function lead() {
  return {
    maxWidth: 680,
    margin: 0,
    color: "rgba(255,255,255,.72)",
    fontSize: 16,
    lineHeight: 1.6,
  };
}

function searchBox() {
  return {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 24,
  };
}

function input() {
  return {
    flex: "1 1 260px",
    height: 48,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(0,0,0,.26)",
    color: "white",
    padding: "0 14px",
    outline: "none",
    fontSize: 15,
  };
}

function button() {
  return {
    height: 48,
    borderRadius: 16,
    border: "1px solid rgba(255,215,90,.55)",
    background: "linear-gradient(180deg, rgba(255,220,120,.22), rgba(255,220,120,.08))",
    color: "white",
    fontWeight: 950,
    padding: "0 18px",
    cursor: "pointer",
  };
}

function statusCard(tone) {
  const border =
    tone === "ok"
      ? "rgba(90,255,170,.35)"
      : tone === "warn"
        ? "rgba(255,200,80,.45)"
        : "rgba(255,255,255,.12)";

  return {
    marginTop: 18,
    padding: 14,
    borderRadius: 18,
    border: `1px solid ${border}`,
    background: "rgba(0,0,0,.22)",
    display: "flex",
    flexDirection: "column",
    gap: 5,
    color: "rgba(255,255,255,.86)",
  };
}

function timeline() {
  return {
    maxWidth: 920,
    margin: "22px auto 0",
    padding: 20,
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.045)",
  };
}

function step(active) {
  return {
    display: "grid",
    gridTemplateColumns: "22px 1fr",
    gap: 12,
    padding: "12px 0",
    color: active ? "rgba(255,255,255,.94)" : "rgba(255,255,255,.48)",
  };
}

function dot(active) {
  return {
    width: 14,
    height: 14,
    marginTop: 3,
    borderRadius: 999,
    background: active ? "rgba(255,215,90,.95)" : "rgba(255,255,255,.20)",
    boxShadow: active ? "0 0 18px rgba(255,215,90,.45)" : "none",
  };
}

function infoGrid() {
  return {
    maxWidth: 920,
    margin: "22px auto 0",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  };
}

function infoCard() {
  return {
    padding: 18,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.045)",
    color: "rgba(255,255,255,.78)",
  };
}

function backWrap() {
  return {
    maxWidth: 920,
    margin: "22px auto 0",
  };
}

function backLink() {
  return {
    color: "rgba(255,225,140,.95)",
    textDecoration: "none",
    fontWeight: 900,
  };
}