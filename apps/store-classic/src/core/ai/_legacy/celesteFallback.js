// apps/store-classic/src/core/ai/celesteFallback.js
function baseLang(lang) {
  return (lang || "sv").slice(0, 2);
}

export function detectPII(text = "") {
  const s = String(text || "");
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(s);
  const phone = /(\+?\d[\d\s().-]{6,}\d)/.test(s);
  const addressHints =
    /\b(gatan|vägen|stigen|torg|gata|väg|street|road|avenue|ave|st|zip|postnummer)\b/i.test(
      s
    );
  return { email, phone, addressHints, any: email || phone || addressHints };
}

const COPY = {
  sv: {
    safeAdult:
      "Jag kan inte ta emot personuppgifter. Skriv om din fråga utan adress/telefon/e-post, så hjälper jag dig. ✨",
    replies: {
      shop:
        "Okej. Vill du ha hjälp att hitta produkt, storlek, frakt eller present?",
      fallback:
        "Jag är här. Säg vad du letar efter i butiken, så guidar jag dig.",
    },
  },
  en: {
    safeAdult:
      "I can’t accept personal data. Ask without address/phone/email and I’ll help you. ✨",
    replies: {
      shop:
        "OK. Do you want help finding a product, sizing, shipping, or a gift?",
      fallback:
        "I’m here. Tell me what you’re looking for and I’ll guide you.",
    },
  },
  tr: {
    safeAdult:
      "Kişisel veri alamam. Adres/telefon/e-posta olmadan sor, yardımcı olayım. ✨",
    replies: {
      shop:
        "Tamam. Ürün bulma, beden, kargo veya hediye konusunda yardım ister misin?",
      fallback:
        "Buradayım. Ne arıyorsun? Sana yol göstereyim.",
    },
  },
};

export function fallbackRespond({
  message,
  locale,
  mode = "guest",
  mood = "shop",
} = {}) {
  const lang = baseLang(locale);
  const copy = COPY[lang] || COPY.sv;

  const pii = detectPII(message);
  if (pii.any) {
    return {
      reply: copy.safeAdult,
      safety: { piiDetected: true },
      tone: "warm",
      actions: [],
    };
  }

  const reply =
    (copy.replies && copy.replies[mood]) ||
    (copy.replies && copy.replies.fallback) ||
    "OK.";

  return {
    reply,
    safety: { piiDetected: false },
    tone: "warm",
    actions: [],
  };
}
