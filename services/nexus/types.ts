export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;      // pris inkl. moms om du kör VITE_PRICES_INCLUDE_VAT=true
  image?: string;
  // ...lägg till fält när du behöver dem
};

export type ApiList<T> = T[];
