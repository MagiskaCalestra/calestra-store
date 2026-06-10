// D:\WebProjects\Calestra\apps\store-classic\src\components\FeelingBar.jsx
import React from "react";

/**
 * Calestra Mood Filter™
 *
 * Vi filtrerar efter känsla/vibe, inte kön.
 * Det gör butiken mer personlig utan att låsa kunden i stereotyper.
 */

export const MOODS = [
  "soft",
  "dark",
  "premium",
  "cozy",
  "collector",
  "street",
  "gift",
  "practical",
];

export const FEELINGS = MOODS;

export const MOOD_META = {
  soft: {
    sv: "Soft Light",
    en: "Soft Light",
    tr: "Soft Light",
    note: {
      sv: "Mjukt, varmt, fluffigt",
      en: "Soft, warm, gentle",
      tr: "Yumuşak, sıcak, hafif",
    },
  },
  dark: {
    sv: "Dark Star",
    en: "Dark Star",
    tr: "Dark Star",
    note: {
      sv: "Svart, starkt, street",
      en: "Black, strong, street",
      tr: "Siyah, güçlü, street",
    },
  },
  premium: {
    sv: "Clean Premium",
    en: "Clean Premium",
    tr: "Clean Premium",
    note: {
      sv: "Stilrent, vuxet, diskret",
      en: "Clean, mature, discreet",
      tr: "Sade, olgun, zarif",
    },
  },
  cozy: {
    sv: "Magic Cozy",
    en: "Magic Cozy",
    tr: "Magic Cozy",
    note: {
      sv: "Mysigt, varmt, hemma",
      en: "Cozy, warm, home",
      tr: "Rahat, sıcak, ev hissi",
    },
  },
  collector: {
    sv: "Collector Path",
    en: "Collector Path",
    tr: "Collector Path",
    note: {
      sv: "Limited, symbol, samlare",
      en: "Limited, symbol, collector",
      tr: "Sınırlı, sembol, koleksiyon",
    },
  },
  street: {
    sv: "Trend & Stil",
    en: "Trend & Style",
    tr: "Trend & Stil",
    note: {
      sv: "Ungt, tydligt, trendigt",
      en: "Young, clear, trendy",
      tr: "Genç, net, trend",
    },
  },
  gift: {
    sv: "Present",
    en: "Gift",
    tr: "Hediye",
    note: {
      sv: "Tryggt att ge bort",
      en: "Easy to give",
      tr: "Hediye için güvenli",
    },
  },
  practical: {
    sv: "Praktiskt",
    en: "Practical",
    tr: "Pratik",
    note: {
      sv: "Användbart i vardagen",
      en: "Useful every day",
      tr: "Günlük kullanışlı",
    },
  },
};

function normalizeLang(lang = "sv") {
  const b = String(lang || "sv").slice(0, 2).toLowerCase();
  return b === "sv" || b === "en" || b === "tr" ? b : "sv";
}

export function labelForMood(mood, lang = "sv") {
  const L = normalizeLang(lang);
  return MOOD_META[mood]?.[L] || MOOD_META[mood]?.sv || mood;
}

export function noteForMood(mood, lang = "sv") {
  const L = normalizeLang(lang);
  return MOOD_META[mood]?.note?.[L] || MOOD_META[mood]?.note?.sv || "";
}

/**
 * mode="link"   -> chippar länkar till /shop?feel=<chip>
 * mode="toggle" -> chippar togglar on/off via onToggle
 */
export default function FeelingBar({
  mode = "toggle",
  active = [],
  onToggle,
  ariaLabel,
  lang = "sv",
  compact = false,
  moods = MOODS,
}) {
  const isToggle = mode === "toggle";
  const L = normalizeLang(lang);

  const groupLabel =
    ariaLabel ||
    (L === "tr"
      ? "Calestra duygu filtresi"
      : L === "en"
        ? "Calestra mood filter"
        : "Calestra känslofilter");

  return (
    <div className="feelingbar-wrap">
      <div className="feelingbar-chips" role="group" aria-label={groupLabel}>
        {moods.map((mood) => {
          const on = isToggle && active?.includes?.(mood);
          const className = `feelingbar-chip feelingbar-chip-${mood} ${on ? "is-on" : ""}`;
          const label = labelForMood(mood, L);
          const note = noteForMood(mood, L);

          if (!isToggle) {
            return (
              <a
                key={mood}
                className={className}
                href={`/shop?feel=${encodeURIComponent(mood)}`}
                aria-label={`${groupLabel}: ${label}`}
                title={note || label}
              >
                <span className="feelingbar-chip-label">{label}</span>
                {!compact && note ? <span className="feelingbar-chip-note">{note}</span> : null}
              </a>
            );
          }

          return (
            <button
              key={mood}
              type="button"
              className={className}
              aria-pressed={on}
              onClick={() => onToggle?.(mood)}
              title={note || label}
            >
              <span className="feelingbar-chip-label">{label}</span>
              {!compact && note ? <span className="feelingbar-chip-note">{note}</span> : null}
            </button>
          );
        })}
      </div>

      <style>{css}</style>
    </div>
  );
}

const css = `
.feelingbar-wrap {
  width: 100%;
}

.feelingbar-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.feelingbar-chip {
  min-height: 34px;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: .02em;
  background: var(--chip-bg, rgba(0,0,0,.055));
  color: var(--chip-text, var(--text, #111));
  border: 1px solid var(--chip-border, rgba(0,0,0,.12));
  text-decoration: none;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1px;
  transition:
    transform .12s ease,
    border-color .12s ease,
    background .12s ease,
    box-shadow .12s ease;
  cursor: pointer;
  line-height: 1.1;
}

.feelingbar-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(0,0,0,.22);
}

.feelingbar-chip.is-on {
  background: rgba(255,255,255,.12);
  border-color: var(--chip-border-on, rgba(0,0,0,.30));
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
}

.feelingbar-chip-label {
  white-space: nowrap;
}

.feelingbar-chip-note {
  font-size: 10.5px;
  font-weight: 650;
  opacity: .68;
  white-space: nowrap;
}

.feelingbar-chip-soft {
  --chip-bg: rgba(255, 190, 220, .14);
  --chip-border: rgba(255, 145, 200, .28);
}

.feelingbar-chip-dark {
  --chip-bg: rgba(20, 24, 38, .10);
  --chip-border: rgba(20, 24, 38, .24);
}

.feelingbar-chip-premium {
  --chip-bg: rgba(214, 174, 82, .13);
  --chip-border: rgba(214, 174, 82, .30);
}

.feelingbar-chip-cozy {
  --chip-bg: rgba(255, 190, 120, .14);
  --chip-border: rgba(255, 170, 90, .28);
}

.feelingbar-chip-collector {
  --chip-bg: rgba(150, 120, 255, .13);
  --chip-border: rgba(150, 120, 255, .30);
}

.feelingbar-chip-street {
  --chip-bg: rgba(80, 110, 255, .12);
  --chip-border: rgba(80, 110, 255, .28);
}

.feelingbar-chip-gift {
  --chip-bg: rgba(255, 115, 145, .12);
  --chip-border: rgba(255, 115, 145, .28);
}

.feelingbar-chip-practical {
  --chip-bg: rgba(80, 170, 140, .12);
  --chip-border: rgba(80, 170, 140, .28);
}

.feelingbar-chip:focus-visible {
  outline: 2px solid #5868ff;
  outline-offset: 2px;
  border-radius: 999px;
}

body.theme-dark .feelingbar-chip {
  background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.18);
  color: #fff;
}

body.theme-dark .feelingbar-chip:hover {
  border-color: rgba(255,255,255,.30);
}

body.theme-dark .feelingbar-chip.is-on {
  border-color: rgba(255,255,255,.40);
  background: rgba(255,255,255,.12);
}

body.theme-dark .feelingbar-chip-note {
  opacity: .72;
}
`;