// apps/store-classic/src/hooks/useReferral.js
import { useEffect, useState } from "react";

const KEY = "ca_ref";

export default function useReferral() {
  const [ref, setRefState] = useState(() => {
    try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
  });

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const urlRef = sp.get("ref");
    if (urlRef && urlRef !== ref) {
      setRefState(urlRef);
      try { localStorage.setItem(KEY, urlRef); } catch {}
    }
  }, []); // endast vid mount

  const setRef = (val) => {
    setRefState(val || "");
    try {
      if (val) localStorage.setItem(KEY, val);
      else localStorage.removeItem(KEY);
    } catch {}
  };

  const clearRef = () => setRef("");

  return { ref, setRef, clearRef };
}
