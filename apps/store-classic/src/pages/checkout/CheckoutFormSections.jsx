// D:\WebProjects\Calestra\apps\store-classic\src\pages\checkout\CheckoutFormSections.jsx
// apps/store-classic/src/pages/checkout/CheckoutFormSections.jsx

import React from "react";
import { TT } from "../../i18n/tt.js";

function asStr(value) {
  return value == null ? "" : String(value);
}

function getErrorId(id) {
  return `${id}-error`;
}

function getHintId(id) {
  return `${id}-hint`;
}

function stopCheckoutBubble(e) {
  if (e?.stopPropagation) e.stopPropagation();
}

function getClickableTag(target) {
  const tag = String(target?.tagName || "").toLowerCase();
  return tag;
}

function Field({ id, label, hint, error, required, children }) {
  const describedBy = [hint ? getHintId(id) : "", error ? getErrorId(id) : ""]
    .filter(Boolean)
    .join(" ");

  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": describedBy || undefined,
        required: required || undefined,
      })
    : children;

  return (
    <div className={`field ${error ? "field--error" : ""}`}>
      <label htmlFor={id} className="label">
        <span>{label}</span>
        {required ? (
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <div id={getHintId(id)} className="hint">
          {hint}
        </div>
      ) : null}

      {child}

      {error ? (
        <div id={getErrorId(id)} className="error" role="alert" aria-live="polite">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function SectionLead({ children }) {
  if (!children) return null;
  return <p className="section-lead">{children}</p>;
}

const COUNTRY_OPTIONS = [
  ["SE", "checkout.country.SE", { sv: "Sverige", en: "Sweden", tr: "İsveç" }],
  ["US", "checkout.country.US", { sv: "USA", en: "United States", tr: "ABD" }],
  [
    "GB",
    "checkout.country.GB",
    { sv: "Storbritannien", en: "United Kingdom", tr: "Birleşik Krallık" },
  ],
  ["DE", "checkout.country.DE", { sv: "Tyskland", en: "Germany", tr: "Almanya" }],
  ["TR", "checkout.country.TR", { sv: "Turkiet", en: "Türkiye", tr: "Türkiye" }],
  ["NO", "checkout.country.NO", { sv: "Norge", en: "Norway", tr: "Norveç" }],
  ["FI", "checkout.country.FI", { sv: "Finland", en: "Finland", tr: "Finlandiya" }],
  ["DK", "checkout.country.DK", { sv: "Danmark", en: "Denmark", tr: "Danimarka" }],
  [
    "NL",
    "checkout.country.NL",
    { sv: "Nederländerna", en: "Netherlands", tr: "Hollanda" },
  ],
  ["FR", "checkout.country.FR", { sv: "Frankrike", en: "France", tr: "Fransa" }],
  ["ES", "checkout.country.ES", { sv: "Spanien", en: "Spain", tr: "İspanya" }],
];

function CountrySelect({ id, value, autoComplete, onChange, t, i18n }) {
  return (
    <select
      id={id}
      className="input"
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      onClick={stopCheckoutBubble}
      onPointerDown={stopCheckoutBubble}
    >
      {COUNTRY_OPTIONS.map(([countryValue, key, fallback]) => (
        <option key={countryValue} value={countryValue}>
          {TT(i18n, t, key, fallback)}
        </option>
      ))}
    </select>
  );
}

export default function CheckoutFormSections({
  t,
  i18n,
  paused,
  pauseReason,
  agree,
  useSeparateBilling,
  customer = {},
  shipping = {},
  billing = {},
  errors = {},
  anyPhysical,
  isPreorderFlow,
  IS_PREVIEW,
  setAgree,
  setUseSeparateBilling,
  onChangeCustomer,
  onChangeShipping,
  onChangeBilling,
}) {
  const tx = React.useCallback(
    (key, fallbackByLang, opts) => TT(i18n, t, key, fallbackByLang, opts),
    [i18n, t]
  );

  const customerName = asStr(customer.name);
  const customerEmail = asStr(customer.email);
  const customerPhone = asStr(customer.phone);

  const shippingCountry = asStr(shipping.country || "SE");
  const billingCountry = asStr(billing.country || "SE");

  const toggleSeparateBillingFromRow = React.useCallback(
    (e) => {
      stopCheckoutBubble(e);

      const tag = getClickableTag(e.target);
      if (tag === "input" || tag === "label" || tag === "a" || tag === "button") return;

      setUseSeparateBilling(!useSeparateBilling);
    },
    [setUseSeparateBilling, useSeparateBilling]
  );

  const toggleAgreeFromRow = React.useCallback(
    (e) => {
      stopCheckoutBubble(e);

      const tag = getClickableTag(e.target);
      if (tag === "input" || tag === "label" || tag === "a" || tag === "button") return;

      setAgree(!agree);
    },
    [setAgree, agree]
  );

  const L = React.useMemo(
    () => ({
      paused: tx("checkout.paused", {
        sv: "Pausad",
        en: "Paused",
        tr: "Duraklatıldı",
      }),
      pauseNotice: tx("checkout.pause.notice", {
        sv: "Butiken är tillfälligt pausad.",
        en: "The store is temporarily paused.",
        tr: "Mağaza geçici olarak duraklatıldı.",
      }),
      customer: tx("checkout.customer", {
        sv: "Kunduppgifter",
        en: "Customer details",
        tr: "Müşteri bilgileri",
      }),
      customerLead: tx("checkout.customer.lead", {
        sv: "Använd uppgifter som vi kan nå dig på om ordern behöver följas upp.",
        en: "Use details where we can reach you if the order needs follow-up.",
        tr: "Sipariş için gerekirse size ulaşabileceğimiz bilgileri kullanın.",
      }),
      name: tx("form.name", {
        sv: "Namn",
        en: "Name",
        tr: "Ad",
      }),
      email: tx("form.email", {
        sv: "E-post",
        en: "Email",
        tr: "E-posta",
      }),
      phone: tx("form.phone", {
        sv: "Telefon",
        en: "Phone",
        tr: "Telefon",
      }),
      phoneHint: tx("checkout.hints.phone", {
        sv: "Använd gärna landskod vid behov, till exempel +46.",
        en: "Use a country code if needed, for example +46.",
        tr: "Gerekirse ülke kodu kullanın, örneğin +46.",
      }),
      shipping: tx("checkout.shipping", {
        sv: "Leveransadress",
        en: "Shipping address",
        tr: "Teslimat adresi",
      }),
      shippingAddress: tx("checkout.shippingAddress", {
        sv: "Leveransadress",
        en: "Shipping address",
        tr: "Teslimat adresi",
      }),
      shippingLead: tx("checkout.shipping.lead", {
        sv: "Fyll i adressen dit produkterna ska skickas.",
        en: "Enter the address where the products should be shipped.",
        tr: "Ürünlerin gönderileceği adresi girin.",
      }),
      company: tx("checkout.field.company", {
        sv: "Företag",
        en: "Company",
        tr: "Şirket",
      }),
      optional: tx("checkout.hints.optional", {
        sv: "Valfritt",
        en: "Optional",
        tr: "İsteğe bağlı",
      }),
      careOf: tx("checkout.field.careOf", {
        sv: "c/o",
        en: "c/o",
        tr: "c/o",
      }),
      address: tx("form.address", {
        sv: "Adress",
        en: "Address",
        tr: "Adres",
      }),
      address2: tx("checkout.field.address2", {
        sv: "Lägenhet/Suite",
        en: "Apartment/Suite",
        tr: "Daire/Suite",
      }),
      doorCode: tx("checkout.field.doorCode", {
        sv: "Portkod",
        en: "Door code",
        tr: "Kapı kodu",
      }),
      postcode: tx("form.postcode", {
        sv: "Postnummer",
        en: "Postcode",
        tr: "Posta kodu",
      }),
      city: tx("form.city", {
        sv: "Ort",
        en: "City",
        tr: "Şehir",
      }),
      country: tx("form.country", {
        sv: "Land",
        en: "Country",
        tr: "Ülke",
      }),
      region: tx("checkout.field.region", {
        sv: "Region/Stat",
        en: "Region/State",
        tr: "Bölge/Eyalet",
      }),
      deliveryNotes: tx("checkout.field.deliveryNotes", {
        sv: "Leveransinstruktion",
        en: "Delivery instructions",
        tr: "Teslimat talimatı",
      }),
      deliveryNotesHint: tx("checkout.hints.deliveryNotes", {
        sv: "Valfritt, kort text",
        en: "Optional, short text",
        tr: "İsteğe bağlı, kısa metin",
      }),
      billingOptions: tx("checkout.billing.options", {
        sv: "Fakturaalternativ",
        en: "Billing options",
        tr: "Fatura seçenekleri",
      }),
      billingUseSeparate: tx("checkout.billing.useSeparate", {
        sv: "Fakturaadress skiljer sig från leverans",
        en: "Billing address differs from shipping",
        tr: "Fatura adresi teslimat adresinden farklı",
      }),
      billing: tx("checkout.billing", {
        sv: "Fakturaadress",
        en: "Billing address",
        tr: "Fatura adresi",
      }),
      billingLead: tx("checkout.billing.lead", {
        sv: "Fyll endast i detta om fakturaadressen skiljer sig från leveransen.",
        en: "Only fill this in if the billing address differs from the delivery address.",
        tr: "Fatura adresi teslimat adresinden farklıysa doldurun.",
      }),
      orgNumber: tx("checkout.field.orgNumber", {
        sv: "Organisationsnummer",
        en: "Company registration number",
        tr: "Şirket kayıt numarası",
      }),
      vatId: tx("checkout.field.vatId", {
        sv: "VAT-ID",
        en: "VAT ID",
        tr: "KDV numarası",
      }),
      terms: tx("checkout.terms", {
        sv: "Köpvillkor",
        en: "Terms of purchase",
        tr: "Satın alma koşulları",
      }),
      agreeDefault: tx("checkout.agree.label", {
        sv: "Jag godkänner köpvillkor & integritetspolicy",
        en: "I accept the terms of purchase & privacy policy",
        tr: "Satın alma koşullarını ve gizlilik politikasını kabul ediyorum",
      }),
      agreePreorder: tx("checkout.agree.label.preorder", {
        sv: "Jag godkänner villkor för förbeställning & integritetspolicy",
        en: "I accept the pre-order terms & privacy policy",
        tr: "Ön sipariş koşullarını ve gizlilik politikasını kabul ediyorum",
      }),
      read: tx("checkout.agree.read", {
        sv: "Läs",
        en: "Read",
        tr: "Oku",
      }),
      and: tx("checkout.and", {
        sv: "och",
        en: "and",
        tr: "ve",
      }),
      privacy: tx("checkout.privacy", {
        sv: "Integritetspolicy",
        en: "Privacy policy",
        tr: "Gizlilik politikası",
      }),
      preorderTerms: tx("checkout.preorderTerms", {
        sv: "Villkor för förbeställning",
        en: "Pre-order terms",
        tr: "Ön sipariş koşulları",
      }),
    }),
    [tx]
  );

  return (
    <div className="col form-col checkout-form-safe" onClick={stopCheckoutBubble}>
      {paused ? (
        <div className="pauseNotice" role="status" aria-live="polite">
          <div className="pauseBadge">{L.paused}</div>
          <div className="pauseText">
            {L.pauseNotice}
            {pauseReason ? <span className="pauseReason"> ({pauseReason})</span> : null}
          </div>
        </div>
      ) : null}

      {IS_PREVIEW ? (
        <div className="previewBanner" role="note" aria-live="polite">
          <div className="previewTitle">
            {tx("checkout.preview.title", {
              sv: "Preview Launch Mode",
              en: "Preview Launch Mode",
              tr: "Önizleme Modu",
            })}
          </div>

          <div className="previewText">
            {isPreorderFlow
              ? tx("checkout.preview.text.preorder", {
                  sv: "Det här är ett testflöde för förbeställning. Ingen riktig betalning tas. Förbeställningen måste nå servern för att synas i admin.",
                  en: "This is a test flow for pre-orders. No real payment is taken. The pre-order must reach the server to appear in admin.",
                  tr: "Bu ön sipariş için test akışıdır. Gerçek ödeme alınmaz. Ön siparişin adminde görünmesi için sunucuya ulaşması gerekir.",
                })
              : tx("checkout.preview.text", {
                  sv: "Det här är en testkassa. Ingen riktig betalning tas. Testordern måste nå servern för att synas i admin.",
                  en: "This is a test checkout. No payment is taken. The test order must reach the server to appear in admin.",
                  tr: "Bu bir test kasasıdır. Ödeme alınmaz. Siparişin adminde görünmesi için sunucuya ulaşması gerekir.",
                })}
          </div>
        </div>
      ) : null}

      <section className="card card--soft" aria-labelledby="customer-title">
        <div className="section-head">
          <h2 id="customer-title" className="card-title">
            {L.customer}
          </h2>
          <SectionLead>{L.customerLead}</SectionLead>
        </div>

        <fieldset className="fieldset">
          <legend className="sr-only">{L.customer}</legend>

          <div className="grid grid-2">
            <div className="grid-cell" data-error-key="customer.name">
              <Field id="name" label={L.name} required error={errors["customer.name"]}>
                <input
                  id="name"
                  className="input"
                  autoComplete="name"
                  value={customerName}
                  onChange={(e) => onChangeCustomer("name", e.target.value)}
                  onClick={stopCheckoutBubble}
                  onPointerDown={stopCheckoutBubble}
                />
              </Field>
            </div>

            <div className="grid-cell" data-error-key="customer.email">
              <Field id="email" label={L.email} required error={errors["customer.email"]}>
                <input
                  id="email"
                  type="email"
                  className="input"
                  autoComplete="email"
                  inputMode="email"
                  value={customerEmail}
                  onChange={(e) => onChangeCustomer("email", e.target.value)}
                  onClick={stopCheckoutBubble}
                  onPointerDown={stopCheckoutBubble}
                />
              </Field>
            </div>
          </div>

          <div className="grid grid-1">
            <div className="grid-cell" data-error-key="customer.phone">
              <Field
                id="phone"
                label={L.phone}
                hint={L.phoneHint}
                required
                error={errors["customer.phone"]}
              >
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  autoComplete="tel"
                  inputMode="tel"
                  value={customerPhone}
                  onChange={(e) => onChangeCustomer("phone", e.target.value)}
                  onClick={stopCheckoutBubble}
                  onPointerDown={stopCheckoutBubble}
                />
              </Field>
            </div>
          </div>
        </fieldset>
      </section>

      {anyPhysical ? (
        <section className="card card--soft" aria-labelledby="shipping-title">
          <div className="section-head">
            <h2 id="shipping-title" className="card-title">
              {L.shipping}
            </h2>
            <SectionLead>{L.shippingLead}</SectionLead>
          </div>

          <fieldset className="fieldset">
            <legend className="sr-only">{L.shippingAddress}</legend>

            <div className="grid grid-2">
              <div className="grid-cell">
                <Field id="company" label={L.company} hint={L.optional}>
                  <input
                    id="company"
                    className="input"
                    autoComplete="organization"
                    value={asStr(shipping.company)}
                    onChange={(e) => onChangeShipping("company", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>

              <div className="grid-cell">
                <Field id="careOf" label={L.careOf} hint={L.optional}>
                  <input
                    id="careOf"
                    className="input"
                    autoComplete="shipping address-line3"
                    value={asStr(shipping.careOf)}
                    onChange={(e) => onChangeShipping("careOf", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-1" data-error-key="shipping.address1">
              <Field id="address1" label={L.address} required error={errors["shipping.address1"]}>
                <input
                  id="address1"
                  className="input"
                  autoComplete="shipping address-line1"
                  value={asStr(shipping.address1)}
                  onChange={(e) => onChangeShipping("address1", e.target.value)}
                  onClick={stopCheckoutBubble}
                  onPointerDown={stopCheckoutBubble}
                />
              </Field>
            </div>

            <div className="grid grid-2">
              <div className="grid-cell">
                <Field id="address2" label={L.address2} hint={L.optional}>
                  <input
                    id="address2"
                    className="input"
                    autoComplete="shipping address-line2"
                    value={asStr(shipping.address2)}
                    onChange={(e) => onChangeShipping("address2", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>

              <div className="grid-cell">
                <Field id="doorCode" label={L.doorCode} hint={L.optional}>
                  <input
                    id="doorCode"
                    className="input"
                    value={asStr(shipping.doorCode)}
                    onChange={(e) => onChangeShipping("doorCode", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-3">
              <div className="grid-cell" data-error-key="shipping.zip">
                <Field id="zip" label={L.postcode} required error={errors["shipping.zip"]}>
                  <input
                    id="zip"
                    className="input"
                    autoComplete="shipping postal-code"
                    inputMode="text"
                    value={asStr(shipping.zip)}
                    onChange={(e) => onChangeShipping("zip", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>

              <div className="grid-cell" data-error-key="shipping.city">
                <Field id="city" label={L.city} required error={errors["shipping.city"]}>
                  <input
                    id="city"
                    className="input"
                    autoComplete="shipping address-level2"
                    value={asStr(shipping.city)}
                    onChange={(e) => onChangeShipping("city", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>

              <div className="grid-cell" data-error-key="shipping.country">
                <Field id="country" label={L.country} required error={errors["shipping.country"]}>
                  <CountrySelect
                    id="country"
                    value={shippingCountry}
                    autoComplete="shipping country"
                    onChange={(e) => onChangeShipping("country", e.target.value)}
                    t={t}
                    i18n={i18n}
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="grid-cell">
                <Field id="region" label={L.region} hint={L.optional}>
                  <input
                    id="region"
                    className="input"
                    autoComplete="shipping address-level1"
                    value={asStr(shipping.region)}
                    onChange={(e) => onChangeShipping("region", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>

              <div className="grid-cell">
                <Field id="deliveryNotes" label={L.deliveryNotes} hint={L.deliveryNotesHint}>
                  <input
                    id="deliveryNotes"
                    className="input"
                    value={asStr(shipping.deliveryNotes)}
                    onChange={(e) => onChangeShipping("deliveryNotes", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>
            </div>
          </fieldset>
        </section>
      ) : null}

      {anyPhysical ? (
        <section
          className="card card--soft checkout-click-safe"
          aria-label={L.billingOptions}
          onClick={stopCheckoutBubble}
          onPointerDown={stopCheckoutBubble}
        >
          <div className="checkbox-row" onClick={toggleSeparateBillingFromRow}>
            <input
              id="useSeparateBilling"
              type="checkbox"
              checked={!!useSeparateBilling}
              onChange={(e) => setUseSeparateBilling(e.target.checked)}
              onClick={stopCheckoutBubble}
              onPointerDown={stopCheckoutBubble}
            />
            <label htmlFor="useSeparateBilling" onClick={stopCheckoutBubble}>
              {L.billingUseSeparate}
            </label>
          </div>
        </section>
      ) : null}

      {anyPhysical && useSeparateBilling ? (
        <section className="card card--soft" aria-labelledby="billing-title">
          <div className="section-head">
            <h2 id="billing-title" className="card-title">
              {L.billing}
            </h2>
            <SectionLead>{L.billingLead}</SectionLead>
          </div>

          <fieldset className="fieldset">
            <legend className="sr-only">{L.billing}</legend>

            <div className="grid grid-2">
              <div className="grid-cell">
                <Field id="b_company" label={L.company} hint={L.optional}>
                  <input
                    id="b_company"
                    className="input"
                    autoComplete="organization"
                    value={asStr(billing.company)}
                    onChange={(e) => onChangeBilling("company", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>

              <div className="grid-cell">
                <Field id="b_careOf" label={L.careOf} hint={L.optional}>
                  <input
                    id="b_careOf"
                    className="input"
                    autoComplete="billing address-line3"
                    value={asStr(billing.careOf)}
                    onChange={(e) => onChangeBilling("careOf", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-1" data-error-key="billing.address1">
              <Field id="b_address1" label={L.address} required error={errors["billing.address1"]}>
                <input
                  id="b_address1"
                  className="input"
                  autoComplete="billing address-line1"
                  value={asStr(billing.address1)}
                  onChange={(e) => onChangeBilling("address1", e.target.value)}
                  onClick={stopCheckoutBubble}
                  onPointerDown={stopCheckoutBubble}
                />
              </Field>
            </div>

            <div className="grid grid-2">
              <div className="grid-cell">
                <Field id="b_address2" label={L.address2} hint={L.optional}>
                  <input
                    id="b_address2"
                    className="input"
                    autoComplete="billing address-line2"
                    value={asStr(billing.address2)}
                    onChange={(e) => onChangeBilling("address2", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>

              <div className="grid-cell">
                <Field id="b_orgNumber" label={L.orgNumber} hint={L.optional}>
                  <input
                    id="b_orgNumber"
                    className="input"
                    value={asStr(billing.orgNumber)}
                    onChange={(e) => onChangeBilling("orgNumber", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-3">
              <div className="grid-cell" data-error-key="billing.zip">
                <Field id="b_zip" label={L.postcode} required error={errors["billing.zip"]}>
                  <input
                    id="b_zip"
                    className="input"
                    autoComplete="billing postal-code"
                    inputMode="text"
                    value={asStr(billing.zip)}
                    onChange={(e) => onChangeBilling("zip", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>

              <div className="grid-cell" data-error-key="billing.city">
                <Field id="b_city" label={L.city} required error={errors["billing.city"]}>
                  <input
                    id="b_city"
                    className="input"
                    autoComplete="billing address-level2"
                    value={asStr(billing.city)}
                    onChange={(e) => onChangeBilling("city", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>

              <div className="grid-cell" data-error-key="billing.country">
                <Field id="b_country" label={L.country} required error={errors["billing.country"]}>
                  <CountrySelect
                    id="b_country"
                    value={billingCountry}
                    autoComplete="billing country"
                    onChange={(e) => onChangeBilling("country", e.target.value)}
                    t={t}
                    i18n={i18n}
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="grid-cell">
                <Field id="b_region" label={L.region} hint={L.optional}>
                  <input
                    id="b_region"
                    className="input"
                    autoComplete="billing address-level1"
                    value={asStr(billing.region)}
                    onChange={(e) => onChangeBilling("region", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>

              <div className="grid-cell">
                <Field id="b_vatId" label={L.vatId} hint={L.optional}>
                  <input
                    id="b_vatId"
                    className="input"
                    value={asStr(billing.vatId)}
                    onChange={(e) => onChangeBilling("vatId", e.target.value)}
                    onClick={stopCheckoutBubble}
                    onPointerDown={stopCheckoutBubble}
                  />
                </Field>
              </div>
            </div>
          </fieldset>
        </section>
      ) : null}

      <section
        className="card card--soft terms-card checkout-click-safe"
        data-error-key="agree"
        aria-labelledby="terms-title"
        onClick={stopCheckoutBubble}
        onPointerDown={stopCheckoutBubble}
      >
        <h2 id="terms-title" className="sr-only">
          {L.terms}
        </h2>

        <div className="checkbox-row checkbox-row--terms" onClick={toggleAgreeFromRow}>
          <input
            id="agree"
            type="checkbox"
            checked={!!agree}
            onChange={(e) => setAgree(e.target.checked)}
            onClick={stopCheckoutBubble}
            onPointerDown={stopCheckoutBubble}
            aria-describedby="terms-desc"
            aria-invalid={errors.agree ? "true" : undefined}
          />

          <label htmlFor="agree" onClick={stopCheckoutBubble}>
            {isPreorderFlow ? L.agreePreorder : L.agreeDefault}
          </label>
        </div>

        <p id="terms-desc" className="terms-inline" onClick={stopCheckoutBubble}>
          {L.read}{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={stopCheckoutBubble}>
            {isPreorderFlow ? L.preorderTerms : L.terms}
          </a>{" "}
          {L.and}{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={stopCheckoutBubble}>
            {L.privacy}
          </a>
          .
        </p>

        {errors.agree ? (
          <div id="agree-error" className="error" role="alert" aria-live="polite">
            {errors.agree}
          </div>
        ) : null}

        {errors.submit ? (
          <div className="error submit-error" role="alert" aria-live="polite">
            {errors.submit}
          </div>
        ) : null}
      </section>
    </div>
  );
}