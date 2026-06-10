// D:\WebProjects\Calestra\apps\store-classic\src\pages\MediaGallery.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ImageCategoryGrid from "../components/ImageCategoryGrid";
import { IMG, CATEGORIES } from "../assets/images.manifest";
import { TT } from "../i18n/tt.js";

function titleCase(value) {
  const s = String(value || "");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function getCategoryFallback(cat) {
  const fallback = {
    hero: { sv: "Hero", en: "Hero", tr: "Hero" },
    support: { sv: "Support", en: "Support", tr: "Support" },
    portals: { sv: "Portaler", en: "Portals", tr: "Portallar" },
    products: { sv: "Produkter", en: "Products", tr: "Ürünler" },
    banners: { sv: "Banners", en: "Banners", tr: "Bannerlar" },
    misc: { sv: "Övrigt", en: "Misc", tr: "Diğer" },
  };

  return fallback[cat] || {
    sv: titleCase(cat),
    en: titleCase(cat),
    tr: titleCase(cat),
  };
}

export default function MediaGallery() {
  const { t, i18n } = useTranslation();
  const { cat } = useParams();

  const active = cat && IMG[cat] ? cat : "hero";
  const list = IMG[active] || [];

  const categoryLabel = TT(i18n, t, `gallery.category.${active}`, getCategoryFallback(active));

  const galleryNote = TT(i18n, t, "gallery.note", {
    sv: `Källa: /public/${active} • ${list.length} bilder`,
    en: `Source: /public/${active} • ${list.length} images`,
    tr: `Kaynak: /public/${active} • ${list.length} görsel`,
  });

  return (
    <main style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
        <h1 style={{ margin: "0 12px 0 0" }}>
          {TT(i18n, t, "gallery.title", {
            sv: "Galleri",
            en: "Gallery",
            tr: "Galeri",
          })}
        </h1>

        <nav
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          aria-label={TT(i18n, t, "gallery.categories", {
            sv: "Kategorier",
            en: "Categories",
            tr: "Kategoriler",
          })}
        >
          {CATEGORIES.map((c) => {
            const isActive = active === c;

            return (
              <Link key={c} to={`/gallery/${c}`} className={`chip ${isActive ? "active" : ""}`}>
                {TT(i18n, t, `gallery.category.${c}`, getCategoryFallback(c))}
              </Link>
            );
          })}
        </nav>
      </header>

      <ImageCategoryGrid images={list} title={categoryLabel} note={galleryNote} />

      <style>{`
        .chip{
          padding:6px 12px;border-radius:18px;text-decoration:none;
          border:1px solid var(--chip-border,#d7deea);
          background:var(--chip-bg,#f3f6fb);
          color:var(--chip-fg,#0b1220);
        }
        .chip:hover{filter:brightness(.98)}
        .chip.active{ background:#0f172a;color:#fff;border-color:#0f172a; }
        .theme-dark .chip{
          --chip-bg:rgba(231,237,249,.12);
          --chip-border:#2b3546;
          --chip-fg:#e6e7ea;
        }
        .theme-dark .chip.active{ background:#4B6BFA;border-color:#4B6BFA;color:#fff; }
      `}</style>
    </main>
  );
}