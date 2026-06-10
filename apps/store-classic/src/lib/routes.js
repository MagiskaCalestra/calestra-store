// Håll alla path:ar här så bryts inte länkar när du flyttar filer.
export const ROUTES = {
  HOME: "/",
  SHOP: "/shop",
  CART: "/cart",

  // Static pages (pages/static/...)
  ABOUT: "/about",
  VISION: "/vision",
  PRESS: "/press",
  CORP: "/corp",           // Public Releases
  CAREERS: "/careers",
  CONTACT: "/contact",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  COOKIES: "/cookies",
  SHIPPING: "/shipping",
  RETURNS: "/returns",
  BILLING: "/billing",

  // Kvitto/thanks mm (om du har dessa)
  THANKS: "/thanks/:orderId?",
};
