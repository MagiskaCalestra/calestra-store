import React from "react";

/** Monochrome, compact brand pills for payment methods */
export default function PaymentBadges() {
  return (
    <ul className="paybar">
      <li className="paybadge" aria-label="Visa"><IconVisa /></li>
      <li className="paybadge" aria-label="Mastercard"><IconMastercard /></li>
      <li className="paybadge" aria-label="American Express"><IconAmex /></li>
      <li className="paybadge paytext" aria-label="Klarna"><span>Klarna</span></li>
      <li className="paybadge paytext" aria-label="Swish"><span>Swish</span></li>
      <li className="paybadge" aria-label="Apple Pay"><IconApplePay /></li>
      <li className="paybadge" aria-label="Google Pay"><IconGPay /></li>
    </ul>
  );
}

/* ---- Minimal, monochrome SVGs ---- */
function IconVisa(props){
  return (
    <svg viewBox="0 0 80 26" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 22L12.5 4h7.4L15 22H8Zm18.6 0L30.7 4h6.7L33 22h-6.4Zm27.7-8.4c3.6 1 5.1 2.4 5.1 4.7 0 4-3.6 6-8.6 6-3.2 0-6.3-.8-8.7-2.1l1.6-4c2 .9 4.5 1.7 7 1.7 1.5 0 2.6-.4 2.6-1.4 0-.7-.5-1.1-2.9-1.8-3.4-1-5.7-2.4-5.7-5.1 0-3.7 3.4-5.9 8-5.9 2.9 0 5.4.6 7.4 1.6l-1.6 3.9c-1.8-.8-3.8-1.3-5.6-1.3-1.4 0-2.3.5-2.3 1.3 0 .8.9 1.2 3.7 2.1ZM57.2 22 61.8 4h6.7L63.9 22h-6.7ZM40.5 4l-9.1 18h-6.8L33.7 4h6.8Z"/>
    </svg>
  );
}
function IconMastercard(props){
  return (
    <svg viewBox="0 0 80 26" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="33" cy="13" r="8.5" opacity="0.45"/>
      <circle cx="47" cy="13" r="8.5"/>
    </svg>
  );
}
function IconAmex(props){
  return (
    <svg viewBox="0 0 80 26" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="6" y="5" width="68" height="16" rx="3" ry="3" opacity=".12"/>
      <path d="M18 17l3-8h3l3 8h-3l-.6-1.7h-2.9L19.9 17H18Zm4.1-3.9.8 2.1h-1.7l.9-2.1ZM33 17v-8h3.9c1.9 0 3 1 3 2.4 0 1-.5 1.7-1.4 2v.1c1 .3 1.7 1.1 1.7 2.2 0 1.6-1.2 3.2-3.5 3.2H33Zm3-6.1v1.6h1.4c.6 0 .9-.3.9-.8s-.3-.8-.9-.8H36Zm0 3.4v1.8h1.7c.7 0 1.1-.4 1.1-.9s-.4-.9-1.1-.9H36ZM46 17v-8h6.7v1.9H48v1h3.9v1.8H48v1.1h4.7V17H46Z"/>
    </svg>
  );
}
function IconApplePay(props){
  return (
    <svg viewBox="0 0 80 26" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.4 12.2c0-2 1.7-3 1.8-3.1-1-.2-2.1.6-2.6.6-.5 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.2 2.1-.3 5.2.9 6.9.6.8 1.4 1.7 2.3 1.7.9 0 1.3-.6 2.3-.6 1 0 1.3.6 2.3.6.9 0 1.6-.8 2.2-1.7.7-1 1-2 1-2-.1 0-2-.8-2-3.6Zm-1.7-5.4c.5-.6.9-1.4.8-2.2-.8 0-1.7.5-2.2 1.1-.5.5-.9 1.3-.8 2.1.8.1 1.7-.4 2.2-1Z"/>
      <path d="M30 18.8V7.5h3.9c1.9 0 3 1 3 2.4 0 1-.5 1.7-1.4 2v.1c1 .3 1.7 1.1 1.7 2.2 0 1.6-1.2 3.2-3.5 3.2H30Zm3-6.1v1.6h1.4c.6 0 .9-.3.9-.8s-.3-.8-.9-.8H33Zm0 3.4v1.8h1.7c.7 0 1.1-.4 1.1-.9s-.4-.9-1.1-.9H36ZM44.5 18.8l-3.4-8.5h2.8l1.9 5.4h.1l1.9-5.4h2.7l-3.5 8.5h-2.5ZM56 18.8V7.5h2.7l5.1 7.1h.1V7.5h2.5v11.3h-2.6l-5.2-7.2h-.1v7.2H56Z"/>
    </svg>
  );
}
function IconGPay(props){
  return (
    <svg viewBox="0 0 80 26" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.5 13c0-3.9 3.2-7 7.2-7 1.8 0 3.4.7 4.7 1.7l-1.6 2a5.2 5.2 0 0 0-3.1-1c-2.5 0-4.5 2-4.5 4.4s2 4.4 4.5 4.4c2.3 0 3.7-1.3 4-3.1h-4v-2.3h6.7c.1.4.1.7.1 1.1 0 4.2-2.8 7.2-6.9 7.2-4 0-7.1-3.1-7.1-7.1Z"/>
      <path d="M33 18.8V7.5h3.9c1.9 0 3 1 3 2.4 0 1-.5 1.7-1.4 2v.1c1 .3 1.7 1.1 1.7 2.2 0 1.6-1.2 3.2-3.5 3.2H33Zm3-6.1v1.6h1.4c.6 0 .9-.3.9-.8s-.3-.8-.9-.8H36Zm0 3.4v1.8h1.7c.7 0 1.1-.4 1.1-.9s-.4-.9-1.1-.9H36Z"/>
    </svg>
  );
}

/* Scopes styles to avoid clashes with any global .badge */
export const paymentBadgesStyles = `
.paybar{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px}
.paybadge{display:inline-flex;align-items:center;justify-content:center;height:34px;min-width:54px;padding:0 12px;border-radius:999px;border:1px solid var(--c-border,#e7e9ef);background:#fff;color:var(--pay-fg,#111)}
.paybadge svg{display:block;width:56px;height:16px}
.paybadge.paytext{min-width:auto;padding:0 12px;font-weight:800;font-size:12px;letter-spacing:.02em}
@media (prefers-color-scheme: dark){
  .paybadge{background:#0f172a;border-color:#1d2638;color:#e8edf6}
}
`;
