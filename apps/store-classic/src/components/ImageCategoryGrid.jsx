// D:\WebProjects\Calestra\apps\store-classic\src\components\ImageCategoryGrid.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { TT } from "../i18n/tt.js";

export default function ImageCategoryGrid({ images = [], title = "", note = "" }) {
  const { t, i18n } = useTranslation();

  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];

  function fallbackAlt(index) {
    return TT(i18n, t, "image.altFallback", {
      sv: `Bild #${index}`,
      en: `Image #${index}`,
      tr: `Görsel #${index}`,
    });
  }

  const emptyText = TT(i18n, t, "image.empty", {
    sv: "Inga bilder att visa ännu.",
    en: "No images to show yet.",
    tr: "Henüz gösterilecek görsel yok.",
  });

  return (
    <section aria-label={title || emptyText} style={{ marginTop: 24 }}>
      {title ? <h2 style={{ margin: "0 0 8px 0" }}>{title}</h2> : null}

      {note ? <p style={{ marginTop: 0, opacity: 0.8 }}>{note}</p> : null}

      {!safeImages.length ? (
        <p style={{ margin: "12px 0 0", opacity: 0.72 }}>{emptyText}</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
            gap: 12,
          }}
        >
          {safeImages.map((src, i) => {
            const index = i + 1;
            const altText = title ? `${title} #${index}` : fallbackAlt(index);

            return (
              <figure key={`${src}-${i}`} style={{ margin: 0 }}>
                <img
                  src={src}
                  alt={altText}
                  style={{
                    width: "100%",
                    height: 220,
                    objectFit: "cover",
                    borderRadius: 12,
                    background: "#0a0f1a",
                  }}
                  loading="lazy"
                />

                <figcaption
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                    marginTop: 6,
                    wordBreak: "break-all",
                  }}
                >
                  {src}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}