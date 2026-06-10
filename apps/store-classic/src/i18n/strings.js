// apps/store-classic/src/i18n/strings.js
// Centrala strängar. Lägg gärna till fler nycklar när du internationaliserar fler komponenter.
// Struktur: STRINGS[languageCode].namespace.key

export const STRINGS = {
  sv: {
    nav: {
      primary: "Primär navigering",
      home: "Hem",
      shop: "Butik",
      cart: "Kundvagn",
      checkout: "Kassa",
      controls: "Snabbkontroller",
      portal: "Till Calestra World",
    },
    search: {
      aria: "Sök produkter",
      placeholder: "Sök produkter…",
      open: "Öppna sök (/)",
      clear: "Rensa sök",
      input: "Sökfält",
    },
    lang: { label: "Språk" },
    currency: { label: "Valuta" },
    theme: { toggle: "Byt tema" },

    // Vanliga knappar
    btn: {
      buy: "Köp",
      view: "Visa",
      chooseSize: "Välj storlek på produktsidan",
    },
  },

  en: {
    nav: {
      primary: "Primary navigation",
      home: "Home",
      shop: "Shop",
      cart: "Cart",
      checkout: "Checkout",
      controls: "Quick controls",
      portal: "Go to Calestra World",
    },
    search: {
      aria: "Search products",
      placeholder: "Search products…",
      open: "Open search (/)",
      clear: "Clear search",
      input: "Search input",
    },
    lang: { label: "Language" },
    currency: { label: "Currency" },
    theme: { toggle: "Toggle theme" },
    btn: {
      buy: "Buy",
      view: "View",
      chooseSize: "Choose size on product page",
    },
  },

  tr: {
    nav: {
      primary: "Birincil gezinme",
      home: "Ana sayfa",
      shop: "Mağaza",
      cart: "Sepet",
      checkout: "Ödeme",
      controls: "Hızlı ayarlar",
      portal: "Calestra World'a git",
    },
    search: {
      aria: "Ürün ara",
      placeholder: "Ürün ara…",
      open: "Aramayı aç (/)",
      clear: "Aramayı temizle",
      input: "Arama alanı",
    },
    lang: { label: "Dil" },
    currency: { label: "Para birimi" },
    theme: { toggle: "Tema değiştir" },
    btn: {
      buy: "Satın al",
      view: "Görüntüle",
      chooseSize: "Beden seçimi ürün sayfasında",
    },
  },
};
