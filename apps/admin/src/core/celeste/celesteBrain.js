// apps/admin/src/core/celeste/celesteBrain.js
function norm(s) {
  return String(s || "").toLowerCase().trim();
}

function detectLang(text) {
  const t = norm(text);
  if (/[çğıöşü]/i.test(text) || t.includes("merhaba") || t.includes("lütfen")) return "tr";
  if (t.includes("hello") || t.includes("please") || t.includes("help")) return "en";
  return "sv";
}

function speak(text, lang) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  try {
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = lang === "tr" ? "tr-TR" : lang === "en" ? "en-US" : "sv-SE";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

function formatServiceLine(name, r) {
  if (!r) return `• ${name}: okänd`;
  if (!r.ok) return `• ${name}: OFF (${r.status || 0})`;
  return `• ${name}: OK (${r.status})`;
}

export async function celesteRespond({ text, tools, voiceEnabled }) {
  const q = String(text || "").trim();
  const t = norm(q);
  const lang = detectLang(q);

  if (!t) {
    const msg =
      lang === "tr"
        ? "Yönetim merkezindeyiz. Ne yapmak istersin?"
        : lang === "en"
          ? "We’re in the Control Center. What do you want to do?"
          : "Vi är i Control Center. Vad vill du göra?";
    if (voiceEnabled) speak(msg, lang);
    return { answer: msg };
  }

  // snabb navigation i admin
  if (t.includes("gå till") || t.includes("öppna") || t.includes("navigate") || t.includes("git")) {
    const nav =
      t.includes("dashboard") || t.includes("översikt") ? "/" :
      t.includes("users") || t.includes("användare") ? "/users" :
      t.includes("finance") || t.includes("ekonomi") ? "/finance" :
      t.includes("hr") ? "/hr" :
      t.includes("system") || t.includes("drift") ? "/system" :
      null;

    if (nav) {
      tools.navigate(nav);
      const msg =
        lang === "tr" ? "Tamam. Açıyorum." :
        lang === "en" ? "Okay. Opening." :
        "Okej. Öppnar.";
      if (voiceEnabled) speak(msg, lang);
      return { answer: msg };
    }
  }

  // driftstatus (admin)
  if (
    t.includes("status") ||
    t.includes("drift") ||
    t.includes("services") ||
    t.includes("servrar") ||
    t.includes("health") ||
    t.includes("api")
  ) {
    const summary = await tools.getServiceSummary();
    const lines = [
      formatServiceLine("finance-service", summary.finance),
      formatServiceLine("status", summary.status),
      formatServiceLine("progress-service", summary.progress),
      formatServiceLine("nexus", summary.nexus),
      formatServiceLine("identity", summary.identity),
    ];
    const head =
      lang === "tr"
        ? "Sistem durumu:"
        : lang === "en"
          ? "System status:"
          : "Systemstatus:";
    const msg = `${head}\n${lines.join("\n")}`;
    if (voiceEnabled) speak(head, lang);
    return { answer: msg };
  }

  // admin-assistent fallback
  const fallback =
    lang === "tr"
      ? "Şunları yapabilirim: “status”, “finance’e git”, “system’e git”, “users’a git”. Ne istersin?"
      : lang === "en"
        ? "I can do: “status”, “go to finance”, “go to system”, “go to users”. What do you want?"
        : "Jag kan: “status”, “gå till finance”, “gå till system”, “gå till users”. Vad vill du göra?";

  if (voiceEnabled) speak(fallback, lang);
  return { answer: fallback };
}
