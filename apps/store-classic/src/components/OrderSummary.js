// src/components/OrderSummary.jsx
import React from "react";
import { formatMoney } from "../utils/money";

export default function OrderSummary({
  items, currency, locale,
  subtotal, shipping, vat, total
}) {
  return (
    <div className="card">
      <h3>Order</h3>
      <ul className="divide">
        {items.map((it) => (
          <li key={it.id} className="row">
            <div className="grow">
              <div className="line-1">{it.title}</div>
              <div className="muted">
                {it.size ? `Storlek: ${it.size}` : null}
                {it.color ? ` â€¢ Färg: ${it.color}` : null}
              </div>
            </div>
            <div>x{it.qty}</div>
            <div>{formatMoney(it.priceEach, currency, locale)}</div>
          </li>
        ))}
      </ul>

      <div className="totals">
        <div className="row">
          <span>Delsumma</span>
          <span>{formatMoney(subtotal, currency, locale)}</span>
        </div>
        <div className="row">
          <span>Frakt</span>
          <span>{shipping === 0 ? "0" : formatMoney(shipping, currency, locale)}</span>
        </div>
        <div className="row">
          <span>Moms</span>
          <span>{formatMoney(vat, currency, locale)}</span>
        </div>
        <div className="row total">
          <span>Att betala</span>
          <span>{formatMoney(total, currency, locale)}</span>
        </div>
      </div>
    </div>
  );
}
