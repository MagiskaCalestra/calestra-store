// D:\WebProjects\Calestra\apps\store-classic\src\components\VariantSelector.jsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

function uniqueClean(values) {
  return [...new Set(values.map(v => String(v || "").trim()).filter(Boolean))];
}

function variantMatches(variant, nextValue) {
  const sizeOk = !nextValue.size || !variant.size || String(variant.size) === String(nextValue.size);
  const colorOk = !nextValue.color || !variant.color || String(variant.color) === String(nextValue.color);
  return sizeOk && colorOk;
}

export default function VariantSelector({
  variants = [],
  value = {},
  onChange,
  disabled = false,
}) {
  const { t } = useTranslation();

  const safeVariants = Array.isArray(variants) ? variants.filter(Boolean) : [];

  const sizes = uniqueClean(safeVariants.map(v => v.size));
  const colors = uniqueClean(safeVariants.map(v => v.color));

  const selected = {
    size: value?.size || "",
    color: value?.color || "",
  };

  // 🔥 AUTO SELECT (UX BOOST)
  useEffect(() => {
    if (!selected.size && sizes.length === 1) {
      onChange?.({ ...selected, size: sizes[0] });
    }
    if (!selected.color && colors.length === 1) {
      onChange?.({ ...selected, color: colors[0] });
    }
  }, [sizes, colors]);

  function isOptionAvailable(key, option) {
    if (!safeVariants.length) return true;
    const next = { ...selected, [key]: option };
    return safeVariants.some(v => variantMatches(v, next));
  }

  function setVariant(key, option) {
    if (disabled) return;

    const next = { ...selected, [key]: option };

    // 🔥 FIX: rensa inkompatibla val
    if (key === "size" && selected.color) {
      const stillValid = safeVariants.some(v =>
        v.size === option && v.color === selected.color
      );
      if (!stillValid) next.color = "";
    }

    if (key === "color" && selected.size) {
      const stillValid = safeVariants.some(v =>
        v.color === option && v.size === selected.size
      );
      if (!stillValid) next.size = "";
    }

    onChange?.(next);
  }

  if (!sizes.length && !colors.length) return null;

  return (
    <div className="variant-selector">

      {sizes.length > 0 && (
        <div className="variant-row">
          <div className="variant-label">{t("product.size")}</div>

          <div className="variant-chips">
            {sizes.map(size => {
              const active = selected.size === size;
              const available = isOptionAvailable("size", size);

              return (
                <button
                  key={size}
                  className={`variant-chip ${active ? "is-active" : ""}`}
                  disabled={disabled || !available}
                  onClick={() => setVariant("size", size)}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="variant-row">
          <div className="variant-label">{t("product.color")}</div>

          <div className="variant-chips">
            {colors.map(color => {
              const active = selected.color === color;
              const available = isOptionAvailable("color", color);

              return (
                <button
                  key={color}
                  className={`variant-chip ${active ? "is-active" : ""}`}
                  disabled={disabled || !available}
                  onClick={() => setVariant("color", color)}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .variant-selector{
          display:grid;
          gap:14px;
          margin:14px 0;
        }

        .variant-row{
          display:grid;
          gap:8px;
        }

        .variant-label{
          font-size:12px;
          font-weight:1000;
          text-transform:uppercase;
          letter-spacing:.08em;
        }

        .variant-chips{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }

        .variant-chip{
          min-height:38px;
          padding:0 13px;
          border-radius:999px;
          border:1px solid rgba(15,23,42,.12);
          background:#fff;
          font-weight:900;
          cursor:pointer;
        }

        .variant-chip.is-active{
          background:#0f172a;
          color:#fff;
        }

        .variant-chip:disabled{
          opacity:.35;
          text-decoration:line-through;
        }
      `}</style>
    </div>
  );
}