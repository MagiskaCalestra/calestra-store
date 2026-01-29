// apps/admin/src/core/ai/celesteFallback.js
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
    safeKids:
      "Jag kan inte ta emot namn, adresser, telefonnummer eller hemligheter. Skriv bara en snäll önskan eller känsla. ✨",
    safeAdult:
      "Jag kan inte ta emot personuppgifter (adress/telefon/e-post). Skriv om ärendet utan sådana detaljer. ✨",
    replies: {
      professional:
        "Okej. Säg vad du vill uppnå, så föreslår jag nästa 1–3 steg utan att störa andra tjänster.",
      fallback:
        "Jag är här. Säg vad du vill att jag ska göra i Admin just nu.",
    },
  },
  en: {
    safeKids:
      "I can’t accept names, addresses, phone numbers, or secrets. Please write only a kind wish/feeling. ✨",
    safeAdult:
      "I can’t accept personal data (address/phone/email). Describe the task without those details. ✨",
    replies: {
      professional:
        "OK. Tell me your goal, and I’ll propose the next 1–3 steps without breaking other services.",
      fallback:
        "I’m here. Tell me what you want me to do in Admin right now.",
    },
  },
  tr: {
    safeKids:
      "İsim, adres, telefon numarası veya sır alamam. Sadece nazik bir dilek/duygu yaz. ✨",
    safeAdult:
      "Kişisel veri (adres/telefon/e-posta) alamam. Görevi bu detaylar olmadan yaz. ✨",
    replies: {
      professional:
        "Tamam. Hedefini söyle, diğer servisleri bozmadan sonraki 1–3 adımı önereyim.",
      fallback:
        "Buradayım. Admin’de şu an ne yapmamı istiyorsun?",
    },
  },
};

export function fallbackRespond({
  message,
  locale,
  mode = "admin",
  mood = "professional",
} = {}) {
  const lang = baseLang(locale);
  const copy = COPY[lang] || COPY.sv;

  const pii = detectPII(message);
  if (pii.any) {
    return {
      reply: mode === "kids" ? copy.safeKids : copy.safeAdult,
      safety: { piiDetected: true },
      tone: "professional",
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
    tone: "professional",
    actions: [],
  };
}
