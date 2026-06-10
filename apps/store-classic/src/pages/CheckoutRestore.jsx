// D:\WebProjects\Calestra\apps\store-classic\src\pages\CheckoutRestore.jsx
import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_PUBLIC_API_BASE) ||
  "https://magiskacalestra.se";

const CHECKOUT_DRAFT_ID_KEY = "cw.checkoutDraftId";

function setDraftId(draftId) {
  try {
    localStorage.setItem(CHECKOUT_DRAFT_ID_KEY, String(draftId || ""));
  } catch {}
}

async function readJsonSafe(res) {
  const text = await res.text().catch(() => "");
  if (!text) return { json: null, text: "" };
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

export default function CheckoutRestore() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { replaceCart } = useCart();

  const [state, setState] = React.useState({
    loading: true,
    ok: false,
    error: "",
    draft: null,
    items: [],
  });

  React.useEffect(() => {
    let alive = true;

    async function run() {
      if (!draftId) {
        if (!alive) return;
        setState({
          loading: false,
          ok: false,
          error: "Saknar draft-id.",
          draft: null,
          items: [],
        });
        return;
      }

      try {
        const url = new URL("/api/checkout-restore", API_BASE);
        url.searchParams.set("draftId", draftId);

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: { accept: "application/json" },
        });

        const { json, text } = await readJsonSafe(res);
        if (!res.ok || !json?.ok) {
          const msg = json?.detail || json?.error || text || res.statusText || "API error";
          throw new Error(msg);
        }

        const items = Array.isArray(json?.items) ? json.items : [];
        const draft = json?.draft || null;

        replaceCart(items);
        setDraftId(draftId);

        if (!alive) return;

        setState({
          loading: false,
          ok: true,
          error: "",
          draft,
          items,
        });

        setTimeout(() => {
          navigate("/cart", { replace: true });
        }, 900);
      } catch (e) {
        if (!alive) return;
        setState({
          loading: false,
          ok: false,
          error: String(e?.message || e),
          draft: null,
          items: [],
        });
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [draftId, navigate, replaceCart]);

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 32 }}>
      <div className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
        {state.loading ? (
          <>
            <div className="kicker">HARMONIC STAR</div>
            <h1 style={{ marginTop: 8 }}>Återställer kundvagn…</h1>
            <p className="muted">
              Vi hämtar sparade produkter och skickar dig vidare till kundvagnen.
            </p>
          </>
        ) : state.ok ? (
          <>
            <div className="kicker">HARMONIC STAR</div>
            <h1 style={{ marginTop: 8 }}>Kundvagnen är återställd</h1>
            <p className="muted">
              {state.items.length} produkt{state.items.length === 1 ? "" : "er"} laddad{state.items.length === 1 ? "" : "e"}.
              Du skickas nu vidare till kundvagnen.
            </p>

            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,.22)",
                background: "rgba(255,255,255,.04)",
              }}
            >
              <div className="muted">
                Draft ID: <b>{draftId}</b>
              </div>
              {state.draft?.email ? <div className="muted">Email: {state.draft.email}</div> : null}
              {state.draft?.last_seen_at ? <div className="muted">Senast aktiv: {state.draft.last_seen_at}</div> : null}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <Link className="btn primary" to="/cart">
                Gå till kundvagnen nu
              </Link>
              <Link className="btn" to="/shop">
                Till butiken
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="kicker">HARMONIC STAR</div>
            <h1 style={{ marginTop: 8 }}>Kunde inte återställa kundvagnen</h1>
            <p className="muted">
              {state.error || "Draften kunde inte hittas eller är inte längre tillgänglig."}
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <Link className="btn primary" to="/shop">
                Till butiken
              </Link>
              <Link className="btn" to="/cart">
                Till kundvagnen
              </Link>
            </div>
          </>
        )}
      </div>

      <style>{`
        .container{
          max-width:1100px;
          margin:0 auto;
          padding:16px;
        }
        .card{
          background:linear-gradient(180deg, rgba(255,255,255,.97), rgba(248,250,252,.99));
          border-radius:24px;
          padding:24px;
          border:1px solid rgba(15,23,42,.08);
          box-shadow:0 18px 42px rgba(15,23,42,.08);
        }
        .theme-dark .card{
          background:linear-gradient(180deg, rgba(15,22,34,.98), rgba(8,12,20,.98));
          border-color:rgba(255,255,255,.08);
        }
        .kicker{
          display:inline-flex;
          padding:6px 10px;
          border-radius:999px;
          background:rgba(15,23,42,.05);
          border:1px solid rgba(15,23,42,.08);
          color:#475569;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
        }
        .theme-dark .kicker{
          background:rgba(255,255,255,.05);
          border-color:rgba(148,163,184,.18);
          color:#cbd5e1;
        }
        h1{
          font-size:clamp(28px,4vw,46px);
          line-height:1.02;
          letter-spacing:-.04em;
          color:#0f172a;
          margin-bottom:8px;
        }
        .theme-dark h1{ color:#f8fafc; }
        .muted{
          color:#475569;
          line-height:1.6;
          font-weight:700;
        }
        .theme-dark .muted{ color:#cbd5e1; }
        .btn{
          border-radius:999px;
          border:1px solid rgba(148,163,184,.7);
          padding:10px 14px;
          background:#f9fafb;
          font-size:13px;
          cursor:pointer;
          text-decoration:none;
          font-weight:800;
          color:#111827;
          display:inline-flex;
          align-items:center;
          justify-content:center;
        }
        .theme-dark .btn{
          background:rgba(255,255,255,.04);
          color:#f8fafc;
          border-color:rgba(148,163,184,.22);
        }
        .btn.primary{
          border-color:#111827;
          background:#111827;
          color:#f9fafb;
        }
        .theme-dark .btn.primary{
          background:#f8fafc;
          color:#020617;
          border-color:#f8fafc;
        }
      `}</style>
    </div>
  );
}