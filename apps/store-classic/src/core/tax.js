// Moms/VAT per land (standard). Sverige 25%.
// Räkna med att priserna är inklusive moms (EU-standard för konsument).
export const VAT_BY_COUNTRY = {
  SE: 0.25,
  // Lägg till fler länder vid behov.
};

// Extrahera momsandelen ur ett pris som REDAN inkluderar moms.
// inklPris = exklPris * (1 + rate)  => moms = inklPris * rate / (1 + rate)
export function extractVatIncluded(amountCents, rate) {
  if (!rate || rate <= 0) return 0;
  return Math.round((amountCents * rate) / (1 + rate));
}

// Beräkna momsandel på en totalsumma (inkl moms) för givet land.
// Om du vill köra exkl moms, byt metod och lägg på istället.
export function computeVatFromGross(grossCents, countryCode = "SE") {
  const rate = VAT_BY_COUNTRY[countryCode] ?? 0;
  return extractVatIncluded(grossCents, rate);
}
