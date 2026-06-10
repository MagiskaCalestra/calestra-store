// D:\WebProjects\Calestra\apps\store-classic\src\components\CelesteOverlay.jsx
import React from "react";
import { askCeleste } from "../core/celeste/celesteClient.js";
import { useLang } from "../context/LangContext.jsx";
import { useLocation } from "react-router-dom";

const CELESTE_RENDER_MODE = "svg"; // "svg" nu, "3d" senare

function nowId() {
  return `m_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function normalizeLang(l) {
  const b = String(l || "sv").slice(0, 2).toLowerCase();
  return b === "sv" || b === "en" || b === "tr" ? b : "sv";
}

function getLangTag(lang) {
  const L = normalizeLang(lang);
  return L === "tr" ? "tr-TR" : L === "en" ? "en-US" : "sv-SE";
}

function speechClean(input) {
  let s = String(input || "");
  s = s.replace(/[✦★☆•·●▪︎▶︎►]/g, " ");
  s = s.replace(/\*\*/g, "");
  s = s.replace(/\*/g, "");
  s = s.replace(/`{1,3}/g, "");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  s = s.replace(/^\s*[-–•]\s+/gm, "");
  s = s.replace(/^\s*\d+\)\s+/gm, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

function voiceName(v) {
  return String(v?.name || "").toLowerCase();
}

function voiceLang(v) {
  return String(v?.lang || "").toLowerCase();
}

function langMatches(voiceLangLower, L) {
  if (!voiceLangLower) return false;
  if (L === "sv") return voiceLangLower.startsWith("sv");
  if (L === "en") return voiceLangLower.startsWith("en");
  return voiceLangLower.startsWith("tr");
}

function femalePriorityHints(L) {
  if (L === "sv") {
    return [
      "astrid",
      "sofia",
      "emma",
      "sara",
      "elin",
      "alva",
      "maria",
      "ida",
    ];
  }

  if (L === "en") {
    return [
      "zira",
      "hazel",
      "susan",
      "samantha",
      "aria",
      "jenny",
      "emma",
      "olivia",
      "amy",
    ];
  }

  return ["filiz", "leyla", "elif", "asya"];
}

function femaleFallbackHints() {
  return [
    "zira",
    "hazel",
    "susan",
    "samantha",
    "aria",
    "jenny",
    "emma",
    "olivia",
    "amy",
  ];
}

function femaleSoftHints(L) {
  if (L === "sv") return ["female", "woman", "kvinna", "flicka"];
  if (L === "en") return ["female", "woman"];
  return ["female", "woman", "kadın", "kadin"];
}

function maleAvoidHints() {
  return [
    "male",
    "man",
    "bengt",
    "david",
    "george",
    "mark",
    "alex",
    "daniel",
    "fredrik",
    "erik",
    "anders",
    "oskar",
    "joakim",
    "tolga",
  ];
}

function isAvoidedVoice(v) {
  const n = voiceName(v);
  return maleAvoidHints().some((h) => n.includes(h));
}

function findEnglishFemaleFallback(voices = []) {
  const fallback = femaleFallbackHints();
  const englishVoices = voices.filter((v) => voiceLang(v).startsWith("en"));

  const direct = englishVoices.find(
    (v) =>
      !isAvoidedVoice(v) &&
      fallback.some((h) => voiceName(v).includes(h)),
  );

  if (direct) return direct;

  const anySoft = englishVoices.find((v) => !isAvoidedVoice(v));
  if (anySoft) return anySoft;

  return null;
}

function pickFemaleVoiceStrict(lang) {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const L = normalizeLang(lang);
  if (!voices.length) return null;

  const pri = femalePriorityHints(L);
  const soft = femaleSoftHints(L);

  const sameLang = voices.filter(
    (v) => langMatches(voiceLang(v), L) && !isAvoidedVoice(v),
  );

  const v1 = sameLang.find((v) => pri.some((h) => voiceName(v).includes(h)));
  if (v1) return v1;

  const v2 = sameLang.find((v) => soft.some((h) => voiceName(v).includes(h)));
  if (v2) return v2;

  /*
    På Windows finns ofta bara "Microsoft Bengt - Swedish".
    Bengt är manlig. Celeste ska hellre använda Zira/Hazel/Susan
    än att prata svenska med manlig röst.
  */
  const englishFallback = findEnglishFemaleFallback(voices);
  if (englishFallback) return englishFallback;

  const v3 = sameLang.find((v) => !isAvoidedVoice(v));
  if (v3) return v3;

  return null;
}

async function ensureVoicesReady(timeoutMs = 1200) {
  if (!("speechSynthesis" in window)) return;
  const existing = window.speechSynthesis.getVoices?.() || [];
  if (existing.length > 0) return;

  await new Promise((resolve) => {
    let done = false;

    const t = setTimeout(() => {
      if (done) return;
      done = true;
      resolve();
    }, timeoutMs);

    window.speechSynthesis.onvoiceschanged = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      resolve();
    };
  });
}

const lastVoiceByLang = { sv: "", en: "", tr: "" };

function chooseStableVoiceStrict(lang) {
  const L = normalizeLang(lang);
  const voices = window.speechSynthesis?.getVoices?.() || [];
  if (!voices.length) return null;

  const lastName = String(lastVoiceByLang[L] || "").toLowerCase();

  if (lastName) {
    const found = voices.find(
      (v) => voiceName(v) === lastName && !isAvoidedVoice(v),
    );
    if (found) return found;
  }

  const picked = pickFemaleVoiceStrict(L);

  if (picked?.name) {
    lastVoiceByLang[L] = String(picked.name);
  }

  return picked || null;
}

async function speak(text, lang, { mode = "exec" } = {}) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  const raw = String(text || "").trim();
  const msg = speechClean(raw);
  if (!msg) return;

  if (/celeste skriver/i.test(msg) || msg === "…" || msg === "...") return;

  try {
    await ensureVoicesReady(1200);

    const L = normalizeLang(lang);
    const voice = chooseStableVoiceStrict(L);

    /*
      Om Celeste inte hittar en mjuk/kvinnlig röst ska hon hellre vara tyst
      än att låta som fel person, t.ex. Microsoft Bengt.
    */
    if (!voice) return;

    const u = new window.SpeechSynthesisUtterance(msg);
    u.voice = voice;
    u.lang = voice?.lang || getLangTag(L);

    if (mode === "whisper") {
      u.rate = 0.95;
      u.pitch = 1.18;
      u.volume = 0.75;
    } else {
      u.rate = 1.02;
      u.pitch = 1.12;
      u.volume = 1;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

function runActions(actions) {
  const list = Array.isArray(actions) ? actions : [];

  for (const a of list) {
    if (!a || typeof a !== "object") continue;

    if (a.type === "nav" && a.href && a.auto) {
      try {
        window.location.assign(String(a.href));
      } catch {
        window.location.href = String(a.href);
      }

      return true;
    }
  }

  return false;
}

function openAction(a) {
  if (!a || typeof a !== "object") return;

  if (a.type === "open_product" && a.href) {
    window.location.href = String(a.href);
    return;
  }

  if (a.type === "nav" && a.href) {
    window.location.href = String(a.href);
    return;
  }

  if (a.type === "open" && a.url) {
    window.location.href = String(a.url);
  }
}

function priceText(p) {
  const price = Number(p?.price ?? 0);
  const cur = String(p?.currency || "SEK");
  return price ? `${price} ${cur}` : "";
}

function badgeText({ limited, support, stock }, L) {
  const out = [];

  if (limited) {
    out.push(L === "en" ? "Limited" : L === "tr" ? "Sınırlı" : "Limited");
  }

  if (support) {
    out.push(L === "en" ? "Support" : L === "tr" ? "Destek" : "Support");
  }

  if (typeof stock === "number" && stock > 0 && stock <= 5) {
    out.push(L === "en" ? "Few left" : L === "tr" ? "Az kaldı" : "Få kvar");
  }

  return out;
}

function extractProductSlugFromPath(pathname) {
  const p = String(pathname || "");
  if (!p.startsWith("/product/")) return "";
  const slug = p.split("/product/")[1] || "";
  return decodeURIComponent(slug).split(/[?#]/)[0].trim();
}

function getWarmHello(L) {
  if (L === "tr") {
    return "Merhaba! Ben Celeste. İstersen doğru ürünü bulmana yardım edeyim.";
  }

  if (L === "en") {
    return "Hi — I’m Celeste. Want help finding the right piece?";
  }

  return "Hej — jag heter Celeste. Vill du ha hjälp att hitta rätt?";
}

function getWarmPromise(L) {
  if (L === "tr") return "Acele yok. Köşede sessizce buradayım.";
  if (L === "en") return "No rush. I’ll stay quietly in the corner.";
  return "Ingen stress. Jag finns lugnt i hörnet.";
}

function safeLsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

function safeLsSet(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch {}
}

/* JS-driven animation: bypassar CSS/reduced-motion helt */
function CelesteStarAvatar({ size = 86, mood = "calm" }) {
  const s = Number(size) || 86;
  const [frame, setFrame] = React.useState(0);

  React.useEffect(() => {
    let raf = 0;
    let alive = true;

    function loop() {
      if (!alive) return;
      setFrame(Date.now());
      raf = window.requestAnimationFrame(loop);
    }

    raf = window.requestAnimationFrame(loop);

    return () => {
      alive = false;
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const t = frame ? frame / 1000 : Date.now() / 1000;
  const active = mood === "active";
  const happy = mood === "happy";
  const thinking = mood === "thinking";

  const floatY = active
    ? Math.sin(t * 3.2) * -5
    : happy
      ? Math.sin(t * 3.6) * -7
      : thinking
        ? Math.sin(t * 2.4) * -4
        : Math.sin(t * 2.1) * -5;

  const scale = active
    ? 1.05 + Math.sin(t * 4.2) * 0.035
    : happy
      ? 1.06 + Math.sin(t * 3.8) * 0.04
      : thinking
        ? 1.025 + Math.sin(t * 2.8) * 0.025
        : 1.02 + Math.sin(t * 2.1) * 0.025;

  const bodyRotate = active
    ? Math.sin(t * 2.7) * 3
    : happy
      ? Math.sin(t * 2.4) * 4
      : thinking
        ? Math.sin(t * 1.7) * 2
        : Math.sin(t * 1.6) * 2;

  const spinAngle = active
    ? (t * 115) % 360
    : happy
      ? (t * 75) % 360
      : thinking
        ? (t * 48) % 360
        : (t * 34) % 360;

  const blinkPhase = Math.sin(t * 3.2);
  const blink = blinkPhase > 0.985 ? 0.16 : 1;

  const eyeRy = happy ? 5.1 : 5.8;
  const eyeRx = happy ? 5.4 : 5.1;
  const stableEyeRy = Math.max(0.75, eyeRy * blink);

  const glow = active
    ? "drop-shadow(0 16px 34px rgba(246,197,74,0.58)) drop-shadow(0 8px 22px rgba(90,120,255,0.34))"
    : happy
      ? "drop-shadow(0 16px 32px rgba(255,214,112,0.50)) drop-shadow(0 6px 18px rgba(90,120,255,0.28))"
      : thinking
        ? "drop-shadow(0 14px 30px rgba(135,160,255,0.46)) drop-shadow(0 5px 18px rgba(255,214,112,0.22))"
        : "drop-shadow(0 12px 24px rgba(90,120,255,0.34)) drop-shadow(0 5px 16px rgba(0,0,0,0.22))";

  return (
    <span
      style={{
        display: "block",
        width: s,
        height: s,
        filter: glow,
        transform: `translateY(${floatY}px) scale(${scale}) rotate(${bodyRotate}deg)`,
        transformOrigin: "center center",
        willChange: "transform, filter",
      }}
      aria-hidden="true"
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 120 120"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <radialGradient id="cwCelesteOrb" cx="35%" cy="28%" r="76%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.99)" />
            <stop offset="34%" stopColor="rgba(232,238,255,0.97)" />
            <stop offset="72%" stopColor="rgba(157,184,255,0.94)" />
            <stop offset="100%" stopColor="rgba(82,105,158,0.90)" />
          </radialGradient>

          <radialGradient id="cwCelesteCore" cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor="rgba(255,240,174,1)" />
            <stop offset="52%" stopColor="rgba(255,205,84,0.62)" />
            <stop offset="100%" stopColor="rgba(255,204,82,0)" />
          </radialGradient>

          <linearGradient id="cwCelesteArm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.90)" />
            <stop offset="52%" stopColor="rgba(240,246,255,0.74)" />
            <stop offset="100%" stopColor="rgba(255,218,122,0.50)" />
          </linearGradient>
        </defs>

        <g transform={`rotate(${spinAngle} 60 60)`}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = i * 45;
            const long = i % 2 === 0;

            return (
              <g key={`arm_${i}`} transform={`translate(60 60) rotate(${a})`}>
                <path
                  d={
                    long
                      ? "M0,-57 C5,-46 8,-36 8,-28 C8,-22 4,-18 0,-18 C-4,-18 -8,-22 -8,-28 C-8,-36 -5,-46 0,-57 Z"
                      : "M0,-46 C4,-38 7,-31 7,-25 C7,-20 4,-17 0,-17 C-4,-17 -7,-20 -7,-25 C-7,-31 -4,-38 0,-46 Z"
                  }
                  fill={active || happy ? "rgba(255,226,132,0.88)" : "url(#cwCelesteArm)"}
                />
              </g>
            );
          })}
        </g>

        <circle
          cx="60"
          cy="60"
          r="42"
          fill="url(#cwCelesteCore)"
          opacity={active || happy ? 0.9 : 0.54}
        />

        <circle
          cx="60"
          cy="60"
          r="35.5"
          fill="url(#cwCelesteOrb)"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth="1.25"
        />

        <circle cx="47" cy="45" r="10.5" fill="rgba(255,255,255,0.24)" />

        <g>
          <ellipse cx="50" cy="63" rx={eyeRx} ry={stableEyeRy} fill="rgba(10,15,25,0.80)" />
          <ellipse cx="70" cy="63" rx={eyeRx} ry={stableEyeRy} fill="rgba(10,15,25,0.80)" />

          {blink > 0.4 && (
            <>
              <circle cx="48.7" cy="61.5" r="1.4" fill="rgba(255,255,255,0.90)" />
              <circle cx="68.7" cy="61.5" r="1.4" fill="rgba(255,255,255,0.90)" />
            </>
          )}
        </g>

        <ellipse cx="60" cy="76" rx="7.5" ry="2.6" fill="rgba(255,255,255,0.13)" />
      </svg>
    </span>
  );
}

function Celeste3DPlaceholder({ size = 86, mood = "calm" }) {
  return <CelesteStarAvatar size={size} mood={mood} />;
}

export default function CelesteOverlay({ appName = "store-classic" }) {
  const { lang } = useLang ? useLang() : { lang: "sv" };
  const L = normalizeLang(lang);

  const loc = useLocation();
  const pathname = (loc?.pathname || "/").toString();
  const isProductPage = pathname.startsWith("/product/");
  const currentProductSlug = extractProductSlugFromPath(pathname);

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState("menu");
  const [busy, setBusy] = React.useState(false);
  const [text, setText] = React.useState("");

  const [voiceEnabled, setVoiceEnabled] = React.useState(
    () => safeLsGet("cw.celeste.voice", "1") === "1",
  );
  const [debug, setDebug] = React.useState(false);

  const [lastRecSlugs, setLastRecSlugs] = React.useState([]);
  const userTurnRef = React.useRef(0);

  const chatBodyRef = React.useRef(null);
  const chatEndRef = React.useRef(null);

  const [messages, setMessages] = React.useState(() => [
    {
      id: nowId(),
      role: "assistant",
      text: `${getWarmHello(L)}\n${getWarmPromise(L)}`,
      meta: { soft: true },
    },
  ]);

  function scrollCelesteToBottom({ smooth = true } = {}) {
    try {
      const el = chatBodyRef.current;
      if (!el) return;

      window.requestAnimationFrame(() => {
        try {
          if (chatEndRef.current?.scrollIntoView) {
            chatEndRef.current.scrollIntoView({
              behavior: smooth ? "smooth" : "auto",
              block: "end",
            });
            return;
          }

          el.scrollTo({
            top: el.scrollHeight,
            behavior: smooth ? "smooth" : "auto",
          });
        } catch {
          el.scrollTop = el.scrollHeight;
        }
      });
    } catch {}
  }

  React.useEffect(() => {
    safeLsSet("cw.celeste.voice", voiceEnabled ? "1" : "0");
  }, [voiceEnabled]);

  React.useEffect(() => {
    setMessages((prev) => {
      if (!prev?.length) return prev;
      const first = prev[0];
      if (!first || first.role !== "assistant" || !first?.meta?.soft) return prev;

      return [
        {
          ...first,
          text: `${getWarmHello(L)}\n${getWarmPromise(L)}`,
        },
        ...prev.slice(1),
      ];
    });
  }, [L]);

  React.useEffect(() => {
    if (!open || mode !== "chat") return;
    scrollCelesteToBottom({ smooth: true });
  }, [messages, busy, open, mode]);

  React.useEffect(() => {
    function onKey(e) {
      if (e.altKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
      }

      if (e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        setDebug((v) => !v);
      }

      if (e.key === "Escape") {
        setOpen(false);
        setMode("menu");
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function send(msg) {
    const content = String(msg ?? text).trim();
    if (!content || busy) return;

    setBusy(true);
    setMode("chat");
    setText("");

    userTurnRef.current += 1;

    const userMsg = { id: nowId(), role: "user", text: content };
    setMessages((m) => [...m, userMsg]);

    const typingId = nowId();
    const typingText =
      L === "tr" ? "Celeste yazıyor…" : L === "en" ? "Celeste is typing…" : "Celeste skriver…";

    setMessages((m) => [
      ...m,
      {
        id: typingId,
        role: "assistant",
        text: typingText,
        meta: { typing: true },
      },
    ]);

    const pagePath = pathname || window.location.pathname || "/";

    const reply = await askCeleste({
      appName,
      text: content,
      lang: L,
      debug,
      pagePath,
      turnIndex: Math.max(0, userTurnRef.current - 1),
      lastRecSlugs,
      currentProductSlug,
    });

    if (reply?.aborted) {
      setMessages((m) => m.filter((x) => x.id !== typingId));
      setBusy(false);
      return;
    }

    const ok = !!reply?.ok;
    const assistantText = String(reply?.answer || "").trim();

    if (!ok) {
      const failText =
        assistantText ||
        (L === "tr"
          ? "Celeste: şu an cevap veremiyorum."
          : L === "en"
            ? "Celeste: I can’t answer right now."
            : "Celeste: kunde inte svara just nu.");

      setMessages((m) =>
        m.map((x) =>
          x.id === typingId
            ? {
                ...x,
                text: failText,
                meta: { ...x.meta, typing: false },
              }
            : x,
        ),
      );

      if (voiceEnabled) speak(failText, L, { mode: "exec" });
      setBusy(false);
      return;
    }

    const assistantMsg = {
      id: typingId,
      role: "assistant",
      text: assistantText,
      actions: Array.isArray(reply?.actions) ? reply.actions : [],
      meta: reply?.meta || {},
    };

    const nextSlugs = Array.isArray(reply?.meta?.recSlugs)
      ? reply.meta.recSlugs
      : Array.isArray(reply?.meta?.recs)
        ? reply.meta.recs.map((r) => r?.slug).filter(Boolean)
        : [];

    if (nextSlugs.length) setLastRecSlugs(nextSlugs.slice(0, 12));

    setMessages((m) => m.map((x) => (x.id === typingId ? assistantMsg : x)));

    runActions(assistantMsg.actions);

    if (voiceEnabled && assistantText) speak(assistantText, L, { mode: "exec" });

    setBusy(false);
  }

  function QuickButtons() {
    const labels =
      L === "tr"
        ? {
            gift: "Hediye istiyorum. Benim için üç ürün seç ve birini öner.",
            warm:
              "Sıcak ve anlamlı bir Calestra ürünü istiyorum. Üç seçenek göster ve birini öner.",
            budget:
              "300 altı bir şey istiyorum. Üç ürün seç ve en iyi başlangıcı öner.",
            help:
              "Beden, materyal ve teslimat konusunda pratik yardım ver. Önce en mantıklı ürün üzerinden anlat.",
            fit: "Bu ürün nasıl durur? Bana doğrudan beden ve his önerisi ver.",
          }
        : L === "en"
          ? {
              gift: "I want a gift. Choose three products for me and recommend one.",
              warm:
                "I want something warm and meaningful from Calestra. Show three options and recommend one.",
              budget:
                "I want something under 300. Choose three products and recommend the best first step.",
              help:
                "Help me with size, material and delivery. Explain it through the most logical product first.",
              fit: "How does this product fit? Give me a direct size and feeling recommendation.",
            }
          : {
              gift:
                "Jag vill ha en present. Välj tre produkter åt mig och rekommendera en.",
              warm:
                "Jag vill ha något varmt och meningsfullt från Calestra. Visa tre alternativ och rekommendera ett.",
              budget:
                "Jag vill ha något under 300. Välj tre produkter och rekommendera bästa första steget.",
              help:
                "Hjälp mig med storlek, material och leverans. Förklara via den mest logiska produkten först.",
              fit:
                "Hur sitter den här produkten? Ge mig en direkt rekommendation om storlek och känsla.",
            };

    const visible =
      L === "tr"
        ? {
            gift: "hediye",
            warm: "sıcak",
            budget: "300 altı",
            help: "hjälp",
            fit: "kalıp?",
          }
        : L === "en"
          ? {
              gift: "gift",
              warm: "warm",
              budget: "under 300",
              help: "help",
              fit: "fit",
            }
          : {
              gift: "present",
              warm: "varmt",
              budget: "under 300",
              help: "hjälp",
              fit: "passform",
            };

    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => send(labels.help)}
          style={pillBtn("gold")}
          disabled={busy}
        >
          {visible.help}
        </button>

        {isProductPage ? (
          <button
            type="button"
            onClick={() => send(labels.fit)}
            style={pillBtn()}
            disabled={busy}
          >
            {visible.fit}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => send(labels.gift)}
              style={pillBtn()}
              disabled={busy}
            >
              {visible.gift}
            </button>

            <button
              type="button"
              onClick={() => send(labels.warm)}
              style={pillBtn()}
              disabled={busy}
            >
              {visible.warm}
            </button>

            <button
              type="button"
              onClick={() => send(labels.budget)}
              style={pillBtn()}
              disabled={busy}
            >
              {visible.budget}
            </button>
          </>
        )}
      </div>
    );
  }

  function ProductCards({ actions, meta }) {
    const list = Array.isArray(actions) ? actions : [];
    const visible = list.filter((a) => a && typeof a === "object" && !a.auto);

    const recs = Array.isArray(meta?.recs) ? meta.recs : [];
    const bySlug = new Map(recs.map((r) => [String(r.slug || ""), r]));

    const cards = visible
      .filter((a) => a.type === "open_product" || a.type === "nav" || a.type === "open")
      .slice(0, 3)
      .map((a) => {
        const slug = String(a.slug || "");
        const r = slug && bySlug.has(slug) ? bySlug.get(slug) : null;

        const title =
          a.type === "nav"
            ? a.label || (L === "en" ? "Go" : L === "tr" ? "Git" : "Gå")
            : r?.title || a.label || "Öppna";

        const pr = r ? priceText(r) : "";
        const thumb = String(a.thumb || r?.thumb || "");
        const badges = r ? badgeText(r, L) : [];

        return { a, title, pr, thumb, badges };
      });

    if (cards.length === 0) return null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
        {cards.map((c, idx) => (
          <button
            key={`${c.a.type || "a"}_${idx}`}
            type="button"
            onClick={() => openAction(c.a)}
            style={cardBtn()}
            title={c.title}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={thumbWrap()}>
                {c.thumb ? (
                  <img
                    src={c.thumb}
                    alt=""
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 12,
                    }}
                  />
                ) : (
                  <div style={thumbFallback()}>✦</div>
                )}
              </div>

              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2 }}>
                  {c.title}
                </div>

                {(c.pr || c.badges.length > 0) && (
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {c.pr && <span style={pricePill()}>{c.pr}</span>}
                    {c.badges.map((b) => (
                      <span key={b} style={badgePill()}>
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ opacity: 0.85, fontSize: 14, marginLeft: 6 }}>›</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  const isMobile = typeof window !== "undefined" ? window.innerWidth < 520 : false;
  const AVATAR_SIZE = isMobile ? 82 : 86;
  const HEADER_AVATAR_SIZE = 28;
  const mood = busy ? "active" : open ? "happy" : "calm";

  const AvatarComponent = CELESTE_RENDER_MODE === "3d" ? Celeste3DPlaceholder : CelesteStarAvatar;

  return (
    <div style={wrap()}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={avatarBtn(open)}
        aria-label="Öppna Celeste"
        title={L === "en" ? "Open Celeste" : L === "tr" ? "Celeste'i aç" : "Öppna Celeste"}
      >
        <AvatarComponent size={AVATAR_SIZE} mood={mood} />
      </button>

      {open && (
        <div style={panel()}>
          <div style={header()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: HEADER_AVATAR_SIZE, height: HEADER_AVATAR_SIZE }}>
                <AvatarComponent size={HEADER_AVATAR_SIZE} mood={mood} />
              </div>

              <div>
                <div style={{ fontWeight: 1000, letterSpacing: 0.6, fontSize: 12 }}>
                  CELESTE · STORE {debug ? "· DEBUG" : ""}
                </div>

                <div style={{ opacity: 0.78, fontSize: 12 }}>
                  {mode === "menu"
                    ? L === "tr"
                      ? "Bir his seç"
                      : L === "en"
                        ? "Pick a feeling"
                        : "Välj en känsla"
                    : L === "tr"
                      ? "Beden · Materyal · Teslimat"
                      : L === "en"
                        ? "Sizes · Materials · Delivery"
                        : "Storlek · Material · Leverans"}

                  {isProductPage && currentProductSlug && mode !== "menu" ? (
                    <span style={{ opacity: 0.55 }}> · {currentProductSlug}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setDebug((v) => !v)}
                style={iconBtn()}
                title="Debug på/av (Alt+D)"
              >
                {debug ? "🧪" : "✓"}
              </button>

              <button type="button" onClick={() => setVoiceEnabled((v) => !v)} style={iconBtn()}>
                {voiceEnabled ? "🔊" : "🔇"}
              </button>

              {mode === "chat" && (
                <button type="button" onClick={() => setMode("menu")} style={iconBtn()}>
                  ←
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMode("menu");
                }}
                style={iconBtn()}
              >
                ×
              </button>
            </div>
          </div>

          {mode === "menu" && (
            <div style={menuBody()}>
              <div style={{ opacity: 0.86, fontSize: 12.5, lineHeight: 1.35, marginBottom: 10 }}>
                {L === "tr"
                  ? "İstersen ben seçerim. Sadece bir his seç."
                  : L === "en"
                    ? "If you want, I’ll pick for you. Just choose a feeling."
                    : "Om du vill kan jag välja åt dig. Välj bara en känsla."}
              </div>

              <QuickButtons />
            </div>
          )}

          {mode === "chat" && (
            <>
              <div ref={chatBodyRef} style={chatBody()}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <div style={bubble(m.role, !!m?.meta?.typing)}>
                      <div>{m.text}</div>

                      {m.role !== "user" && !m?.meta?.typing && (
                        <ProductCards actions={m.actions} meta={m.meta} />
                      )}
                    </div>
                  </div>
                ))}

                <div ref={chatEndRef} style={{ height: 1 }} />
              </div>

              <div style={inputRow()}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder={L === "tr" ? "Celeste'e sor..." : L === "en" ? "Ask Celeste..." : "Fråga Celeste..."}
                  style={input()}
                  disabled={busy}
                />

                <button type="button" onClick={() => send()} style={sendBtn()} disabled={busy}>
                  {busy ? "…" : L === "tr" ? "Gönder" : L === "en" ? "Send" : "Skicka"}
                </button>
              </div>

              <div style={footerHint()}>
                {L === "tr"
                  ? "Acele yok — ben buradayım."
                  : L === "en"
                    ? "No rush — I’m here."
                    : "Ingen stress — jag är här."}
              </div>

              <div style={{ padding: "0 12px 12px" }}>
                <QuickButtons />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function wrap() {
  return {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 9999,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  };
}

function avatarBtn(open) {
  return {
    appearance: "none",
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    borderRadius: 999,
    transform: open ? "scale(0.97)" : "scale(1)",
    transition: "transform 160ms ease",
  };
}

function panel() {
  return {
    position: "absolute",
    right: 0,
    bottom: 96,
    width: 340,
    maxWidth: "calc(100vw - 32px)",
    borderRadius: 18,
    overflow: "hidden",
    background: "rgba(10, 14, 24, 0.94)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 46px rgba(0,0,0,0.40)",
    display: "flex",
    flexDirection: "column",
  };
}

function header() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.92)",
  };
}

function menuBody() {
  return {
    padding: 12,
    color: "rgba(255,255,255,0.92)",
  };
}

function chatBody() {
  return {
    padding: 12,
    maxHeight: 340,
    overflow: "auto",
    overscrollBehavior: "contain",
    scrollBehavior: "smooth",
  };
}

function bubble(role, typing) {
  return {
    width: "100%",
    maxWidth: "92%",
    padding: "10px 12px",
    borderRadius: 14,
    fontSize: 13,
    lineHeight: 1.35,
    color: "rgba(255,255,255,0.92)",
    background: role === "user" ? "rgba(114, 98, 255, 0.35)" : "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "pre-wrap",
    opacity: typing ? 0.88 : 1,
  };
}

function inputRow() {
  return {
    display: "flex",
    gap: 10,
    padding: 12,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
  };
}

function input() {
  return {
    flex: 1,
    height: 38,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.92)",
    padding: "0 12px",
    outline: "none",
  };
}

function sendBtn() {
  return {
    height: 38,
    borderRadius: 12,
    padding: "0 14px",
    border: "1px solid rgba(255, 215, 80, 0.55)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    fontWeight: 900,
  };
}

function iconBtn() {
  return {
    width: 30,
    height: 30,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
  };
}

function pillBtn(kind = "base") {
  const border =
    kind === "gold"
      ? "1px solid rgba(255, 215, 80, 0.55)"
      : "1px solid rgba(255, 215, 80, 0.35)";

  return {
    borderRadius: 999,
    padding: "8px 10px",
    border,
    background: "rgba(0,0,0,0.18)",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
  };
}

function footerHint() {
  return {
    padding: "0 12px 8px",
    fontSize: 11.5,
    color: "rgba(255,255,255,0.82)",
  };
}

function cardBtn() {
  return {
    width: "100%",
    borderRadius: 14,
    padding: 10,
    border: "1px solid rgba(255, 215, 80, 0.35)",
    background: "rgba(0,0,0,0.18)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    textAlign: "left",
  };
}

function thumbWrap() {
  return {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    flex: "0 0 auto",
  };
}

function thumbFallback() {
  return {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    opacity: 0.8,
    fontSize: 16,
  };
}

function pricePill() {
  return {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    fontWeight: 900,
  };
}

function badgePill() {
  return {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255, 215, 80, 0.35)",
    background: "rgba(0,0,0,0.20)",
    fontWeight: 900,
  };
}