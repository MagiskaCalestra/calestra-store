// D:\WebProjects\Calestra\apps\store-classic\src\components\QtyInput.jsx
import React from "react";
import { useTranslation } from "react-i18next";

function clampQty(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export default function QtyInput({
  value = 1,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  compact = false,
}) {
  const { t } = useTranslation();

  const safeMin = Number.isFinite(Number(min)) ? Number(min) : 1;
  const safeMax = Number.isFinite(Number(max)) ? Number(max) : 99;

  const [draft, setDraft] = React.useState(() =>
    String(clampQty(value, safeMin, safeMax))
  );

  React.useEffect(() => {
    setDraft(String(clampQty(value, safeMin, safeMax)));
  }, [value, safeMin, safeMax]);

  function commit(nextValue) {
    const next = clampQty(nextValue, safeMin, safeMax);
    setDraft(String(next));
    if (typeof onChange === "function") onChange(next);
  }

  const qty = clampQty(draft || safeMin, safeMin, safeMax);

  const canDec = !disabled && qty > safeMin;
  const canInc = !disabled && qty < safeMax;

  return (
    <div
      className={`qty-input ${compact ? "qty-input--compact" : ""}`}
      data-disabled={disabled ? "1" : "0"}
      role="group"
      aria-label={t("product.qty")}
    >
      <button
        type="button"
        className="qty-input__btn"
        onClick={() => commit(qty - 1)}
        disabled={!canDec}
        aria-label={t("cart.decrease")}
      >
        −
      </button>

      <input
        className="qty-input__field"
        inputMode="numeric"
        min={safeMin}
        max={safeMax}
        value={draft}
        disabled={disabled}
        aria-label={t("product.qty")}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          setDraft(raw);
        }}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "ArrowUp") {
            e.preventDefault();
            commit(qty + 1);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            commit(qty - 1);
          }
        }}
      />

      <button
        type="button"
        className="qty-input__btn"
        onClick={() => commit(qty + 1)}
        disabled={!canInc}
        aria-label={t("cart.increase")}
      >
        +
      </button>

      <style>{`
        .qty-input{
          display:inline-flex;
          align-items:center;
          height:42px;
          border-radius:999px;
          border:1px solid rgba(15,23,42,.10);
          background:rgba(255,255,255,.84);
          overflow:hidden;
          box-shadow:0 10px 24px rgba(15,23,42,.05);
        }

        .qty-input--compact{
          height:36px;
        }

        .qty-input__btn{
          width:42px;
          height:42px;
          border:0;
          background:transparent;
          color:#0f172a;
          font-size:18px;
          font-weight:1000;
          cursor:pointer;
          display:grid;
          place-items:center;
          transition:background .12s ease, opacity .12s ease;
        }

        .qty-input--compact .qty-input__btn{
          width:36px;
          height:36px;
        }

        .qty-input__btn:hover:not(:disabled){
          background:rgba(15,23,42,.06);
        }

        .qty-input__btn:disabled{
          opacity:.35;
          cursor:not-allowed;
        }

        .qty-input__field{
          width:42px;
          height:42px;
          border:0;
          border-left:1px solid rgba(15,23,42,.08);
          border-right:1px solid rgba(15,23,42,.08);
          background:rgba(248,250,252,.82);
          color:#0f172a;
          text-align:center;
          font-weight:1000;
          font-size:14px;
          outline:none;
        }

        .qty-input--compact .qty-input__field{
          width:38px;
          height:36px;
        }

        .qty-input__field:focus{
          box-shadow:inset 0 0 0 2px rgba(75,107,250,.30);
        }

        .qty-input[data-disabled="1"]{
          opacity:.65;
        }

        .theme-dark .qty-input{
          background:rgba(11,18,32,.70);
          border-color:rgba(255,255,255,.10);
          box-shadow:none;
        }

        .theme-dark .qty-input__btn{
          color:#f8fafc;
        }

        .theme-dark .qty-input__btn:hover:not(:disabled){
          background:rgba(255,255,255,.08);
        }

        .theme-dark .qty-input__field{
          background:rgba(2,6,23,.72);
          color:#f8fafc;
          border-color:rgba(255,255,255,.10);
        }
      `}</style>
    </div>
  );
}