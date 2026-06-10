export const fmtMoney = (amount, lang, currency) =>
  new Intl.NumberFormat(lang, { style: "currency", currency }).format(amount);
