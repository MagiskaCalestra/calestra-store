import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext.jsx";

export default function CartButton() {
  const { t } = useTranslation();
  const { items } = useCart(); // viktigt att hämta direkt ur context

  const count = (items || []).reduce((s, it) => s + Math.max(1, Number(it.qty || 1)), 0);

  return (
    <Link to="/cart" className="cartbtn" aria-label={t("nav.cart","Kundvagn")}>
      ðŸ›’
      {count > 0 && <span className="cartbtn__badge" aria-hidden="true">{count}</span>}

      <style>{`
        .cartbtn{position:relative;display:inline-flex;align-items:center;justify-content:center;
                 width:40px;height:34px;border:1px solid rgba(255,255,255,.12);border-radius:10px;text-decoration:none}
        .cartbtn__badge{
          position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;
          background:#ff3b30;color:#fff;font-size:12px;line-height:18px;text-align:center;font-weight:800;
          box-shadow:0 1px 0 rgba(0,0,0,.25)
        }
        @media (prefers-color-scheme: light){
          .cartbtn{border-color:#e6eaf0}
        }
      `}</style>
    </Link>
  );
}
