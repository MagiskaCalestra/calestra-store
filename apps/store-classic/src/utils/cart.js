// apps/store-classic/src/pages/Cart.jsx
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import {
  formatMoney,
  convertFromSEK,
  computeTotals,
  computeFreeShippingProgress,
} from "../utils/money";

import QtyButtons from "../components/QtyButtons.jsx";

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, add, dec, remove, clear } = useCart();
  const { currency, locale, rates } = useCurrency();

  const isEmpty = items.length === 0;

  // Totals/frakt i aktiv valuta (SE som standardland i korgen)
  const totals = useMemo(
    () => computeTotals(items, currency, rates, "SE"),
    [items, currency, rates]
  );

  const progress = useMemo(
    () =>
      computeFreeShippingProgress(totals.subtotalSEK, currency, rates, "SE"),
    [totals.subtotalSEK, currency, rates]
  );

  const Money = ({ value }) => (
    <span>{formatMoney(value, currency, locale)}</span>
  );

  const handleCheckout = () => {
    if (!isEmpty) navigate("/checkout");
  };

  // Helpers kopplade till rätt produkt (viktigt!)
  const incOne = (it) =>
    add({ id: it.id, title: it.title, price: it.price, image: it.image });
  const decOne = (it) => dec(it.id);
  const removeAll = (id) => remove(id);

  return (
    <div className="container" role="main" aria-labelledby="cart-title">
      <h1 id="cart-title" className="h1">
        {t("cart.title", "Kundvagn")}
      </h1>

      {isEmpty ? (
        <section className="card empty" aria-live="polite">
          <div className="empty-emoji">ðŸ›ï¸</div>
          <h2 className="card-title">
            {t("cart.empty", "Din kundvagn är tom")}
          </h2>
          <p className="muted">
            {t(
              "cart.emptyHint",
              "Lägg till några produkter för att komma vidare till kassan."
            )}
          </p>
          <div className="actions">
            <Link to="/shop" className="btn primary">
              {t("cart.continue", "Till butiken")}
            </Link>
            <Link to="/" className="btn">
              {t("thanks.backHome", "Till startsidan")}
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid">
          {/* Vänster: varor */}
          <section className="card">
            <ul className="list">
              {items.map((it) => {
                const unitActive = convertFromSEK(
                  Number(it.price || 0),
                  currency,
                  rates
                );
                const lineActive = unitActive * Number(it.qty || 0);
                return (
                  <li key={it.id} className="row">
                    <Link
                      to={`/product/${it.id}`}
                      title={t("cart.viewProduct", "Visa produkten")}
                    >
                      <img
                        className="thumb"
                        src={it.image}
                        alt=""
                        aria-hidden="true"
                      />
                    </Link>

                    <div className="info">
                      <div className="title">
                        <Link
                          to={`/product/${it.id}`}
                          className="title-link"
                        >
                          {it.title}
                        </Link>
                      </div>
                      <div className="muted tiny mono">{it.id}</div>

                      <div className="qty">
                        <QtyButtons
                          value={it.qty}
                          onDec={() => decOne(it)}     
                          onInc={() => incOne(it)}     
                        />
                        <button
                          className="link danger"
                          onClick={() => removeAll(it.id)}
                          aria-label={t("cart.remove", "Ta bort artikel")}
                        >
                          {t("cart.remove", "Ta bort")}
                        </button>
                      </div>
                    </div>

                    <div className="prices">
                      <div className="unit">
                        <Money value={unitActive} />
                      </div>
                      <div className="line">
                        <Money value={lineActive} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="toolbar">
              <Link to="/shop" className="btn">
                {t("cart.continue", "Fortsätt handla")}
              </Link>
              <button className="btn ghost" onClick={clear}>
                {t("cart.clear", "Töm kundvagnen")}
              </button>
            </div>
          </section>

          {/* Höger: summering */}
          <aside className="card summary" aria-labelledby="summary-title">
            <h2 id="summary-title" className="card-title">
              {t("checkout.summary", "Orderöversikt")}
            </h2>

            <div className="summary-row">
              <span>{t("checkout.subtotal", "Delsumma")}</span>
              <span>
                <Money value={totals.subtotal} />
              </span>
            </div>

            <div className="summary-row">
              <span>{t("checkout.shippingFee", "Frakt")}</span>
              <span>
                {totals.shipping === 0 ? (
                  t("checkout.free", "Fri frakt")
                ) : (
                  <Money value={totals.shipping} />
                )}
              </span>
            </div>

            <div className="divider" />

            <div className="summary-row total">
              <span>{t("checkout.total", "Totalt")}</span>
              <span>
                <Money value={totals.total} />
              </span>
            </div>

            <div className="free-ship">
              {!progress.isFree ? (
                <>
                  <div className="progress">
                    <div
                      className="bar"
                      style={{
                        width: `${Math.min(
                          100,
                          (1 - progress.remainingSEK / progress.thresholdSEK) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="progress-text">
                    {t(
                      "checkout.progress.toFree",
                      "{{amount}} kvar till fri frakt",
                      {
                        amount: formatMoney(
                          progress.remainingActive,
                          currency,
                          locale
                        ),
                      }
                    )}
                  </div>
                </>
              ) : (
                <div className="progress-success">
                  {t("checkout.progress.free", "Du har fri frakt!")}
                </div>
              )}
            </div>

            <button className="cta" onClick={handleCheckout}>
              {t("cart.checkout", "Till kassan")}
            </button>

            <div className="trust">
              <div className="trust-item">
                ðŸ”’ {t("checkout.trust.ssl", "Säker kassa (SSL)")}
              </div>
              <div className="trust-item">
                ðŸ›¡ï¸ {t("checkout.trust.encrypted", "Krypterade betalningar")}
              </div>
              <div className="trust-item">
                â†©ï¸ {t("trust.returnsShort", "Tillverkas på beställning • Trygg garanti vid fel")}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Mobil sticky-sammanfattning */}
      {!isEmpty && (
        <div
          className="sticky"
          role="region"
          aria-label={t("checkout.summary", "Sammanfattning")}
        >
          <div className="sticky-total">
            {t("checkout.total", "Totalt")}:{" "}
            <Money value={totals.total} />
          </div>
          <button className="cta" onClick={handleCheckout}>
            {t("cart.checkout", "Till kassan")}
          </button>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.container { max-width: 1200px; margin: 0 auto; padding: 16px; }
.h1 { font-size: 28px; margin: 8px 0 16px; }

.card { background:#fff; border-radius:12px; padding:24px; box-shadow:0 2px 6px rgba(0,0,0,.06); border:1px solid #E6EAF0; }
.card + .card { margin-top:24px; }
.theme-dark .card{ background:#0f1622; box-shadow:0 2px 6px rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.06); }

.card-title { font-size:20px; font-weight:800; margin-bottom:12px; color:#0f172a; }
.theme-dark .card-title{ color:#e6e7ea; }

.grid { display:grid; grid-template-columns: 1fr; gap:24px; }
@media (min-width:1024px){ .grid{ grid-template-columns: 2fr 1fr; } }

.muted { color:#3b4250; } .theme-dark .muted{ color:#a3acb8; }
.tiny { font-size:12px; } .mono { font-family: ui-monospace, Menlo, Consolas, monospace; }

.list { list-style:none; padding:0; margin:0; display:grid; gap:16px; }
.row { display:grid; grid-template-columns: 72px 1fr auto; gap:12px; align-items:center; }
.thumb { width:72px; height:72px; border-radius:10px; object-fit:cover; background:#F2F4F7; }
.theme-dark .thumb{ background:#1a2231; }

.title { font-weight:800; margin-bottom:4px; color:#0f172a; } .theme-dark .title{ color:#e6e7ea; }
.title-link { color: inherit; text-decoration: none; } .title-link:hover { text-decoration: underline; }

.info { display:flex; flex-direction:column; gap:6px; }
.prices { text-align:right; display:flex; flex-direction:column; gap:8px; }
.prices .unit { color:#3b4250; font-size:14px; } .theme-dark .unit{ color:#a3acb8; }
.prices .line { font-weight:800; color:#0f172a; } .theme-dark .line{ color:#e6e7ea; }

.qty { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }

.link { background:none; border:0; padding:0; cursor:pointer; text-decoration:underline; color:#3558ff; }
.link:hover { text-decoration:none; }
.link.danger { color:#C0362C; } .theme-dark .link.danger{ color:#ff6b61; }

.toolbar { display:flex; justify-content:space-between; gap:8px; margin-top:12px; flex-wrap:wrap; }
.btn { height:44px; padding:0 14px; border-radius:10px; border:1px solid #D0D7E1; background:#fff; font-weight:700; text-decoration:none; color:#1A1A1A; display:inline-flex; align-items:center; }
.btn:hover{ background:#F6F8FF; }
.theme-dark .btn{ background:#0f1622; color:#e6e7ea; border:1px solid #243041; }
.theme-dark .btn:hover{ background:#162236; }

.summary .summary-row { display:flex; justify-content:space-between; padding:6px 0; color:#0f172a; }
.summary .divider { height:1px; background:#E0E6EE; margin:12px 0; }
.summary .total span:last-child { font-size:18px; font-weight:900; color:#0f172a; }
.theme-dark .summary .summary-row{ color:#e6e7ea; }
.theme-dark .summary .divider{ background:#1d2636; }
.theme-dark .summary .total span:last-child{ color:#e6e7ea; }

.free-ship { margin-top:12px; }
.progress { background:#E3E8F0; height:8px; border-radius:999px; overflow:hidden; }
.progress .bar{ height:8px; background:#4B6BFA; }
.theme-dark .progress{ background:#1d2636; }
.progress-text { font-size:14px; color:#3b4250; margin-top:6px; }
.theme-dark .progress-text{ color:#a3acb8; }
.progress-success { font-size:14px; color:#198754; margin-top:6px; font-weight:700; }

.cta { width:100%; height:50px; border:0; border-radius:12px; background:#4B6BFA; color:#fff; font-weight:900; margin-top:16px; cursor:pointer; }
.cta:hover { background:#3F5BE0; }

.trust { display:grid; gap:8px; margin-top:12px; color:#3b4250; font-size:14px; }
.theme-dark .trust{ color:#a3acb8; }

.empty { text-align:center; }
.empty-emoji { font-size:36px; margin-bottom:6px; }
.actions { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }

.sticky { position:sticky; bottom:0; left:0; right:0; display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:12px;
  background:rgba(255,255,255,.96); backdrop-filter:blur(4px); box-shadow:0 -4px 10px rgba(0,0,0,.06); margin-top:16px; }
.theme-dark .sticky{ background:rgba(8,12,20,.9); box-shadow:0 -4px 10px rgba(0,0,0,.35); }
.sticky-total { display:flex; align-items:center; font-weight:900; color:#0f172a; }
.theme-dark .sticky-total{ color:#e6e7ea; }
@media (min-width:1024px){ .sticky{ display:none; } }
`;
