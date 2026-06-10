import RAW from "../data/products.json";

const prefix = (p) => p?.startsWith("/") ? p : `/images/${p}`;
const pick = (images={}) => images.hero || images.packshot || images.flatlay || images.lifestyle || images.zoom;

const normalize = (p)=>({
  ...p,
  price: Number(p.price)||0,
  images: Object.fromEntries(Object.entries(p.images||{}).map(([k,v])=>[k, prefix(v)])),
  cover: prefix(pick(p.images)||"/images/placeholder.png"),
  thumbnails: Object.values(p.images||{}).map(prefix).filter(Boolean)
});

const DB = RAW.map(normalize);

export function getAllProducts(){ return DB.slice(); }
export function getFeatured(){ return DB.filter(p=>p.featured); }
export function getProductBySlug(slug){ return DB.find(p=>p.slug===slug)||null; }

export function searchProducts({ q="", tags=[], sort="featured" }={}){
  const needle = q.trim().toLowerCase();
  let list = getAllProducts();

  if(needle) list = list.filter(p =>
    [p.name, p.category, p.description, (p.tags||[]).join(" ")].join(" ").toLowerCase().includes(needle)
  );
  if(tags.length) list = list.filter(p => p.tags?.some(t=>tags.includes(t)));

  if(sort==="price-asc") list.sort((a,b)=>a.price-b.price);
  else if(sort==="price-desc") list.sort((a,b)=>b.price-a.price);
  else if(sort==="name") list.sort((a,b)=>a.name.localeCompare(b.name));
  else list.sort((a,b)=>(b.featured===a.featured)?0:(b.featured?1:-1));

  return list;
}

export function formatPrice(value, currency){
  const locale = currency==="SEK"?"sv-SE":currency==="EUR"?"de-DE":"tr-TR";
  return new Intl.NumberFormat(locale,{style:"currency",currency}).format(value);
}
