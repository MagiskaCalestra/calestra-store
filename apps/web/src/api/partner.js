// apps/web/src/api/partner.js
export async function loadPartnerConfig() {
  const env = {
    title: import.meta.env.VITE_PARTNER_TITLE,
    text: import.meta.env.VITE_PARTNER_TEXT,
    href: import.meta.env.VITE_PARTNER_HREF,
    label: import.meta.env.VITE_PARTNER_LABEL,
    badge: import.meta.env.VITE_PARTNER_BADGE
  };

  // ENV vinner om titel + href finns
  if (env.title && env.href) {
    return {
      title: env.title,
      text: env.text || "",
      href: env.href,
      label: env.label || "Learn more",
      badge: env.badge || "Partner"
    };
  }

  // annars läs JSON
  try {
    const res = await fetch("/config/partner.json", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return {
      title: json.title || "Partner",
      text: json.text || "",
      href: json.href || "#",
      label: json.label || "Learn more",
      badge: json.badge || "Partner"
    };
  } catch {
    // trygg fallback
    return {
      title: "Partner",
      text: "",
      href: "#",
      label: "Learn more",
      badge: "Partner"
    };
  }
}
