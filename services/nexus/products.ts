import { fetchJson } from "./http";
import type { ApiList, Product } from "./types";

const API = import.meta.env.VITE_API_BASE ?? "http://localhost:14000/api";

export function listProducts() {
  return fetchJson<ApiList<Product>>(`${API}/products`);
}
