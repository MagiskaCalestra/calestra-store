// D:\WebProjects\Calestra\apps\store-classic\src\pages\Progress.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { TT } from "../i18n/tt.js";

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, num(v, min)));
}

function getLang(i18n) {
  return String(i18n?.language || "sv").slice(0, 2).toLowerCase();
}

function pickLang(i18n, values = {}) {
  const lang = getLang(i18n);
  return values[lang] || values.sv || values.en || values.tr || "";
}

function formatSEK(v, locale = "sv-SE") {
  return `${Math.round(num(v, 0)).toLocaleString(locale)} kr`;
}

function ProgressSignal({ label, value, sub }) {
  return (
    <div className="progress-signal">
      <span className="progress-signal-label">{label}</span>
      <strong className="progress-signal-value">{value}</strong>
      {sub ? <span className="progress-signal-sub">{sub}</span> : null}
    </div>
  );
}

function ScoreCard({ label, value, sub, main = false }) {
  return (
    <div className={`score-card ${main ? "score-main" : ""}`}>
      <span className="score-label">{label}</span>
      <strong className="score-value">{value}</strong>
      <span className="score-sub">{sub}</span>
    </div>
  );
}

function fallbackLevels(i18n, t) {
  return [
    {
      id: 1,
      key: "firstLight",
      title: TT(i18n, t, "progress.levels.firstLight.title", {
        sv: "First Light",
        en: "First Light",
        tr: "First Light",
      }),
      badge: TT(i18n, t, "progress.levels.firstLight.badge", {
        sv: "Start",
        en: "Start",
        tr: "Başlangıç",
      }),
      state: "active",
      body: TT(i18n, t, "progress.levels.firstLight.body", {
        sv: "Den första publika signalen: butik, intresse, tidiga orders och första verkliga respons.",
        en: "The first public signal: store, interest, early orders, and the first real response.",
        tr: "İlk açık sinyal: mağaza, ilgi, erken siparişler ve ilk gerçek tepki.",
      }),
    },
    {
      id: 2,
      key: "signalWave",
      title: TT(i18n, t, "progress.levels.signalWave.title", {
        sv: "Signal Wave",
        en: "Signal Wave",
        tr: "Signal Wave",
      }),
      badge: TT(i18n, t, "progress.levels.signalWave.badge", {
        sv: "Nästa",
        en: "Next",
        tr: "Sonraki",
      }),
      state: "locked",
      body: TT(i18n, t, "progress.levels.signalWave.body", {
        sv: "När fler kunder, prenumeranter och återkommande besök börjar visa att rörelsen lever.",
        en: "When more customers, subscribers, and returning visits begin to show that the movement is alive.",
        tr: "Daha fazla müşteri, abone ve tekrar ziyaret hareketin yaşadığını göstermeye başladığında.",
      }),
    },
    {
      id: 3,
      key: "brandPulse",
      title: TT(i18n, t, "progress.levels.brandPulse.title", {
        sv: "Brand Pulse",
        en: "Brand Pulse",
        tr: "Brand Pulse",
      }),
      badge: TT(i18n, t, "progress.levels.brandPulse.badge", {
        sv: "Kommande",
        en: "Coming",
        tr: "Yakında",
      }),
      state: "locked",
      body: TT(i18n, t, "progress.levels.brandPulse.body", {
        sv: "Calestra börjar kännas som ett varumärke, inte bara en butik.",
        en: "Calestra begins to feel like a brand, not just a store.",
        tr: "Calestra yalnızca bir mağaza değil, bir marka gibi hissedilmeye başlar.",
      }),
    },
    {
      id: 4,
      key: "founderMomentum",
      title: TT(i18n, t, "progress.levels.founderMomentum.title", {
        sv: "Founder Momentum",
        en: "Founder Momentum",
        tr: "Founder Momentum",
      }),
      badge: TT(i18n, t, "progress.levels.founderMomentum.badge", {
        sv: "Kommande",
        en: "Coming",
        tr: "Yakında",
      }),
      state: "locked",
      body: TT(i18n, t, "progress.levels.founderMomentum.body", {
        sv: "Starkare intäkter, tydligare publik och bättre underlag för nästa strategiska steg.",
        en: "Stronger revenue, a clearer audience, and a better foundation for the next strategic step.",
        tr: "Daha güçlü gelir, daha net kitle ve sonraki stratejik adım için daha sağlam temel.",
      }),
    },
    {
      id: 5,
      key: "experienceProof",
      title: TT(i18n, t, "progress.levels.experienceProof.title", {
        sv: "Experience Proof",
        en: "Experience Proof",
        tr: "Experience Proof",
      }),
      badge: TT(i18n, t, "progress.levels.experienceProof.badge", {
        sv: "Kommande",
        en: "Coming",
        tr: "Yakında",
      }),
      state: "locked",
      body: TT(i18n, t, "progress.levels.experienceProof.body", {
        sv: "Digital butik, community och storytelling börjar bära en större upplevelse.",
        en: "The digital store, community, and storytelling begin to carry a larger experience.",
        tr: "Dijital mağaza, topluluk ve hikâye anlatımı daha büyük bir deneyimi taşımaya başlar.",
      }),
    },
    {
      id: 6,
      key: "capitalReadiness",
      title: TT(i18n, t, "progress.levels.capitalReadiness.title", {
        sv: "Capital Readiness",
        en: "Capital Readiness",
        tr: "Capital Readiness",
      }),
      badge: TT(i18n, t, "progress.levels.capitalReadiness.badge", {
        sv: "Kommande",
        en: "Coming",
        tr: "Yakında",
      }),
      state: "locked",
      body: TT(i18n, t, "progress.levels.capitalReadiness.body", {
        sv: "Projektet kan börja presenteras starkare mot partners, investerare och större möjligheter.",
        en: "The project can begin to be presented more strongly to partners, investors, and larger opportunities.",
        tr: "Proje; ortaklara, yatırımcılara ve daha büyük fırsatlara daha güçlü sunulmaya başlayabilir.",
      }),
    },
    {
      id: 7,
      key: "worldPath",
      title: TT(i18n, t, "progress.levels.worldPath.title", {
        sv: "Calestra World Path",
        en: "Calestra World Path",
        tr: "Calestra World Path",
      }),
      badge: TT(i18n, t, "progress.levels.worldPath.badge", {
        sv: "Vision",
        en: "Vision",
        tr: "Vizyon",
      }),
      state: "locked",
      body: TT(i18n, t, "progress.levels.worldPath.body", {
        sv: "Den långsiktiga vägen mot fysisk upplevelse, resort, park och globalt varumärke.",
        en: "The long-term path toward physical experience, resort, park, and global brand.",
        tr: "Fiziksel deneyim, resort, park ve global marka yolundaki uzun vadeli yön.",
      }),
    },
  ];
}

function mergeLevelStates(localLevels, apiLevels = []) {
  if (!Array.isArray(apiLevels) || !apiLevels.length) return localLevels;

  const apiById = new Map(
    apiLevels
      .filter((lvl) => lvl && lvl.id != null)
      .map((lvl) => [String(lvl.id), lvl])
  );

  return localLevels.map((local) => {
    const api = apiById.get(String(local.id));
    if (!api) return local;

    return {
      ...local,
      state: api.state || local.state,
    };
  });
}

export default function Progress() {
  const { t, i18n } = useTranslation();

  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const lang = getLang(i18n);
  const moneyLocale = lang === "en" ? "en-US" : lang === "tr" ? "tr-TR" : "sv-SE";

  React.useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/progress", {
          headers: { accept: "application/json" },
          cache: "no-store",
        });

        const json = await res.json().catch(() => null);
        if (!alive) return;

        if (res.ok && json?.ok) {
          setData(json);
        } else {
          setError(
            TT(i18n, t, "progress.error.fetch", {
              sv: "Progress kunde inte hämtas just nu.",
              en: "Progress could not be loaded right now.",
              tr: "Progress şu anda alınamadı.",
            })
          );
        }
      } catch (e) {
        console.error("progress load failed", e);
        if (alive) {
          setError(
            TT(i18n, t, "progress.error.network", {
              sv: "Ingen kontakt med progress-systemet just nu.",
              en: "No connection to the progress system right now.",
              tr: "Progress sistemiyle şu anda bağlantı yok.",
            })
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [i18n, t]);

  const localLevels = React.useMemo(() => fallbackLevels(i18n, t), [i18n, t]);
  const levels = React.useMemo(
    () => mergeLevelStates(localLevels, data?.levels),
    [localLevels, data?.levels]
  );

  const rawSummary = data?.summary || {};
  const currentStep = num(rawSummary.currentStep, 1);
  const totalSteps = num(rawSummary.totalSteps, 7);
  const pct = clamp(rawSummary.progressPct, 0, 100);

  const currentLevel = levels.find((lvl) => num(lvl.id) === currentStep) || levels[0];
  const nextLevel = levels.find((lvl) => num(lvl.id) === currentStep + 1) || null;

  const currentLabel =
    currentLevel?.title ||
    TT(i18n, t, "progress.fallback.currentLabel", {
      sv: "First Light",
      en: "First Light",
      tr: "First Light",
    });

  const nextLabel =
    nextLevel?.title ||
    TT(i18n, t, "progress.fallback.nextLabel", {
      sv: "Signal Wave",
      en: "Signal Wave",
      tr: "Signal Wave",
    });

  const narrative = {
    headline:
      data?.narrative?.headline ||
      TT(i18n, t, "progress.fallback.headline", {
        sv: "Calestra växer",
        en: "Calestra is growing",
        tr: "Calestra büyüyor",
      }),
    body:
      data?.narrative?.body ||
      TT(i18n, t, "progress.fallback.body", {
        sv: "Varje nivå representerar verkliga signaler i Calestras utveckling — från butikens första rörelse till större varumärkesmomentum.",
        en: "Each level represents real signals in Calestra’s development — from the store’s first movement to larger brand momentum.",
        tr: "Her seviye Calestra’nın gelişimindeki gerçek sinyalleri temsil eder — mağazanın ilk hareketinden daha büyük marka ivmesine kadar.",
      }),
    caption:
      data?.narrative?.caption ||
      TT(i18n, t, "progress.fallback.caption", {
        sv: "När progressen växer låses nästa fas upp.",
        en: "As progress grows, the next phase unlocks.",
        tr: "Progress büyüdükçe sonraki aşama açılır.",
      }),
  };

  const scores = data?.scores || {};
  const signals = data?.signals || {};

  const ordersCount = num(signals.ordersCount, 0);
  const recoveredOrders = num(signals.recoveredOrders, 0);
  const subscribersActive = num(signals.subscribersActive, 0);
  const openDrafts = num(signals.openDrafts, 0);
  const openDraftValueSEK = num(signals.openDraftValueSEK, 0);

  const orderScore = Math.round(num(scores.orderScore, 0));
  const recoveryScore = Math.round(num(scores.recoveryScore, 0));
  const subscriberScore = Math.round(num(scores.subscriberScore, 0));
  const overallScore = Math.round(num(scores.overallScore, pct));

  const stepOfText = pickLang(i18n, {
    sv: `Steg ${currentStep} av ${totalSteps}`,
    en: `Step ${currentStep} of ${totalSteps}`,
    tr: `${totalSteps} adımdan ${currentStep}. adım`,
  });

  const nextText = pickLang(i18n, {
    sv: `Nästa: ${nextLabel || "—"}`,
    en: `Next: ${nextLabel || "—"}`,
    tr: `Sonraki: ${nextLabel || "—"}`,
  });

  const progressAria = pickLang(i18n, {
    sv: `Progress ${Math.round(pct)} procent`,
    en: `Progress ${Math.round(pct)} percent`,
    tr: `Progress yüzde ${Math.round(pct)}`,
  });

  const currentPhaseBody = pickLang(i18n, {
    sv: `Calestra är just nu i ${currentLabel}. När nästa tröskel nås öppnas vägen mot ${nextLabel}.`,
    en: `Calestra is currently in ${currentLabel}. When the next threshold is reached, the path toward ${nextLabel} opens.`,
    tr: `Calestra şu anda ${currentLabel} aşamasında. Sonraki eşik geçildiğinde ${nextLabel} yolu açılır.`,
  });

  const percentDoneText = pickLang(i18n, {
    sv: `${Math.round(pct)}% klart`,
    en: `${Math.round(pct)}% complete`,
    tr: `%${Math.round(pct)} tamamlandı`,
  });

  const nextUnlockText =
    num(rawSummary.nextUnlockAt, 0) > 0
      ? pickLang(i18n, {
          sv: `${rawSummary.nextUnlockAt}% till nästa nivå`,
          en: `${rawSummary.nextUnlockAt}% to next level`,
          tr: `Sonraki seviye için %${rawSummary.nextUnlockAt}`,
        })
      : TT(i18n, t, "progress.currentPhase.signalBased", {
          sv: "Nästa nivå styrs av signalerna",
          en: "The next level is driven by signals",
          tr: "Sonraki seviye sinyallerle belirlenir",
        });

  return (
    <main className="container progress-page" role="main">
      <section className="progress-hero">
        <div className="progress-hero-copy">
          <div className="progress-kicker">
            <span className="progress-kicker-dot" />
            <span>
              {loading
                ? TT(i18n, t, "progress.status.syncing", {
                    sv: "SYNKAR",
                    en: "SYNCING",
                    tr: "SENKRONİZE",
                  })
                : error
                  ? TT(i18n, t, "progress.status.localView", {
                      sv: "LOKAL VY",
                      en: "LOCAL VIEW",
                      tr: "YEREL GÖRÜNÜM",
                    })
                  : TT(i18n, t, "progress.status.liveJourney", {
                      sv: "LIVE-RESA",
                      en: "LIVE JOURNEY",
                      tr: "CANLI YOLCULUK",
                    })}
            </span>
          </div>

          <h1 className="progress-hero-title">
            {loading
              ? TT(i18n, t, "progress.loading.title", {
                  sv: "Läser Calestras resa...",
                  en: "Reading Calestra’s journey...",
                  tr: "Calestra’nın yolculuğu okunuyor...",
                })
              : narrative.headline || currentLabel}
          </h1>

          <p className="progress-hero-body">
            {loading
              ? TT(i18n, t, "progress.loading.body", {
                  sv: "Vi hämtar den senaste live-progressen från systemet.",
                  en: "We are loading the latest live progress from the system.",
                  tr: "Sistemden en güncel canlı progress bilgisi alınıyor.",
                })
              : error || narrative.body}
          </p>

          <div className="progress-actions">
            <Link to="/shop" className="progress-cta primary">
              {TT(i18n, t, "progress.cta.shop", {
                sv: "Till shoppen",
                en: "Go to shop",
                tr: "Mağazaya git",
              })}
            </Link>
            <Link to="/assoc" className="progress-cta secondary">
              {TT(i18n, t, "progress.cta.associate", {
                sv: "Bli Associate",
                en: "Become an Associate",
                tr: "Associate ol",
              })}
            </Link>
          </div>
        </div>

        <div className="progress-live-card">
          <div className="progress-live-top">
            <div className="progress-phase-pill">{stepOfText}</div>
            <div className="progress-live-pct">{Math.round(pct)}%</div>
          </div>

          <div className="progress-live-title-row">
            <strong>{loading ? "..." : currentLabel}</strong>
            <span>{loading ? "..." : nextText}</span>
          </div>

          <div className="journey-bar big" aria-label={progressAria}>
            <div className="journey-fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="journey-caption strong">
            {loading
              ? TT(i18n, t, "progress.loading.signals", {
                  sv: "Hämtar signaler...",
                  en: "Loading signals...",
                  tr: "Sinyaller yükleniyor...",
                })
              : narrative.caption}
          </div>

          <div className="progress-mini-grid">
            <ProgressSignal
              label={TT(i18n, t, "progress.signals.orders", {
                sv: "Ordrar",
                en: "Orders",
                tr: "Siparişler",
              })}
              value={ordersCount}
              sub={TT(i18n, t, "progress.signals.liveSignal", {
                sv: "live-signal",
                en: "live signal",
                tr: "canlı sinyal",
              })}
            />
            <ProgressSignal
              label={TT(i18n, t, "progress.signals.subscribers", {
                sv: "Prenumeranter",
                en: "Subscribers",
                tr: "Aboneler",
              })}
              value={subscribersActive}
              sub={TT(i18n, t, "progress.signals.activeAudience", {
                sv: "aktiv publik",
                en: "active audience",
                tr: "aktif kitle",
              })}
            />
            <ProgressSignal
              label={TT(i18n, t, "progress.signals.recovery", {
                sv: "Recovery",
                en: "Recovery",
                tr: "Recovery",
              })}
              value={recoveredOrders}
              sub={TT(i18n, t, "progress.signals.recoveredPurchases", {
                sv: "återställda köp",
                en: "recovered purchases",
                tr: "kurtarılan alışverişler",
              })}
            />
          </div>
        </div>
      </section>

      <section className="progress-scoreboard">
        <ScoreCard
          label={TT(i18n, t, "progress.score.overall", {
            sv: "Overall momentum",
            en: "Overall momentum",
            tr: "Genel ivme",
          })}
          value={overallScore}
          sub={TT(i18n, t, "progress.score.overallSub", {
            sv: "systemets samlade framdrift",
            en: "the system’s combined progress",
            tr: "sistemin toplam ilerleyişi",
          })}
          main
        />
        <ScoreCard
          label={TT(i18n, t, "progress.score.orders", {
            sv: "Order score",
            en: "Order score",
            tr: "Sipariş skoru",
          })}
          value={orderScore}
          sub={pickLang(i18n, {
            sv: `${ordersCount} ordrar registrerade`,
            en: `${ordersCount} orders registered`,
            tr: `${ordersCount} sipariş kaydedildi`,
          })}
        />
        <ScoreCard
          label={TT(i18n, t, "progress.score.recovery", {
            sv: "Recovery score",
            en: "Recovery score",
            tr: "Recovery skoru",
          })}
          value={recoveryScore}
          sub={pickLang(i18n, {
            sv: `${recoveredOrders} köp återhämtade`,
            en: `${recoveredOrders} purchases recovered`,
            tr: `${recoveredOrders} alışveriş kurtarıldı`,
          })}
        />
        <ScoreCard
          label={TT(i18n, t, "progress.score.subscribers", {
            sv: "Subscriber score",
            en: "Subscriber score",
            tr: "Abone skoru",
          })}
          value={subscriberScore}
          sub={pickLang(i18n, {
            sv: `${subscribersActive} aktiva prenumeranter`,
            en: `${subscribersActive} active subscribers`,
            tr: `${subscribersActive} aktif abone`,
          })}
        />
      </section>

      <section className="progress-insight-grid">
        <div className="insight-card insight-card-light">
          <div className="insight-eyebrow">
            {TT(i18n, t, "progress.currentPhase.eyebrow", {
              sv: "NUVARANDE FAS",
              en: "CURRENT PHASE",
              tr: "MEVCUT AŞAMA",
            })}
          </div>
          <h2>{loading ? "..." : currentLabel}</h2>
          <p>
            {loading
              ? TT(i18n, t, "progress.currentPhase.loading", {
                  sv: "Läser aktuell fas...",
                  en: "Reading current phase...",
                  tr: "Mevcut aşama okunuyor...",
                })
              : currentPhaseBody}
          </p>

          <div className="insight-meta-row">
            <span>{percentDoneText}</span>
            <span>{nextUnlockText}</span>
          </div>
        </div>

        <div className="insight-card insight-card-dark">
          <div className="insight-eyebrow">
            {TT(i18n, t, "progress.liveSignals.eyebrow", {
              sv: "LIVE-SIGNALER",
              en: "LIVE SIGNALS",
              tr: "CANLI SİNYALLER",
            })}
          </div>
          <h2>
            {TT(i18n, t, "progress.liveSignals.title", {
              sv: "Det som driver resan framåt",
              en: "What drives the journey forward",
              tr: "Yolculuğu ileri taşıyan şey",
            })}
          </h2>
          <p>
            {TT(i18n, t, "progress.liveSignals.body", {
              sv: "Öppna kundvagnar, återhämtade köp, prenumeranter och verkliga orders bygger nästa nivå. Det här gör progressen levande.",
              en: "Open carts, recovered purchases, subscribers, and real orders build the next level. This is what makes the progress alive.",
              tr: "Açık sepetler, kurtarılan alışverişler, aboneler ve gerçek siparişler sonraki seviyeyi oluşturur. Progress’i canlı yapan budur.",
            })}
          </p>

          <div className="signal-list">
            <div className="signal-line">
              <span>
                {TT(i18n, t, "progress.liveSignals.openDrafts", {
                  sv: "Öppna utkast",
                  en: "Open drafts",
                  tr: "Açık taslaklar",
                })}
              </span>
              <strong>{openDrafts}</strong>
            </div>
            <div className="signal-line">
              <span>
                {TT(i18n, t, "progress.liveSignals.openDraftValue", {
                  sv: "Värde i öppna utkast",
                  en: "Open draft value",
                  tr: "Açık taslak değeri",
                })}
              </span>
              <strong>{formatSEK(openDraftValueSEK, moneyLocale)}</strong>
            </div>
            <div className="signal-line">
              <span>
                {TT(i18n, t, "progress.liveSignals.orders", {
                  sv: "Ordrar",
                  en: "Orders",
                  tr: "Siparişler",
                })}
              </span>
              <strong>{ordersCount}</strong>
            </div>
            <div className="signal-line">
              <span>
                {TT(i18n, t, "progress.liveSignals.subscribers", {
                  sv: "Prenumeranter",
                  en: "Subscribers",
                  tr: "Aboneler",
                })}
              </span>
              <strong>{subscribersActive}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="levels">
        <div className="levels-head">
          <h2 className="progress-title">
            {TT(i18n, t, "progress.levels.title", {
              sv: "Resans nivåer",
              en: "Journey levels",
              tr: "Yolculuk seviyeleri",
            })}
          </h2>
          <p className="progress-intro">
            {loading
              ? TT(i18n, t, "progress.levels.loading", {
                  sv: "Läser nivåerna...",
                  en: "Reading levels...",
                  tr: "Seviyeler okunuyor...",
                })
              : TT(i18n, t, "progress.levels.intro", {
                  sv: "Varje nivå representerar en verklig milstolpe i Calestras utveckling — från första ljus till större upplevelse.",
                  en: "Each level represents a real milestone in Calestra’s development — from first light to a larger experience.",
                  tr: "Her seviye Calestra’nın gelişiminde gerçek bir dönüm noktasını temsil eder — ilk ışıktan daha büyük deneyime kadar.",
                })}
          </p>
        </div>

        <div className="level-grid">
          {levels.map((lvl) => {
            const state = lvl.state || "locked";

            return (
              <article key={lvl.id || lvl.key || lvl.title} className={`level-card level-${state}`}>
                <header className="level-head">
                  <div className="level-num">{lvl.id}</div>

                  <div className="level-title-row">
                    <h3 className="level-title">{lvl.title}</h3>
                    <span className="level-badge">{lvl.badge || state}</span>
                  </div>
                </header>

                <p className="level-body">{lvl.body}</p>

                <div className="level-footer">
                  {state === "done" ? (
                    <span className="level-note good">
                      {TT(i18n, t, "progress.levelState.done", {
                        sv: "Redan uppnådd",
                        en: "Already reached",
                        tr: "Zaten ulaşıldı",
                      })}
                    </span>
                  ) : state === "active" ? (
                    <span className="level-note active">
                      {TT(i18n, t, "progress.levelState.active", {
                        sv: "Aktiv nivå",
                        en: "Active level",
                        tr: "Aktif seviye",
                      })}
                    </span>
                  ) : (
                    <span className="level-note muted">
                      {TT(i18n, t, "progress.levelState.locked", {
                        sv: "Låses upp längre fram",
                        en: "Unlocks later",
                        tr: "Daha sonra açılır",
                      })}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="progress-bottom-banner">
        <div className="progress-bottom-copy">
          <span className="bottom-mini">
            {TT(i18n, t, "progress.bottom.eyebrow", {
              sv: "EARLY STAGE ADVANTAGE",
              en: "EARLY STAGE ADVANTAGE",
              tr: "ERKEN AŞAMA AVANTAJI",
            })}
          </span>
          <h2>
            {TT(i18n, t, "progress.bottom.title", {
              sv: "Det här är ett av de tidiga fönstren.",
              en: "This is one of the early windows.",
              tr: "Bu erken pencerelerden biri.",
            })}
          </h2>
          <p>
            {TT(i18n, t, "progress.bottom.body", {
              sv: "Den som kommer in tidigt ser inte bara produkter — utan riktningen, rytmen och växandet bakom dem.",
              en: "Those who enter early do not just see products — they see the direction, rhythm, and growth behind them.",
              tr: "Erken giren kişi yalnızca ürünleri değil — onların arkasındaki yönü, ritmi ve büyümeyi görür.",
            })}
          </p>
        </div>

        <div className="progress-actions">
          <Link to="/shop" className="progress-cta primary">
            {TT(i18n, t, "progress.cta.hotDrops", {
              sv: "Se heta drops",
              en: "See hot drops",
              tr: "Popüler drop’ları gör",
            })}
          </Link>
          <Link to="/surprise-boxes" className="progress-cta secondary">
            {TT(i18n, t, "progress.cta.surpriseBoxes", {
              sv: "Surprise Boxes",
              en: "Surprise Boxes",
              tr: "Surprise Boxes",
            })}
          </Link>
        </div>
      </section>

      <style>{styles}</style>
    </main>
  );
}

const styles = `
.progress-page{
  padding:24px 16px 40px;
}

.progress-hero{
  display:grid;
  grid-template-columns:1.12fr .88fr;
  gap:16px;
  margin-bottom:18px;
}

.progress-hero-copy,
.progress-live-card,
.score-card,
.insight-card,
.level-card,
.progress-bottom-banner{
  border-radius:24px;
  box-sizing:border-box;
}

.progress-hero-copy{
  padding:24px;
  background:
    radial-gradient(circle at top left, rgba(251,191,36,.10), transparent 28%),
    radial-gradient(circle at bottom right, rgba(99,102,241,.08), transparent 30%),
    linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 18px 40px rgba(15,23,42,.06);
}

.progress-kicker{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:6px 10px;
  border-radius:999px;
  background:rgba(15,23,42,.05);
  border:1px solid rgba(15,23,42,.08);
  font-size:12px;
  font-weight:1000;
  letter-spacing:.08em;
  text-transform:uppercase;
  margin-bottom:14px;
}

.progress-kicker-dot{
  width:8px;
  height:8px;
  border-radius:999px;
  background:#22c55e;
  box-shadow:0 0 0 0 rgba(34,197,94,.35);
  animation:progressPulse 1.8s infinite;
}

@keyframes progressPulse{
  0%{ box-shadow:0 0 0 0 rgba(34,197,94,.35); }
  70%{ box-shadow:0 0 0 8px rgba(34,197,94,0); }
  100%{ box-shadow:0 0 0 0 rgba(34,197,94,0); }
}

.progress-hero-title{
  margin:0 0 10px;
  font-size:clamp(30px, 4vw, 52px);
  line-height:1.02;
  letter-spacing:-.04em;
  color:#0f172a;
}

.progress-hero-body{
  margin:0;
  max-width:760px;
  font-size:15px;
  line-height:1.65;
  color:#334155;
  font-weight:700;
}

.progress-actions{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:18px;
}

.progress-cta{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:44px;
  padding:0 16px;
  border-radius:999px;
  text-decoration:none;
  font-weight:1000;
  letter-spacing:.01em;
  transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
}

.progress-cta:hover{
  transform:translateY(-1px);
}

.progress-cta.primary{
  background:linear-gradient(135deg, #0f172a, #334155);
  color:#fff;
  box-shadow:0 16px 30px rgba(15,23,42,.16);
}

.progress-cta.secondary{
  color:#0f172a;
  background:rgba(255,255,255,.7);
  border:1px solid rgba(15,23,42,.10);
}

.progress-live-card{
  padding:20px;
  color:#fff;
  background:
    radial-gradient(circle at top right, rgba(251,191,36,.16), transparent 24%),
    linear-gradient(135deg, #0f172a, #172554 55%, #312e81);
  box-shadow:0 22px 44px rgba(15,23,42,.18);
}

.progress-live-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  margin-bottom:12px;
}

.progress-phase-pill{
  display:inline-flex;
  padding:6px 10px;
  border-radius:999px;
  background:rgba(255,255,255,.10);
  border:1px solid rgba(255,255,255,.12);
  font-size:12px;
  font-weight:1000;
  letter-spacing:.06em;
  text-transform:uppercase;
}

.progress-live-pct{
  font-size:30px;
  line-height:1;
  font-weight:1000;
  letter-spacing:-.04em;
}

.progress-live-title-row{
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  gap:12px;
  margin-bottom:12px;
}

.progress-live-title-row strong{
  font-size:20px;
  line-height:1.05;
  letter-spacing:-.03em;
}

.progress-live-title-row span{
  font-size:12px;
  color:rgba(255,255,255,.72);
  font-weight:800;
  text-align:right;
}

.journey-bar{
  position:relative;
  width:100%;
  height:10px;
  border-radius:999px;
  background:rgba(15,23,42,.10);
  overflow:hidden;
}

.journey-bar.big{
  background:rgba(255,255,255,.12);
}

.journey-fill{
  height:100%;
  border-radius:999px;
  background:linear-gradient(90deg, #22c55e, #facc15, #fb923c);
  box-shadow:0 10px 24px rgba(250,204,21,.24);
  transition:width .35s ease;
}

.journey-caption{
  margin-top:10px;
  font-size:13px;
  line-height:1.5;
  color:#64748b;
}

.journey-caption.strong{
  color:rgba(255,255,255,.80);
  font-weight:700;
}

.progress-mini-grid{
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:10px;
  margin-top:16px;
}

.progress-signal{
  padding:12px;
  border-radius:16px;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.10);
}

.progress-signal-label{
  display:block;
  margin-bottom:6px;
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.08em;
  color:rgba(255,255,255,.66);
  font-weight:900;
}

.progress-signal-value{
  display:block;
  font-size:20px;
  line-height:1;
  font-weight:1000;
  letter-spacing:-.03em;
}

.progress-signal-sub{
  display:block;
  margin-top:6px;
  font-size:11px;
  color:rgba(255,255,255,.68);
  font-weight:800;
}

.progress-scoreboard{
  display:grid;
  grid-template-columns:1.1fr 1fr 1fr 1fr;
  gap:14px;
  margin-bottom:18px;
}

.score-card{
  padding:18px;
  background:linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 14px 30px rgba(15,23,42,.06);
}

.score-card.score-main{
  background:
    radial-gradient(circle at top left, rgba(99,102,241,.12), transparent 35%),
    linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
}

.score-label{
  display:block;
  font-size:12px;
  font-weight:1000;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:#64748b;
}

.score-value{
  display:block;
  margin-top:8px;
  font-size:34px;
  line-height:1;
  font-weight:1000;
  letter-spacing:-.04em;
  color:#0f172a;
}

.score-sub{
  display:block;
  margin-top:10px;
  color:#475569;
  font-size:13px;
  font-weight:800;
  line-height:1.5;
}

.progress-insight-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
  margin-bottom:20px;
}

.insight-card{
  padding:20px;
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 16px 34px rgba(15,23,42,.06);
}

.insight-card-light{
  background:linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
}

.insight-card-dark{
  color:#fff;
  background:
    radial-gradient(circle at top right, rgba(251,191,36,.14), transparent 24%),
    linear-gradient(135deg, #0f172a, #1e293b 55%, #334155);
}

.insight-eyebrow{
  display:inline-block;
  margin-bottom:10px;
  font-size:12px;
  font-weight:1000;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:inherit;
  opacity:.72;
}

.insight-card h2{
  margin:0 0 10px;
  font-size:28px;
  line-height:1.06;
  letter-spacing:-.04em;
}

.insight-card p{
  margin:0;
  font-size:14px;
  line-height:1.6;
  font-weight:700;
  color:inherit;
  opacity:.92;
}

.insight-meta-row{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:14px;
}

.insight-meta-row span{
  display:inline-flex;
  min-height:32px;
  align-items:center;
  padding:0 12px;
  border-radius:999px;
  background:rgba(15,23,42,.05);
  border:1px solid rgba(15,23,42,.08);
  font-size:12px;
  font-weight:900;
  color:#334155;
}

.signal-list{
  display:grid;
  gap:10px;
  margin-top:16px;
}

.signal-line{
  display:flex;
  justify-content:space-between;
  gap:10px;
  padding:10px 0;
  border-bottom:1px solid rgba(255,255,255,.10);
}

.signal-line:last-child{
  border-bottom:none;
}

.signal-line span{
  color:rgba(255,255,255,.72);
  font-size:13px;
  font-weight:800;
}

.signal-line strong{
  color:#fff;
  font-size:13px;
  font-weight:1000;
  text-align:right;
}

.levels{
  margin-bottom:22px;
}

.levels-head{
  margin-bottom:14px;
}

.progress-title{
  margin:0 0 6px;
  font-size:28px;
  line-height:1.06;
  letter-spacing:-.04em;
  color:#0f172a;
}

.progress-intro{
  margin:0;
  max-width:760px;
  color:#475569;
  font-size:14px;
  line-height:1.6;
  font-weight:700;
}

.level-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));
  gap:14px;
}

.level-card{
  padding:16px;
  border:1px solid rgba(15,23,42,.08);
  background:linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
  box-shadow:0 14px 30px rgba(15,23,42,.05);
}

.level-head{
  display:flex;
  gap:10px;
  align-items:flex-start;
  margin-bottom:10px;
}

.level-num{
  width:30px;
  height:30px;
  border-radius:999px;
  border:1px solid rgba(15,23,42,.10);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:13px;
  font-weight:1000;
  color:#0f172a;
  flex:0 0 auto;
}

.level-title-row{
  display:flex;
  justify-content:space-between;
  gap:10px;
  flex:1;
  align-items:flex-start;
}

.level-title{
  margin:0;
  font-size:16px;
  line-height:1.2;
  font-weight:900;
  color:#0f172a;
}

.level-badge{
  display:inline-flex;
  align-items:center;
  min-height:24px;
  padding:0 10px;
  border-radius:999px;
  background:#f3f4f6;
  color:#4b5563;
  font-size:11px;
  font-weight:1000;
  text-transform:uppercase;
  letter-spacing:.05em;
  white-space:nowrap;
}

.level-body{
  margin:0;
  font-size:14px;
  line-height:1.6;
  color:#475569;
  font-weight:700;
}

.level-footer{
  margin-top:12px;
}

.level-note{
  display:inline-flex;
  align-items:center;
  min-height:28px;
  padding:0 10px;
  border-radius:999px;
  font-size:12px;
  font-weight:900;
}

.level-note.good{
  background:rgba(34,197,94,.10);
  color:#166534;
}

.level-note.active{
  background:rgba(59,130,246,.10);
  color:#1d4ed8;
}

.level-note.muted{
  background:#f8fafc;
  color:#64748b;
}

.level-done .level-badge{
  background:#dcfce7;
  color:#166534;
}

.level-active{
  border-color:rgba(75,107,250,.36);
  box-shadow:0 18px 40px rgba(75,107,250,.16);
}

.level-active .level-badge{
  background:#eff6ff;
  color:#1d4ed8;
}

.level-locked{
  opacity:.76;
}

.progress-bottom-banner{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
  padding:24px;
  background:
    radial-gradient(circle at top left, rgba(251,191,36,.10), transparent 28%),
    linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 18px 34px rgba(15,23,42,.06);
}

.bottom-mini{
  display:inline-block;
  margin-bottom:8px;
  font-size:12px;
  font-weight:1000;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:#64748b;
}

.progress-bottom-copy h2{
  margin:0 0 8px;
  font-size:clamp(24px, 3vw, 34px);
  line-height:1.06;
  letter-spacing:-.03em;
  color:#0f172a;
}

.progress-bottom-copy p{
  margin:0;
  max-width:720px;
  color:#334155;
  line-height:1.6;
  font-size:15px;
  font-weight:700;
}

.theme-dark .progress-hero-copy,
.theme-dark .score-card,
.theme-dark .insight-card-light,
.theme-dark .level-card,
.theme-dark .progress-bottom-banner{
  background:linear-gradient(135deg, #020617, #0f172a);
  border-color:#1f2937;
  box-shadow:0 18px 40px rgba(0,0,0,.70);
}

.theme-dark .progress-hero-title,
.theme-dark .score-value,
.theme-dark .progress-title,
.theme-dark .level-title,
.theme-dark .progress-bottom-copy h2,
.theme-dark .level-num{
  color:#f8fafc;
}

.theme-dark .progress-hero-body,
.theme-dark .score-sub,
.theme-dark .progress-intro,
.theme-dark .level-body,
.theme-dark .progress-bottom-copy p{
  color:#cbd5e1;
}

.theme-dark .progress-kicker,
.theme-dark .insight-meta-row span{
  background:rgba(255,255,255,.05);
  border-color:rgba(255,255,255,.08);
  color:#e2e8f0;
}

.theme-dark .score-label,
.theme-dark .bottom-mini{
  color:#94a3b8;
}

.theme-dark .level-badge{
  background:#111827;
  color:#e5e7eb;
}

.theme-dark .level-note.muted{
  background:#111827;
  color:#94a3b8;
}

@media (max-width:1120px){
  .progress-hero,
  .progress-insight-grid{
    grid-template-columns:1fr;
  }

  .progress-scoreboard{
    grid-template-columns:repeat(2, minmax(0,1fr));
  }

  .progress-bottom-banner{
    flex-direction:column;
    align-items:flex-start;
  }
}

@media (max-width:640px){
  .progress-page{
    padding:16px 12px 32px;
  }

  .progress-hero-copy,
  .progress-live-card,
  .score-card,
  .insight-card,
  .level-card,
  .progress-bottom-banner{
    border-radius:20px;
  }

  .progress-hero-copy,
  .progress-live-card,
  .score-card,
  .insight-card,
  .progress-bottom-banner{
    padding:18px;
  }

  .progress-scoreboard,
  .progress-mini-grid{
    grid-template-columns:1fr;
  }

  .progress-live-title-row,
  .level-title-row{
    flex-direction:column;
    align-items:flex-start;
  }

  .progress-actions .progress-cta{
    width:100%;
  }
}

@media (prefers-reduced-motion:reduce){
  .progress-kicker-dot{
    animation:none;
  }

  .progress-cta,
  .journey-fill{
    transition:none;
  }
}
`;