// apps/store-classic/src/core/ai/aiClient.js
import { fallbackRespond } from "./celesteFallback.js";

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { message: txt };
  }
}

function baseLang(locale) {
  return (locale || "sv").slice(0, 2);
}

export async function sendToAI({
  message,
  locale = "sv",
  mode = "guest",
  channel = "store",
  user = null,
  context = null,
  mood = "shop",
  token = null,
} = {}) {
  const payload = {
    channel,
    locale: baseLang(locale),
    mode,
    user,
    context,
    message: String(message || ""),
  };

  try {
    const res = await fetch("/api/ai/respond", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await safeJson(res);
      return fallbackRespond({ message, locale, mode, mood, error: err });
    }

    const data = await safeJson(res);
    if (data && typeof data.reply === "string") return data;

    return fallbackRespond({ message, locale, mode, mood });
  } catch {
    return fallbackRespond({ message, locale, mode, mood });
  }
}
