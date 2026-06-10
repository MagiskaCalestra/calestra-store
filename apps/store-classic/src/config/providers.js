// Enda stället du ändrar när något startas / pausas.
// Börja smått: håll bara de du verkligen har aktiva som enabled: true.
// När du vill uppgradera till officiella loggor, lägg SVG/PNG i /public/brands och sätt logoSrc.

export const PAYMENTS = [
  { key: "visa",       label: "VISA",            href: "https://www.visa.se/betala-med-visa.html",        enabled: true,  logoSrc: "" },
  { key: "mastercard", label: "Mastercard",      href: "https://www.mastercard.se/sv-se/konsument.html",  enabled: true,  logoSrc: "" },
  { key: "amex",       label: "AMEX",            href: "https://www.americanexpress.com/",               enabled: false, logoSrc: "" },
  { key: "klarna",     label: "Klarna",          href: "https://www.klarna.com/se/",                      enabled: true,  logoSrc: "" },
  { key: "swish",      label: "Swish",           href: "https://www.getswish.se/",                        enabled: true,  logoSrc: "" },
  { key: "paypal",     label: "PayPal",          href: "https://www.paypal.com/se/home",                  enabled: false, logoSrc: "" }
];

export const SHIPPING = [
  { key: "instabox", label: "Instabox", href: "https://instabox.io/",             enabled: true,  logoSrc: "" },
  { key: "postnord", label: "PostNord", href: "https://www.postnord.se/",        enabled: true,  logoSrc: "" },
  { key: "dhl",      label: "DHL",      href: "https://www.dhl.com/se-sv/home",  enabled: false, logoSrc: "" },
  { key: "ups",      label: "UPS",      href: "https://www.ups.com/se/sv/home",  enabled: false, logoSrc: "" }
];
