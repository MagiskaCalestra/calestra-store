// D:\WebProjects\Calestra\apps\store-classic\src\pages\Checkout.jsx
// apps/store-classic/src/pages/Checkout.jsx

import React, { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

import useCheckoutLogic from "./checkout/useCheckoutLogic.js";
import CheckoutFormSections from "./checkout/CheckoutFormSections.jsx";
import CheckoutSummary from "./checkout/CheckoutSummary.jsx";
import { TT } from "../i18n/tt.js";

function isHijackableHeaderTarget(target) {
  if (!target || typeof target.closest !== "function") return false;

  const headerHit = target.closest(".cw-header");
  if (!headerHit) return false;

  const link = target.closest("a[href]");
  const button = target.closest("button");

  if (!link && !button) return false;

  const href = link?.getAttribute?.("href") || "";

  return (
    href === "/assoc" ||
    href === "/corp" ||
    href === "/press" ||
    href === "/progress" ||
    href === "/member" ||
    href.includes("/assoc") ||
    href.includes("/corp")
  );
}

function pointIsInsideElement(clientX, clientY, element) {
  if (!element || typeof element.getBoundingClientRect !== "function") return false;

  const rect = element.getBoundingClientRect();

  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

export default function Checkout() {
  const { t, i18n } = useTranslation();

  const tx = useCallback(
    (key, fallbackByLang, opts) => TT(i18n, t, key, fallbackByLang, opts),
    [i18n, t]
  );

  const {
    items,
    currency,
    locale,
    rates,
    points,
    paused,
    pauseReason,
    agree,
    useSeparateBilling,
    customer,
    shipping,
    billing,
    errors,
    anyPhysical,
    preorderMeta,
    isPreorderFlow,
    isMixedFlow,
    isNotifyOnlyFlow,
    displayTotals,
    progress,
    dreamPreview,
    campaign,
    discountMeta,
    coreMetaWithCampaign,
    prefillActive,
    disabledCTA,
    labels,
    IS_PREVIEW,

    discountCodeInput,
    discountBusy,
    discountValidation,
    discountError,
    appliedDiscountSek,

    setAgree,
    setUseSeparateBilling,
    setDiscountCodeInput,
    handleApplyDiscountCode,
    handleClearDiscountCode,
    onChangeCustomer,
    onChangeShipping,
    onChangeBilling,
    handlePlaceOrder,
    focusFirstError,
    money,
  } = useCheckoutLogic({ t, i18n });

  useEffect(() => {
    focusFirstError();
  }, [errors, focusFirstError]);

  /*
    Mobil-skydd:
    Om en osynlig header-länk ligger ovanpå checkout och försöker skicka användaren
    till t.ex. /assoc när man klickar i adressfältet, stoppar vi klicket här.
  */
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    function protectCheckoutFromHeaderHijack(event) {
      const checkout = document.querySelector(".checkout-page");
      if (!checkout) return;

      const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
      const clientX = Number(touch.clientX);
      const clientY = Number(touch.clientY);

      if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;

      const clickIsVisuallyInsideCheckout = pointIsInsideElement(clientX, clientY, checkout);
      if (!clickIsVisuallyInsideCheckout) return;

      const target = event.target;

      if (checkout.contains(target)) return;

      if (isHijackableHeaderTarget(target)) {
        event.preventDefault();
        event.stopPropagation();

        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
      }
    }

    document.addEventListener("click", protectCheckoutFromHeaderHijack, true);
    document.addEventListener("touchstart", protectCheckoutFromHeaderHijack, true);
    document.addEventListener("pointerdown", protectCheckoutFromHeaderHijack, true);

    return () => {
      document.removeEventListener("click", protectCheckoutFromHeaderHijack, true);
      document.removeEventListener("touchstart", protectCheckoutFromHeaderHijack, true);
      document.removeEventListener("pointerdown", protectCheckoutFromHeaderHijack, true);
    };
  }, []);

  const pageTitle = isNotifyOnlyFlow
    ? tx("checkout.titleNotify", {
        sv: "Bevaka produkt",
        en: "Notify me",
        tr: "Ürün bildirimi",
      })
    : isPreorderFlow
      ? tx("checkout.titlePreorder", {
          sv: "Förbeställning",
          en: "Pre-order",
          tr: "Ön sipariş",
        })
      : isMixedFlow
        ? tx("checkout.titleMixed", {
            sv: "Blandad checkout",
            en: "Mixed checkout",
            tr: "Karma ödeme",
          })
        : tx("checkout.title", {
            sv: "Checkout",
            en: "Checkout",
            tr: "Ödeme",
          });

  return (
    <div className="checkout-page checkout-form-safe container" role="main" aria-labelledby="checkout-title">
      <section
        className="checkout-hero"
        aria-label={tx("checkout.aria.hero", {
          sv: "Checkout",
          en: "Checkout",
          tr: "Ödeme",
        })}
      >
        <div className="checkout-kicker">
          <span className="checkout-live-dot" aria-hidden="true" />
          <span>{labels.kicker}</span>
        </div>

        <h1 id="checkout-title" className="h1">
          {pageTitle}
        </h1>

        <p className="checkout-lead">{labels.lead}</p>

        {prefillActive ? (
          <div className="memberPrefillBadge" aria-live="polite">
            <span aria-hidden="true">✦</span>{" "}
            {tx("checkout.prefillActive", {
              sv: "Uppgifter är förifyllda",
              en: "Details are prefilled",
              tr: "Bilgiler önceden dolduruldu",
            })}
          </div>
        ) : null}

        {isNotifyOnlyFlow ? (
          <div className="notifyCheckoutGuard" role="status" aria-live="polite">
            <strong>
              {tx("checkout.notifyGuard.title", {
                sv: "Bevaka-produkt",
                en: "Notify product",
                tr: "Bildirim ürünü",
              })}
            </strong>
            <span>
              {tx("checkout.notifyGuard.text", {
                sv: "Den här korgen innehåller bara bevaka-produkter och ska inte slutföras som order.",
                en: "This cart only contains notify products and should not be completed as an order.",
                tr: "Bu sepet yalnızca bildirim ürünleri içeriyor ve sipariş olarak tamamlanmamalıdır.",
              })}
            </span>
          </div>
        ) : null}
      </section>

      <div className="grid grid-desktop">
        <CheckoutFormSections
          t={t}
          i18n={i18n}
          paused={paused}
          pauseReason={pauseReason}
          agree={agree}
          useSeparateBilling={useSeparateBilling}
          customer={customer}
          shipping={shipping}
          billing={billing}
          errors={errors}
          anyPhysical={anyPhysical}
          isPreorderFlow={isPreorderFlow}
          prefillActive={prefillActive}
          IS_PREVIEW={IS_PREVIEW}
          labels={labels}
          setAgree={setAgree}
          setUseSeparateBilling={setUseSeparateBilling}
          onChangeCustomer={onChangeCustomer}
          onChangeShipping={onChangeShipping}
          onChangeBilling={onChangeBilling}
        />

        <CheckoutSummary
          t={t}
          i18n={i18n}
          items={items}
          currency={currency}
          locale={locale}
          rates={rates}
          points={points}
          anyPhysical={anyPhysical}
          preorderMeta={preorderMeta}
          isPreorderFlow={isPreorderFlow}
          displayTotals={displayTotals}
          progress={progress}
          dreamPreview={dreamPreview}
          campaign={campaign}
          discountMeta={discountMeta}
          coreMetaWithCampaign={coreMetaWithCampaign}
          labels={labels}
          disabledCTA={disabledCTA}
          IS_PREVIEW={IS_PREVIEW}
          handlePlaceOrder={handlePlaceOrder}
          money={money}
          discountCodeInput={discountCodeInput}
          discountBusy={discountBusy}
          discountValidation={discountValidation}
          discountError={discountError}
          appliedDiscountSek={appliedDiscountSek}
          setDiscountCodeInput={setDiscountCodeInput}
          handleApplyDiscountCode={handleApplyDiscountCode}
          handleClearDiscountCode={handleClearDiscountCode}
        />
      </div>

      <style>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
        }

        .checkout-page{
          position:relative;
          z-index:80;
          isolation:isolate;
          pointer-events:auto;
        }

        .checkout-page *,
        .checkout-page input,
        .checkout-page select,
        .checkout-page textarea,
        .checkout-page button,
        .checkout-page label,
        .checkout-page a{
          pointer-events:auto;
        }

        .grid-desktop {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          position:relative;
          z-index:2;
        }

        @media (min-width: 1024px) {
          .grid-desktop {
            grid-template-columns: 2fr 1fr;
          }
        }

        .h1 {
          font-size: clamp(30px, 4.2vw, 54px);
          line-height: 1.02;
          letter-spacing: -.045em;
          margin: 10px 0 8px;
          color:#0f172a;
        }

        .theme-dark .h1 {
          color:#f8fafc;
        }

        .checkout-hero{
          position:relative;
          z-index:2;
          margin: 6px 0 18px;
          padding: 20px;
          border-radius: 24px;
          border: 1px solid rgba(15,23,42,.08);
          background:
            radial-gradient(circle at 92% 10%, rgba(250,204,21,.16), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
          box-shadow: 0 16px 34px rgba(15,23,42,.06);
        }

        .theme-dark .checkout-hero{
          border-color: rgba(148,163,184,.14);
          background:
            radial-gradient(circle at 92% 10%, rgba(250,204,21,.10), transparent 34%),
            linear-gradient(180deg, rgba(2,6,23,.96), rgba(15,23,42,.96));
        }

        .checkout-kicker{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:6px 10px;
          border-radius:999px;
          background: rgba(15,23,42,.05);
          border:1px solid rgba(15,23,42,.08);
          color:#475569;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
        }

        .theme-dark .checkout-kicker{
          background: rgba(255,255,255,.05);
          border-color: rgba(148,163,184,.18);
          color:#cbd5e1;
        }

        .checkout-live-dot{
          width:8px;
          height:8px;
          border-radius:999px;
          background:#f97316;
          box-shadow:0 0 0 0 rgba(249,115,22,.45);
          animation: checkoutPulse 1.8s infinite;
          flex:0 0 auto;
        }

        @keyframes checkoutPulse{
          0%{ box-shadow:0 0 0 0 rgba(249,115,22,.45); }
          70%{ box-shadow:0 0 0 8px rgba(249,115,22,0); }
          100%{ box-shadow:0 0 0 0 rgba(249,115,22,0); }
        }

        .checkout-lead{
          margin:0;
          color:#475569;
          font-size:14px;
          line-height:1.6;
          font-weight:700;
          max-width:72ch;
        }

        .theme-dark .checkout-lead{
          color:#94a3b8;
        }

        .memberPrefillBadge{
          margin-top:12px;
          display:inline-flex;
          align-items:center;
          gap:8px;
          min-height:34px;
          padding:0 12px;
          border-radius:999px;
          background:rgba(16,185,129,.10);
          border:1px solid rgba(16,185,129,.18);
          color:#065f46;
          font-size:12px;
          font-weight:1000;
        }

        .theme-dark .memberPrefillBadge{
          background:rgba(16,185,129,.12);
          border-color:rgba(16,185,129,.22);
          color:#bbf7d0;
        }

        .notifyCheckoutGuard{
          margin-top:14px;
          display:grid;
          gap:4px;
          padding:12px 14px;
          border-radius:16px;
          border:1px solid rgba(59,130,246,.24);
          background:rgba(219,234,254,.52);
          color:#1d4ed8;
          font-size:13px;
          line-height:1.5;
          font-weight:800;
        }

        .notifyCheckoutGuard strong{
          font-size:13px;
          font-weight:1000;
          color:#1e3a8a;
        }

        .theme-dark .notifyCheckoutGuard{
          border-color:rgba(96,165,250,.22);
          background:rgba(59,130,246,.12);
          color:#bfdbfe;
        }

        .theme-dark .notifyCheckoutGuard strong{
          color:#dbeafe;
        }

        .card {
          position:relative;
          z-index:2;
          background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.99));
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 18px 42px rgba(15,23,42,.08);
          border: 1px solid rgba(15,23,42,.06);
        }

        .card--soft{
          position:relative;
          overflow:hidden;
        }

        .theme-dark .card {
          background: linear-gradient(180deg, rgba(2,6,23,.96), rgba(15,23,42,.96));
          border-color: rgba(255,255,255,.06);
          box-shadow: 0 14px 34px rgba(0,0,0,.35);
        }

        .card + .card {
          margin-top: 24px;
        }

        .card-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
          letter-spacing:-.02em;
        }

        .theme-dark .card-title {
          color: #e6e7ea;
        }

        .pauseNotice{
          display:flex;
          align-items:center;
          gap:10px;
          border:1px solid rgba(244,63,94,.35);
          background: rgba(244,63,94,.08);
          padding: 10px 12px;
          border-radius: 12px;
          margin: 0 0 14px;
        }

        .pauseBadge{
          font-weight:1000;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(244,63,94,.12);
          border:1px solid rgba(244,63,94,.35);
        }

        .pauseText{
          font-weight:900;
          color:#0f172a;
          opacity:.92;
        }

        .pauseReason{
          opacity:.7;
          font-weight:900;
        }

        .theme-dark .pauseText{
          color:#e6e7ea;
        }

        .previewBanner{
          border:1px solid rgba(75,107,250,.35);
          background: rgba(75,107,250,.08);
          padding: 12px 14px;
          border-radius: 14px;
          margin: 0 0 16px;
          box-shadow: 0 10px 24px rgba(75,107,250,.06);
        }

        .theme-dark .previewBanner{
          border-color: rgba(124,139,255,.35);
          background: rgba(124,139,255,.10);
        }

        .previewTitle{
          font-weight:800;
          color:#0f172a;
          margin-bottom:4px;
        }

        .theme-dark .previewTitle{
          color:#e6e7ea;
        }

        .previewText{
          color:#334155;
          font-size:14px;
          line-height:1.5;
        }

        .theme-dark .previewText{
          color:#c9d2e3;
        }

        .fieldset {
          border:0;
          padding:0;
          margin:0;
        }

        .grid {
          display:grid;
          gap:16px;
        }

        .grid-1 {
          grid-template-columns:1fr;
        }

        .grid-2 {
          grid-template-columns:1fr;
        }

        .grid-3 {
          grid-template-columns:1fr;
        }

        @media (min-width:768px){
          .grid-2 {
            grid-template-columns:1fr 1fr;
          }

          .grid-3 {
            grid-template-columns:1fr 1fr 1fr;
          }
        }

        .label {
          font-weight:800;
          display:block;
          margin-bottom:6px;
          color:#0f172a;
        }

        .theme-dark .label {
          color:#e6e7ea;
        }

        .hint {
          color:#556070;
          font-size:13px;
          margin-bottom:6px;
          line-height:1.45;
        }

        .theme-dark .hint {
          color:#a3acb8;
        }

        .checkout-page .input {
          position:relative;
          z-index:5;
          width:100%;
          height:46px;
          border:1px solid rgba(201,209,219,.95);
          border-radius:12px;
          padding:0 12px;
          background:#fff;
          color:#111;
          font-weight:700;
          pointer-events:auto;
        }

        .checkout-page select.input {
          padding-right:30px;
        }

        .checkout-page .input:focus {
          outline:2px solid rgba(75,107,250,.18);
          border-color:#4B6BFA;
          box-shadow:0 0 0 4px rgba(75,107,250,.08);
        }

        .theme-dark .checkout-page .input {
          background:#0f1622;
          color:#e6e7ea;
          border:1px solid #243041;
        }

        .theme-dark .checkout-page .input::placeholder {
          color:#9aa3af;
        }

        .theme-dark .checkout-page .input:focus {
          outline:2px solid rgba(124,139,255,.18);
          border-color:#7c8bff;
          box-shadow:0 0 0 4px rgba(124,139,255,.10);
        }

        .error {
          color:#D0342C;
          font-size:14px;
          margin-top:6px;
          font-weight:800;
        }

        .checkbox-row {
          position:relative;
          z-index:5;
          display:flex;
          align-items:flex-start;
          gap:10px;
          color:#0f172a;
          font-weight:700;
          line-height:1.5;
          pointer-events:auto;
        }

        .checkbox-row input{
          transform: translateY(2px);
          pointer-events:auto;
        }

        .checkbox-row label{
          pointer-events:auto;
        }

        .theme-dark .checkbox-row {
          color:#e6e7ea;
        }

        .terms-inline {
          position:relative;
          z-index:5;
          margin-top:8px;
          color:#5C6670;
          font-size:14px;
          line-height:1.55;
        }

        .theme-dark .terms-inline {
          color:#a3acb8;
        }

        .terms-inline a {
          color:#3558ff;
          text-decoration: underline;
          pointer-events:auto;
        }

        .terms-inline a:hover {
          text-decoration: none;
        }

        .summary-card{
          position:relative;
          z-index:2;
          overflow:hidden;
        }

        .summary-star{
          position:absolute;
          inset:auto -10% -14% auto;
          width:220px;
          height:220px;
          border-radius:999px;
          background: radial-gradient(circle, rgba(250,204,21,.18), rgba(250,204,21,0));
          filter: blur(10px);
          pointer-events:none;
        }

        .summary-topline{
          position:relative;
          z-index:1;
          margin-bottom:10px;
        }

        .summary-kicker{
          display:inline-flex;
          padding:5px 9px;
          border-radius:999px;
          background: rgba(15,23,42,.05);
          border:1px solid rgba(15,23,42,.08);
          color:#475569;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
        }

        .theme-dark .summary-kicker{
          background: rgba(255,255,255,.05);
          border-color: rgba(148,163,184,.18);
          color:#cbd5e1;
        }

        .preorder-box{
          margin-bottom: 14px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(249,115,22,.28);
          background:
            linear-gradient(180deg, rgba(249,115,22,.10), rgba(250,204,21,.05));
          position: relative;
          z-index: 1;
        }

        .theme-dark .preorder-box{
          background:
            linear-gradient(180deg, rgba(249,115,22,.14), rgba(255,255,255,.03));
          border-color: rgba(249,115,22,.24);
        }

        .preorder-box-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          flex-wrap:wrap;
        }

        .preorder-box-title{
          font-size: 13px;
          font-weight: 1000;
          color:#0f172a;
        }

        .theme-dark .preorder-box-title{
          color:#f8fafc;
        }

        .preorder-box-badge{
          padding: 4px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: .03em;
          background: rgba(255,255,255,.78);
          border: 1px solid rgba(15,23,42,.08);
          color:#9a3412;
          min-width: 28px;
          text-align:center;
        }

        .theme-dark .preorder-box-badge{
          background: rgba(255,255,255,.06);
          border-color: rgba(148,163,184,.18);
          color:#fdba74;
        }

        .preorder-box-lead{
          margin-top: 6px;
          font-size: 13px;
          line-height: 1.5;
          color:#7c2d12;
          font-weight: 900;
        }

        .theme-dark .preorder-box-lead{
          color:#fed7aa;
        }

        .preorder-box-hint{
          margin-top: 8px;
          font-size: 12px;
          line-height: 1.45;
          color:#9a3412;
          font-weight: 800;
        }

        .theme-dark .preorder-box-hint{
          color:#fdba74;
        }

        .mini-cart {
          list-style:none;
          padding:0;
          margin:0;
          display:grid;
          gap:12px;
          position:relative;
          z-index:1;
        }

        .mini-item {
          display:grid;
          grid-template-columns:56px 1fr auto;
          gap:12px;
          align-items:center;
        }

        .mini-thumb {
          width:56px;
          height:56px;
          object-fit:cover;
          border-radius:10px;
          background:#F3F4F6;
          border:1px solid rgba(148,163,184,.18);
        }

        .theme-dark .mini-thumb {
          background:#1a2231;
        }

        .mini-title {
          font-weight:800;
          color:#0f172a;
          line-height:1.35;
        }

        .theme-dark .mini-title {
          color:#e6e7ea;
        }

        .mini-meta {
          color:#6B7280;
          font-size:13px;
          font-weight:700;
          display:flex;
          align-items:center;
          gap:8px;
          flex-wrap:wrap;
        }

        .theme-dark .mini-meta {
          color:#a3acb8;
        }

        .mini-preorder-pill{
          display:inline-flex;
          align-items:center;
          padding:3px 8px;
          border-radius:999px;
          background:rgba(249,115,22,.12);
          border:1px solid rgba(249,115,22,.24);
          color:#9a3412;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.03em;
        }

        .theme-dark .mini-preorder-pill{
          background:rgba(249,115,22,.16);
          border-color:rgba(249,115,22,.24);
          color:#fdba74;
        }

        .mini-price {
          font-weight:800;
          color:#0f172a;
        }

        .theme-dark .mini-price {
          color:#e6e7ea;
        }

        .divider {
          height:1px;
          background:rgba(224,230,238,.95);
          margin:12px 0;
          position:relative;
          z-index:1;
        }

        .theme-dark .divider {
          background:#1d2636;
        }

        .summary-row {
          display:flex;
          justify-content:space-between;
          padding:6px 0;
          color:#0f172a;
          position:relative;
          z-index:1;
          gap:12px;
        }

        .theme-dark .summary-row {
          color:#e6e7ea;
        }

        .summary-row.total span:last-child {
          font-size:18px;
          font-weight:1000;
          letter-spacing:-.02em;
        }

        .summary-row.discount{
          color:#047857;
          font-weight:900;
        }

        .theme-dark .summary-row.discount{
          color:#86efac;
        }

        .discount-box{
          margin-top: 14px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(16,185,129,.22);
          background:
            linear-gradient(180deg, rgba(16,185,129,.08), rgba(16,185,129,.03));
          position: relative;
          z-index: 1;
        }

        .theme-dark .discount-box{
          background:
            linear-gradient(180deg, rgba(16,185,129,.12), rgba(255,255,255,.03));
          border-color: rgba(16,185,129,.20);
        }

        .discount-box-title{
          font-size: 13px;
          font-weight: 1000;
          color:#0f172a;
          margin-bottom:4px;
        }

        .theme-dark .discount-box-title{
          color:#f8fafc;
        }

        .discount-box-lead{
          font-size: 12px;
          color:#475569;
          line-height:1.45;
          font-weight:800;
          margin-bottom:10px;
        }

        .theme-dark .discount-box-lead{
          color:#cbd5e1;
        }

        .discount-row{
          display:grid;
          grid-template-columns:1fr auto;
          gap:8px;
          align-items:center;
        }

        .discount-row .input{
          height:40px;
          border-radius:999px;
          font-size:13px;
          text-transform:uppercase;
        }

        .discount-actions{
          display:flex;
          gap:6px;
          align-items:center;
          flex-wrap:wrap;
          justify-content:flex-end;
        }

        .discount-btn{
          min-height:40px;
          border:0;
          border-radius:999px;
          padding:0 12px;
          font-size:12px;
          font-weight:1000;
          cursor:pointer;
          background:#10b981;
          color:white;
          box-shadow:0 10px 22px rgba(16,185,129,.16);
        }

        .discount-btn:hover{
          background:#059669;
        }

        .discount-btn.secondary{
          background:rgba(15,23,42,.06);
          color:#334155;
          box-shadow:none;
          border:1px solid rgba(15,23,42,.08);
        }

        .theme-dark .discount-btn.secondary{
          background:rgba(255,255,255,.06);
          color:#e5e7eb;
          border-color:rgba(148,163,184,.16);
        }

        .discount-btn[disabled]{
          opacity:.55;
          cursor:not-allowed;
          box-shadow:none;
        }

        .discount-message{
          margin-top:8px;
          font-size:12px;
          line-height:1.45;
          font-weight:900;
        }

        .discount-message.ok{
          color:#047857;
        }

        .discount-message.bad{
          color:#b91c1c;
        }

        .theme-dark .discount-message.ok{
          color:#86efac;
        }

        .theme-dark .discount-message.bad{
          color:#fecaca;
        }

        .digital-note{
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(15,23,42,.04);
          border: 1px solid rgba(15,23,42,.08);
          color:#475569;
          font-size:12px;
          font-weight:800;
          line-height:1.45;
          position:relative;
          z-index:1;
        }

        .theme-dark .digital-note{
          background: rgba(255,255,255,.05);
          border-color: rgba(148,163,184,.14);
          color:#cbd5e1;
        }

        .free-ship {
          margin-top:12px;
          position:relative;
          z-index:1;
        }

        .progress {
          background:#E3E8F0;
          height:8px;
          border-radius:999px;
          overflow:hidden;
        }

        .progress .bar {
          height:8px;
          background: linear-gradient(90deg, #4B6BFA, #7c8bff);
          transition: width .35s ease-out;
        }

        .theme-dark .progress {
          background:#1d2636;
        }

        .progress-text {
          font-size:13px;
          color:#5C6670;
          margin-top:6px;
          font-weight:800;
        }

        .theme-dark .progress-text {
          color:#a3acb8;
        }

        .progress-success {
          font-size:13px;
          color:#19c37d;
          margin-top:6px;
          font-weight:900;
        }

        .campaign-box{
          margin-top: 14px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(75,107,250,.24);
          background:
            linear-gradient(180deg, rgba(75,107,250,.08), rgba(75,107,250,.03));
          position: relative;
          z-index: 1;
        }

        .theme-dark .campaign-box{
          background:
            linear-gradient(180deg, rgba(75,107,250,.12), rgba(255,255,255,.03));
          border-color: rgba(124,139,255,.20);
        }

        .campaign-box-summary{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          cursor:pointer;
          font-size: 13px;
          font-weight: 1000;
          color:#0f172a;
        }

        .theme-dark .campaign-box-summary{
          color:#f8fafc;
        }

        .campaign-box-summary b{
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:.05em;
          opacity:.75;
        }

        .campaign-box-lead{
          margin-top: 8px;
          font-size: 14px;
          line-height: 1.45;
          color:#475569;
          font-weight: 900;
        }

        .theme-dark .campaign-box-lead{
          color:#cbd5e1;
        }

        .campaign-chip-grid{
          margin-top: 10px;
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }

        .campaign-chip{
          display:inline-flex;
          align-items:center;
          gap:6px;
          border-radius:999px;
          padding:5px 10px;
          font-size:12px;
          font-weight:800;
          background:#fff;
          border:1px solid rgba(15,23,42,.08);
          color:#334155;
        }

        .theme-dark .campaign-chip{
          background: rgba(255,255,255,.05);
          border-color: rgba(148,163,184,.14);
          color:#cbd5e1;
        }

        .dreampoints-box{
          margin-top: 14px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(250,204,21,.28);
          background:
            linear-gradient(180deg, rgba(250,204,21,.10), rgba(250,204,21,.04));
          position: relative;
          z-index: 1;
        }

        .theme-dark .dreampoints-box{
          background:
            linear-gradient(180deg, rgba(250,204,21,.10), rgba(255,255,255,.03));
          border-color: rgba(250,204,21,.20);
        }

        .dreampoints-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          flex-wrap:wrap;
        }

        .dreampoints-title{
          font-size: 13px;
          font-weight: 1000;
          color:#0f172a;
        }

        .theme-dark .dreampoints-title{
          color:#f8fafc;
        }

        .dreampoints-level-badge{
          padding: 4px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: .03em;
          text-transform: capitalize;
          background: rgba(255,255,255,.7);
          border: 1px solid rgba(15,23,42,.08);
          color:#0f172a;
        }

        .theme-dark .dreampoints-level-badge{
          background: rgba(255,255,255,.06);
          border-color: rgba(148,163,184,.18);
          color:#f8fafc;
        }

        .dreampoints-lead{
          margin-top: 4px;
          font-size: 12px;
          line-height: 1.45;
          color:#475569;
          font-weight: 800;
        }

        .theme-dark .dreampoints-lead{
          color:#cbd5e1;
        }

        .dreampoints-grid{
          margin-top: 10px;
          display:grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap:8px;
        }

        .dreampoints-stat{
          border-radius: 14px;
          padding: 10px;
          background: rgba(255,255,255,.72);
          border: 1px solid rgba(15,23,42,.06);
        }

        .theme-dark .dreampoints-stat{
          background: rgba(255,255,255,.04);
          border-color: rgba(148,163,184,.14);
        }

        .dreampoints-label{
          font-size: 11px;
          color:#64748b;
          font-weight: 900;
        }

        .theme-dark .dreampoints-label{
          color:#cbd5e1;
        }

        .dreampoints-value{
          margin-top: 4px;
          font-size: 20px;
          line-height: 1.1;
          font-weight: 1000;
          color:#0f172a;
        }

        .theme-dark .dreampoints-value{
          color:#f8fafc;
        }

        .dreampoints-value.small{
          font-size: 15px;
          text-transform: capitalize;
        }

        .dreampoints-hint{
          margin-top: 10px;
          font-size: 12px;
          line-height: 1.45;
          color:#475569;
          font-weight: 800;
        }

        .theme-dark .dreampoints-hint{
          color:#cbd5e1;
        }

        .meta-box{
          margin-top: 12px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,.08);
          background: rgba(15,23,42,.03);
          position: relative;
          z-index: 1;
        }

        .theme-dark .meta-box{
          background: rgba(255,255,255,.04);
          border-color: rgba(148,163,184,.14);
        }

        .meta-title{
          font-size: 12px;
          font-weight: 1000;
          color:#0f172a;
          margin-bottom:8px;
          text-transform: uppercase;
          letter-spacing:.05em;
          cursor:pointer;
        }

        .theme-dark .meta-title{
          color:#f8fafc;
        }

        .meta-grid{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }

        .meta-chip{
          display:inline-flex;
          align-items:center;
          gap:6px;
          border-radius:999px;
          padding:5px 10px;
          font-size:12px;
          font-weight:800;
          background:#fff;
          border:1px solid rgba(15,23,42,.08);
          color:#334155;
        }

        .theme-dark .meta-chip{
          background: rgba(255,255,255,.05);
          border-color: rgba(148,163,184,.14);
          color:#cbd5e1;
        }

        .celeste-note{
          margin-top: 12px;
          display:flex;
          align-items:center;
          gap:8px;
          font-size:12px;
          font-weight:800;
          color:#475569;
          opacity:.92;
          position:relative;
          z-index:1;
        }

        .theme-dark .celeste-note{
          color:#cbd5e1;
        }

        .celeste-dot{
          width:6px;
          height:6px;
          border-radius:999px;
          background:#facc15;
          box-shadow:0 0 0 6px rgba(250,204,21,.12);
        }

        .cta {
          width:100%;
          min-height:52px;
          border:0;
          border-radius:999px;
          background: linear-gradient(135deg, #4B6BFA, #3558ff);
          color:#fff;
          font-weight:900;
          font-size:14px;
          margin-top:16px;
          cursor:pointer;
          position:relative;
          overflow:hidden;
          box-shadow:0 16px 30px rgba(75,107,250,.18);
          z-index:5;
          pointer-events:auto;
        }

        .cta:hover {
          background: linear-gradient(135deg, #3F5BE0, #2948d8);
        }

        .cta-glow{
          position:absolute;
          inset:0;
          border-radius:999px;
          background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.25), transparent 60%);
          opacity:0;
          transition: opacity .3s ease;
          pointer-events:none;
        }

        .cta:hover .cta-glow{
          opacity:.35;
        }

        .cta.disabled,
        .cta[disabled] {
          background:#D7DDFE;
          color:#7083C8;
          cursor:not-allowed;
          box-shadow:none;
        }

        .theme-dark .cta.disabled,
        .theme-dark .cta[disabled] {
          background:#2a3654;
          color:#8fa0d9;
        }

        .trust {
          display:grid;
          gap:8px;
          margin-top:12px;
          color:#5C6670;
          font-size:13px;
          position:relative;
          z-index:1;
        }

        .theme-dark .trust {
          color:#a3acb8;
        }

        .sticky-bar {
          position:sticky;
          bottom:0;
          left:0;
          right:0;
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
          padding:12px;
          background:rgba(255,255,255,.96);
          backdrop-filter:blur(8px);
          -webkit-backdrop-filter:blur(8px);
          box-shadow:0 -4px 10px rgba(0,0,0,.06);
          margin-top:16px;
          border-top:1px solid rgba(15,23,42,.06);
          border-radius:18px 18px 0 0;
          z-index:10;
          pointer-events:auto;
        }

        .theme-dark .sticky-bar {
          background:rgba(8,12,20,.9);
          box-shadow:0 -4px 10px rgba(0,0,0,.35);
          border-top-color: rgba(255,255,255,.06);
        }

        .sticky-total {
          display:flex;
          align-items:center;
          font-weight:1000;
          color:#0f172a;
          pointer-events:none;
        }

        .theme-dark .sticky-total {
          color:#e6e7ea;
        }

        @media (min-width:1024px){
          .sticky-bar{
            display:none;
          }

          .summary-col{
            position:sticky;
            top:16px;
            height:fit-content;
          }
        }

        @media (max-width: 720px){
          .container {
            padding: 12px;
          }

          .checkout-page{
            z-index:100;
          }

          .card {
            padding: 18px;
            border-radius: 18px;
          }

          .h1 {
            margin-top: 10px;
          }

          .dreampoints-grid{
            grid-template-columns:1fr;
          }

          .discount-row{
            grid-template-columns:1fr;
          }

          .discount-actions{
            justify-content:flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .progress .bar,
          .checkout-live-dot,
          .cta-glow {
            transition: none;
            animation:none;
          }
        }
      `}</style>
    </div>
  );
}