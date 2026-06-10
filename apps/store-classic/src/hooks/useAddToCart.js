import { useState } from "react";
import { useCart } from "../context/CartContext.jsx";

export default function useAddToCart(product) {
  const { add } = useCart();
  const [pulse, setPulse] = useState(false);

  const addNow = (overrides = {}) => {
    add({ ...product, ...overrides });
    // Ping för ljud
    window.dispatchEvent(new CustomEvent("cart:add"));
    // Liten puls-effekt på knapp
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
  };

  return { addNow, pulse };
}
