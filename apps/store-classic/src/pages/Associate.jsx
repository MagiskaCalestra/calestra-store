// D:\WebProjects\Calestra\apps\store-classic\src\pages\Associate.jsx

import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useCurrency } from "../context/CurrencyContext.jsx";
import { formatMoney, convertFromSEK } from "../utils/money.js";
import { TT } from "../i18n/tt.js";

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clean(v, max = 500) {
  return String(v || "").trim().slice(0, max);
}

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, num(v, min)));
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(v, 320));
}

function getLang(i18n) {
  const raw = String(i18n?.resolvedLanguage || i18n?.language || "sv").toLowerCase();
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("tr")) return "tr";
  return "sv";
}

function pickLang(i18n, values = {}) {
  const lang = getLang(i18n);
  return values[lang] || values.sv || values.en || values.tr || "";
}

function getLocale(i18n, fallback = "sv-SE") {
  const lang = getLang(i18n);
  if (lang === "en") return "en-US";
  if (lang === "tr") return "tr-TR";
  return fallback || "sv-SE";
}

function getAssociatePhaseLabel(i18n, step) {
  const map = {
    1: { sv: "First Light", en: "First Light", tr: "First Light" },
    2: { sv: "Founders’ Circle", en: "Founders’ Circle", tr: "Founders’ Circle" },
    3: { sv: "Signal Wave", en: "Signal Wave", tr: "Signal Wave" },
    4: { sv: "Brand Pulse", en: "Brand Pulse", tr: "Brand Pulse" },
    5: { sv: "Creator Momentum", en: "Creator Momentum", tr: "Creator Momentum" },
    6: { sv: "C-Lux™ Readiness", en: "C-Lux™ Readiness", tr: "C-Lux™ Readiness" },
    7: { sv: "Calestra World Path", en: "Calestra World Path", tr: "Calestra World Path" },
  };

  return pickLang(i18n, map[num(step, 1)] || map[1]);
}

function ProgressMiniStat({ label, value, sub }) {
  return (
    <div className="progress-mini-stat">
      <span className="label">{label}</span>
      <strong>{value}</strong>
      {sub ? <span className="sub">{sub}</span> : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="label">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function Associate() {
  const { t, i18n } = useTranslation();
  const { currency, locale, rates } = useCurrency();

  const tx = React.useCallback(
    (key, fallbackByLang) => TT(i18n, t, key, fallbackByLang),
    [i18n, t]
  );

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    instagram: "",
    tiktok: "",
    audienceSize: "",
    niche: "",
    message: "",
  });

  const [selectedTier, setSelectedTier] = React.useState("support");
  const [loading, setLoading] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [mailInfo, setMailInfo] = React.useState("");

  const [progressLoading, setProgressLoading] = React.useState(true);
  const [progress, setProgress] = React.useState(null);
  const [progressError, setProgressError] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    async function loadProgress() {
      setProgressLoading(true);
      setProgressError("");

      try {
        const res = await fetch("/api/progress", {
          headers: { accept: "application/json" },
          cache: "no-store",
          signal: ctrl.signal,
        });

        const json = await res.json().catch(() => null);
        if (!alive) return;

        if (res.ok && json?.ok) {
          setProgress(json);
        } else {
          setProgressError(
            tx("assoc.progress.localMode", {
              sv: "Progress visas i lokalt läge just nu.",
              en: "Progress is shown in local mode right now.",
              tr: "Progress şu anda yerel modda gösteriliyor.",
            })
          );
        }
      } catch (e) {
        if (String(e?.name || "") === "AbortError") return;

        if (alive) {
          setProgressError(
            tx("assoc.progress.error", {
              sv: "Progress kunde inte hämtas just nu.",
              en: "Progress could not be loaded right now.",
              tr: "Progress şu anda yüklenemedi.",
            })
          );
        }
      } finally {
        if (alive) setProgressLoading(false);
      }
    }

    loadProgress();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [tx]);

  const tiers = React.useMemo(
    () => [
      {
        id: "support",
        badgeKey: "assoc.tier.supportBadge",
        labelKey: "assoc.tier.support",
        descKey: "assoc.tier.supportDesc",
        priceSEK: 0,
        highlight: "soft",
        fallback: {
          badge: { sv: "Kostnadsfritt", en: "Free", tr: "Ücretsiz" },
          label: { sv: "Support", en: "Support", tr: "Support" },
          desc: {
            sv: "Låg tröskel. För dig som vill vara med tidigt och öppna dörren till något större.",
            en: "Low threshold. For those who want to join early and open the door to something bigger.",
            tr: "Düşük eşik. Erken katılıp daha büyük bir şeye kapı açmak isteyenler için.",
          },
        },
      },
      {
        id: "gold",
        badgeKey: "assoc.tier.goldBadge",
        labelKey: "assoc.tier.gold",
        descKey: "assoc.tier.goldDesc",
        priceSEK: 299,
        highlight: "primary",
        fallback: {
          badge: { sv: "Mest vald", en: "Most chosen", tr: "En çok seçilen" },
          label: { sv: "Gold", en: "Gold", tr: "Gold" },
          desc: {
            sv: "För dig som vill stå närmare första vågen och vara tydligt med från början.",
            en: "For those who want to stand closer to the first wave and be clearly present from the beginning.",
            tr: "İlk dalgaya daha yakın durmak ve erken tarafta görünür olmak isteyenler için.",
          },
        },
      },
      {
        id: "clux",
        badgeKey: "assoc.tier.luxeBadge",
        labelKey: "assoc.tier.luxe",
        descKey: "assoc.tier.luxeDesc",
        priceSEK: null,
        highlight: "outline",
        fallback: {
          badge: { sv: "Begränsad", en: "Limited", tr: "Sınırlı" },
          label: { sv: "C-Lux™", en: "C-Lux™", tr: "C-Lux™" },
          desc: {
            sv: "För personer med starkare räckvidd eller särskild matchning för nästa nivå.",
            en: "For people with stronger reach or a special match for the next level.",
            tr: "Daha güçlü erişimi olan veya sonraki seviye için özel uyumu bulunan kişiler için.",
          },
        },
      },
    ],
    []
  );

  function tierLabel(tier) {
    return tx(tier.labelKey, tier.fallback.label);
  }

  function tierBadge(tier) {
    return tx(tier.badgeKey, tier.fallback.badge);
  }

  function tierDesc(tier) {
    return tx(tier.descKey, tier.fallback.desc);
  }

  function priceLabel(tier) {
    if (tier.priceSEK == null) {
      return tx("assoc.tier.luxePrice", {
        sv: "På förfrågan",
        en: "On request",
        tr: "Talep üzerine",
      });
    }

    const converted = convertFromSEK(tier.priceSEK, currency, rates);

    return (
      <>
        {formatMoney(converted, currency, locale || getLocale(i18n))}{" "}
        <span className="per">
          {tx("assoc.perYear", {
            sv: "symboliskt",
            en: "symbolic",
            tr: "sembolik",
          })}
        </span>
      </>
    );
  }

  const selectedTierObj = tiers.find((x) => x.id === selectedTier) || tiers[0];

  const rawSummary = progress?.summary || {};
  const currentStep = num(rawSummary.currentStep, 2);
  const totalSteps = num(rawSummary.totalSteps, 7);
  const progressPct = clamp(rawSummary.progressPct, 0, 100);

  const currentLabel = getAssociatePhaseLabel(i18n, currentStep);
  const nextLabel = getAssociatePhaseLabel(i18n, Math.min(currentStep + 1, totalSteps));

  const narrative = progress?.narrative || {
    body: tx("assoc.progress.fallback.body", {
      sv: "Calestra växer genom verklig aktivitet, tidiga signaler och människor som går in före den stora vågen.",
      en: "Calestra grows through real activity, early signals, and people who step in before the big wave.",
      tr: "Calestra gerçek hareket, erken sinyaller ve büyük dalgadan önce içeri giren insanlarla büyür.",
    }),
    caption: tx("assoc.progress.fallback.caption", {
      sv: "När fler signaler samlas låses nästa nivå upp.",
      en: "As more signals gather, the next level unlocks.",
      tr: "Daha fazla sinyal toplandıkça sonraki seviye açılır.",
    }),
  };

  const signals = progress?.signals || {};
  const ordersCount = num(signals.ordersCount, 0);
  const subscribersActive = num(signals.subscribersActive, 0);
  const recoveredOrders = num(signals.recoveredOrders, 0);

  const socialProof =
    ordersCount > 0
      ? pickLang(i18n, {
          sv: `${ordersCount} ordrar har redan satt rörelsen i gång.`,
          en: `${ordersCount} orders have already started the movement.`,
          tr: `${ordersCount} sipariş hareketi şimdiden başlattı.`,
        })
      : subscribersActive > 0
        ? pickLang(i18n, {
            sv: `${subscribersActive} personer följer redan utvecklingen.`,
            en: `${subscribersActive} people are already following the development.`,
            tr: `${subscribersActive} kişi gelişimi şimdiden takip ediyor.`,
          })
        : tx("assoc.socialProof.early", {
            sv: "Det här är ett tidigt fönster — Associate-spåret öppnar närheten före den breda vågen.",
            en: "This is an early window — the Associate path opens closeness before the wider wave.",
            tr: "Bu erken bir pencere — Associate yolu, büyük dalgadan önce yakınlık açar.",
          });

  const progressActiveText = pickLang(i18n, {
    sv: `${currentLabel} pågår nu`,
    en: `${currentLabel} is active now`,
    tr: `${currentLabel} şu anda aktif`,
  });

  const progressStepOfText = pickLang(i18n, {
    sv: `Steg ${currentStep} av ${totalSteps} • Nästa: ${nextLabel}`,
    en: `Step ${currentStep} of ${totalSteps} • Next: ${nextLabel}`,
    tr: `Adım ${currentStep} / ${totalSteps} • Sonraki: ${nextLabel}`,
  });

  const progressPercentAria = pickLang(i18n, {
    sv: `Progress ${Math.round(progressPct)} procent`,
    en: `Progress ${Math.round(progressPct)} percent`,
    tr: `Progress yüzde ${Math.round(progressPct)}`,
  });

  const L = {
    heroKicker: tx("assoc.hero.kicker", {
      sv: "EARLY ACCESS • ASSOCIATE",
      en: "EARLY ACCESS • ASSOCIATE",
      tr: "ERKEN ERİŞİM • ASSOCIATE",
    }),
    title: tx("assoc.title", {
      sv: "Bli Associate",
      en: "Become an Associate",
      tr: "Associate ol",
    }),
    lead: tx("assoc.lead", {
      sv: "Ett första steg för dig som vill stå närmare Calestra tidigt. Skicka in ditt intresse, välj spår och låt oss bedöma matchningen i nästa våg.",
      en: "A first step for you who want to stand closer to Calestra early. Send your interest, choose a path, and let us review the match in the next wave.",
      tr: "Calestra’ya erken dönemde daha yakın olmak isteyenler için ilk adım. İlginizi gönderin, yolunuzu seçin ve sonraki dalgada uyumu değerlendirelim.",
    }),
    badgeEarly: tx("assoc.badges.early", {
      sv: "⭐ Tidig position",
      en: "⭐ Early position",
      tr: "⭐ Erken konum",
    }),
    badgeBenefits: tx("assoc.badges.benefits", {
      sv: "🎁 Förmåner vid matchning",
      en: "🎁 Benefits if matched",
      tr: "🎁 Uyum olursa avantajlar",
    }),
    badgePath: tx("assoc.badges.path", {
      sv: "✨ Möjlig väg till affiliate / creator",
      en: "✨ Possible path to affiliate / creator",
      tr: "✨ Affiliate / creator yoluna açılabilir",
    }),
    progressAria: tx("assoc.progress.aria", {
      sv: "Live progress",
      en: "Live progress",
      tr: "Canlı progress",
    }),
    progressLoading: tx("assoc.progress.loading", {
      sv: "Läser live progress…",
      en: "Reading live progress…",
      tr: "Canlı progress okunuyor…",
    }),
    progressTitle: tx("assoc.progress.title", {
      sv: "Det här formuläret matar in i Calestras growth-motor.",
      en: "This form feeds into Calestra’s growth engine.",
      tr: "Bu form Calestra’nın growth motoruna veri sağlar.",
    }),
    progressLoadingBody: tx("assoc.progress.loadingBody", {
      sv: "Vi hämtar den senaste live-progressen.",
      en: "We are loading the latest live progress.",
      tr: "En güncel canlı progress yükleniyor.",
    }),
    progressLoadingSignals: tx("assoc.progress.loadingSignals", {
      sv: "Hämtar signaler…",
      en: "Loading signals…",
      tr: "Sinyaller yükleniyor…",
    }),
    progressLoadingData: tx("assoc.progress.loadingData", {
      sv: "Hämtar live data…",
      en: "Loading live data…",
      tr: "Canlı veri yükleniyor…",
    }),
    progressDefaultCaption: tx("assoc.progress.defaultCaption", {
      sv: "När nästa nivå nås öppnas nästa fas.",
      en: "When the next level is reached, the next phase opens.",
      tr: "Sonraki seviyeye ulaşıldığında yeni faz açılır.",
    }),
    statOrders: tx("assoc.stats.orders", {
      sv: "Ordrar",
      en: "Orders",
      tr: "Siparişler",
    }),
    statOrdersSub: tx("assoc.stats.ordersSub", {
      sv: "verklig signal",
      en: "real signal",
      tr: "gerçek sinyal",
    }),
    statSubscribers: tx("assoc.stats.subscribers", {
      sv: "Subscribers",
      en: "Subscribers",
      tr: "Aboneler",
    }),
    statSubscribersSub: tx("assoc.stats.subscribersSub", {
      sv: "tidig publik",
      en: "early audience",
      tr: "erken kitle",
    }),
    statRecovery: tx("assoc.stats.recovery", {
      sv: "Recovery",
      en: "Recovery",
      tr: "Recovery",
    }),
    statRecoverySub: tx("assoc.stats.recoverySub", {
      sv: "återställda köp",
      en: "recovered purchases",
      tr: "geri kazanılan alışverişler",
    }),
    tiersAria: tx("assoc.tiers.aria", {
      sv: "Välj Associate-nivå",
      en: "Choose Associate tier",
      tr: "Associate seviyesini seç",
    }),
    priceNote: tx("assoc.priceNote", {
      sv: "Du väljer spår nu. Slutlig matchning och eventuella nästa steg sköts i bakgrunden.",
      en: "You choose a path now. Final matching and possible next steps are handled in the background.",
      tr: "Şimdi yolu seçiyorsunuz. Nihai eşleşme ve olası sonraki adımlar arka planda yönetilir.",
    }),
    joinTitle: tx("assoc.join.title", {
      sv: "Skicka in ditt intresse",
      en: "Send your interest",
      tr: "İlginizi gönderin",
    }),
    selectedTier: tx("assoc.join.selectedTier", {
      sv: "Du har valt:",
      en: "You selected:",
      tr: "Seçiminiz:",
    }),
    name: tx("form.name", { sv: "Namn", en: "Name", tr: "Ad" }),
    namePlaceholder: tx("assoc.form.namePlaceholder", {
      sv: "Ditt namn",
      en: "Your name",
      tr: "Adınız",
    }),
    email: tx("form.email", { sv: "E-post", en: "Email", tr: "E-posta" }),
    emailPlaceholder: tx("assoc.form.emailPlaceholder", {
      sv: "Din e-post",
      en: "Your email",
      tr: "E-postanız",
    }),
    instagram: "Instagram",
    tiktok: "TikTok",
    socialPlaceholder: tx("assoc.form.socialPlaceholder", {
      sv: "@dittkonto",
      en: "@youraccount",
      tr: "@hesabınız",
    }),
    audience: tx("assoc.form.audience", {
      sv: "Ungefärlig publik",
      en: "Approximate audience",
      tr: "Yaklaşık kitle",
    }),
    audiencePlaceholder: tx("assoc.form.audiencePlaceholder", {
      sv: "t.ex. 1k, 10k, 50k",
      en: "e.g. 1k, 10k, 50k",
      tr: "örn. 1k, 10k, 50k",
    }),
    niche: tx("assoc.form.niche", {
      sv: "Nisch",
      en: "Niche",
      tr: "Niş",
    }),
    nichePlaceholder: tx("assoc.form.nichePlaceholder", {
      sv: "mode, familj, livsstil, resor…",
      en: "fashion, family, lifestyle, travel…",
      tr: "moda, aile, yaşam tarzı, seyahat…",
    }),
    message: tx("assoc.form.message", {
      sv: "Kort meddelande",
      en: "Short message",
      tr: "Kısa mesaj",
    }),
    messagePlaceholder: tx("assoc.form.messagePlaceholder", {
      sv: "Berätta kort varför du vill vara med tidigt.",
      en: "Briefly tell us why you want to join early.",
      tr: "Neden erken katılmak istediğinizi kısaca anlatın.",
    }),
    submitLoading: tx("assoc.form.sending", {
      sv: "Skickar…",
      en: "Sending…",
      tr: "Gönderiliyor…",
    }),
    submit: tx("assoc.form.submit", {
      sv: "Skicka intresse",
      en: "Send interest",
      tr: "İlgi gönder",
    }),
    successMail: tx("assoc.form.successMail", {
      sv: "Bekräftelse skickad till din e-post.",
      en: "Confirmation sent to your email.",
      tr: "Onay e-postanıza gönderildi.",
    }),
    success: tx("assoc.form.success", {
      sv: "Din ansökan är mottagen.",
      en: "Your application has been received.",
      tr: "Başvurunuz alındı.",
    }),
    missingEmail: tx("assoc.form.missingEmail", {
      sv: "Skriv din e-post.",
      en: "Enter your email.",
      tr: "E-postanızı yazın.",
    }),
    invalidEmail: tx("form.emailInvalid", {
      sv: "Ogiltig e-postadress.",
      en: "Invalid email address.",
      tr: "Geçersiz e-posta adresi.",
    }),
    fail: tx("form.fail", {
      sv: "Kunde inte spara just nu. Försök igen senare.",
      en: "Could not save right now. Please try again later.",
      tr: "Şu anda kaydedilemedi. Lütfen daha sonra tekrar deneyin.",
    }),
    fine1: tx("assoc.form.fine1", {
      sv: "Vi använder uppgifterna för att bedöma tidig matchning, framtida kontakt och eventuell onboarding till associate / affiliate / creator längre fram.",
      en: "We use the details to assess early matching, future contact, and possible onboarding to associate / affiliate / creator later on.",
      tr: "Bilgileri erken eşleşme, gelecekte iletişim ve ileride associate / affiliate / creator sürecine olası katılım için kullanırız.",
    }),
    fine2: tx("assoc.form.fine2", {
      sv: "Det här är en intresseanmälan. Ingen betalning sker här.",
      en: "This is an expression of interest. No payment happens here.",
      tr: "Bu bir ilgi başvurusudur. Burada ödeme yapılmaz.",
    }),
    codeFlowTitle: tx("assoc.codeFlow.title", {
      sv: "Hur koden fungerar efter godkännande",
      en: "How the code works after approval",
      tr: "Onaydan sonra kod nasıl çalışır",
    }),
    codeFlowLead: tx("assoc.codeFlow.lead", {
      sv: "När en person godkänns kan admin tilldela en personlig kod. Koden kan sedan visas i Mitt Calestra, skickas i bekräftelsemejl och användas i kampanjer, bio, QR, video eller inlägg.",
      en: "When a person is approved, admin can assign a personal code. The code can then be shown in Mitt Calestra, sent in the confirmation email, and used in campaigns, bio, QR, video or posts.",
      tr: "Bir kişi onaylandığında admin kişisel bir kod atayabilir. Kod daha sonra Benim Calestra’da gösterilebilir, onay e-postasında gönderilebilir ve kampanya, bio, QR, video veya gönderilerde kullanılabilir.",
    }),
    codeFlow1Title: tx("assoc.codeFlow.step1.title", {
      sv: "1. Influencern delar kod eller länk",
      en: "1. The influencer shares the code or link",
      tr: "1. Influencer kodu veya bağlantıyı paylaşır",
    }),
    codeFlow1Body: tx("assoc.codeFlow.step1.body", {
      sv: "Exempel: ?ref=KOD eller ?associate=KOD. Koden kan också skrivas manuellt i ett framtida kodfält.",
      en: "Example: ?ref=CODE or ?associate=CODE. The code can also be entered manually in a future code field.",
      tr: "Örnek: ?ref=KOD veya ?associate=KOD. Kod ileride manuel kod alanına da yazılabilir.",
    }),
    codeFlow2Title: tx("assoc.codeFlow.step2.title", {
      sv: "2. Kunden kopplas till rätt person",
      en: "2. The customer is connected to the right person",
      tr: "2. Müşteri doğru kişiye bağlanır",
    }),
    codeFlow2Body: tx("assoc.codeFlow.step2.body", {
      sv: "När kunden handlar sparas associateCode / creatorCode / affiliateCode i orderns metadata.",
      en: "When the customer purchases, associateCode / creatorCode / affiliateCode is saved in the order metadata.",
      tr: "Müşteri alışveriş yaptığında associateCode / creatorCode / affiliateCode sipariş metadata’sına kaydedilir.",
    }),
    codeFlow3Title: tx("assoc.codeFlow.step3.title", {
      sv: "3. Admin ser resultatet",
      en: "3. Admin sees the result",
      tr: "3. Admin sonucu görür",
    }),
    codeFlow3Body: tx("assoc.codeFlow.step3.body", {
      sv: "Därefter kan ni räkna provision, rabatt, poäng, bonus eller belöning enligt era regler.",
      en: "After that, you can calculate commission, discount, points, bonus or reward according to your rules.",
      tr: "Sonrasında kurallarınıza göre komisyon, indirim, puan, bonus veya ödül hesaplanabilir.",
    }),
    faqTitle: tx("assoc.faq.title", {
      sv: "Vanliga frågor",
      en: "Frequently asked questions",
      tr: "Sık sorulan sorular",
    }),
    faq1Q: tx("assoc.faq.influencer.q", {
      sv: "Behöver jag vara stor influencer?",
      en: "Do I need to be a big influencer?",
      tr: "Büyük bir influencer olmam gerekir mi?",
    }),
    faq1A: tx("assoc.faq.influencer.a", {
      sv: "Nej. I den här fasen letar vi främst efter rätt känsla, timing och potential — inte bara stora siffror.",
      en: "No. In this phase, we mainly look for the right feeling, timing, and potential — not just big numbers.",
      tr: "Hayır. Bu aşamada yalnızca büyük rakamlara değil, doğru hisse, zamana ve potansiyele bakıyoruz.",
    }),
    faq2Q: tx("assoc.faq.reply.q", {
      sv: "Får jag svar direkt?",
      en: "Will I get an answer immediately?",
      tr: "Hemen cevap alır mıyım?",
    }),
    faq2A: tx("assoc.faq.reply.a", {
      sv: "Formuläret sparas direkt i systemet. Om mail är aktivt får du en bekräftelse via e-post. Själva uppföljningen sker manuellt när vi väljer nästa våg.",
      en: "The form is saved directly in the system. If email is active, you receive a confirmation by email. The actual follow-up is handled manually when we choose the next wave.",
      tr: "Form doğrudan sisteme kaydedilir. E-posta aktifse onay e-postası alırsınız. Asıl takip, sonraki dalga seçildiğinde manuel yapılır.",
    }),
    faq3Q: tx("assoc.faq.after.q", {
      sv: "Vad händer efter att jag skickat in?",
      en: "What happens after I submit?",
      tr: "Gönderdikten sonra ne olur?",
    }),
    faq3A: tx("assoc.faq.after.a", {
      sv: "Din ansökan går in i adminpanelen under Associate Leads. Där kan vi följa upp, anteckna och senare konvertera dig till affiliate eller creator om det passar.",
      en: "Your application goes into the admin panel under Associate Leads. From there we can follow up, add notes, and later convert you to affiliate or creator if it fits.",
      tr: "Başvurunuz admin panelinde Associate Leads altına girer. Oradan takip edebilir, not ekleyebilir ve uygunsa daha sonra affiliate veya creator’a dönüştürebiliriz.",
    }),
    faq4Q: tx("assoc.faq.code.q", {
      sv: "Får jag en personlig kod?",
      en: "Will I get a personal code?",
      tr: "Kişisel kod alacak mıyım?",
    }),
    faq4A: tx("assoc.faq.code.a", {
      sv: "Efter godkännande kan admin ge dig en personlig kod. När systemet är kopplat fullt ut kan koden visas i Mitt Calestra och skickas via e-post. Kunden använder länken eller koden, och ordern märks med rätt associate.",
      en: "After approval, admin can give you a personal code. When the system is fully connected, the code can be shown in Mitt Calestra and sent by email. The customer uses the link or code, and the order is tagged with the correct associate.",
      tr: "Onaydan sonra admin size kişisel bir kod verebilir. Sistem tamamen bağlandığında kod Benim Calestra’da gösterilebilir ve e-posta ile gönderilebilir. Müşteri bağlantıyı veya kodu kullanır, sipariş doğru associate ile işaretlenir.",
    }),
    backShop: tx("assoc.back.shop", {
      sv: "← Tillbaka till butiken",
      en: "← Back to the shop",
      tr: "← Mağazaya dön",
    }),
    backProgress: tx("assoc.back.progress", {
      sv: "Se hur långt resan kommit",
      en: "See how far the journey has come",
      tr: "Yolculuğun ne kadar ilerlediğini gör",
    }),
  };

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();

    setErr("");
    setOk(false);
    setMailInfo("");

    const email = clean(form.email, 320).toLowerCase();
    const name = clean(form.name, 160);

    if (!email) {
      setErr(L.missingEmail);
      return;
    }

    if (!isValidEmail(email)) {
      setErr(L.invalidEmail);
      return;
    }

    setLoading(true);

    const payload = {
      name,
      email,
      tier: selectedTier,
      currency,
      source: "assoc-page",
      sourceChannel: "associate_form",
      progressPhase: currentLabel || "lead_captured",
      progressPct,
      locale: locale || getLocale(i18n),
      instagram: clean(form.instagram, 160),
      tiktok: clean(form.tiktok, 160),
      audienceSize: clean(form.audienceSize, 80),
      niche: clean(form.niche, 120),
      message: clean(form.message, 1200),
      lang: getLang(i18n),
      ts: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/associate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.detail || json?.error || `HTTP ${res.status}`);
      }

      setOk(true);
      setForm({
        name: "",
        email: "",
        instagram: "",
        tiktok: "",
        audienceSize: "",
        niche: "",
        message: "",
      });

      setMailInfo(json?.mail?.applicant?.ok ? L.successMail : L.success);
    } catch {
      setErr(L.fail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container assoc" role="main">
      <header className="hero">
        <div className="hero-kicker">
          <span className="hero-dot" />
          <span>{L.heroKicker}</span>
        </div>

        <h1>{L.title}</h1>

        <p className="lead">{L.lead}</p>

        <div className="badges">
          <span>{L.badgeEarly}</span>
          <span>{L.badgeBenefits}</span>
          <span>{L.badgePath}</span>
        </div>
      </header>

      <section className="assoc-progress-band" aria-label={L.progressAria}>
        <div className="assoc-progress-copy">
          <div className="assoc-progress-eyebrow">
            {progressLoading ? L.progressLoading : progressError || progressActiveText}
          </div>

          <h2>{L.progressTitle}</h2>

          <p>{progressLoading ? L.progressLoadingBody : narrative.body}</p>

          <div className="assoc-proof">
            <div className="proof-line">{socialProof}</div>
            <div className="proof-line muted">
              {progressLoading ? L.progressLoadingSignals : progressStepOfText}
            </div>
          </div>
        </div>

        <div className="assoc-progress-card">
          <div className="assoc-progress-top">
            <span className="phase-pill">{currentLabel}</span>
            <strong>{Math.round(progressPct)}%</strong>
          </div>

          <div className="progress-bar" aria-label={progressPercentAria}>
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="progress-caption">
            {progressLoading ? L.progressLoadingData : narrative.caption || L.progressDefaultCaption}
          </div>

          <div className="progress-mini-grid">
            <ProgressMiniStat label={L.statOrders} value={ordersCount} sub={L.statOrdersSub} />
            <ProgressMiniStat label={L.statSubscribers} value={subscribersActive} sub={L.statSubscribersSub} />
            <ProgressMiniStat label={L.statRecovery} value={recoveredOrders} sub={L.statRecoverySub} />
          </div>
        </div>
      </section>

      <section className="tiers" role="radiogroup" aria-label={L.tiersAria}>
        {tiers.map((tier) => {
          const isSelected = tier.id === selectedTier;

          return (
            <button
              key={tier.id}
              type="button"
              className={["tier-card", isSelected ? "selected" : "", tier.highlight === "primary" ? "hit" : ""]
                .filter(Boolean)
                .join(" ")}
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedTier(tier.id)}
            >
              <div className="tier-top">
                <h3>{tierLabel(tier)}</h3>
                <span className={`pill pill--${tier.highlight}`}>{tierBadge(tier)}</span>
              </div>

              <p className="tier-desc">{tierDesc(tier)}</p>
              <div className="price">{priceLabel(tier)}</div>
            </button>
          );
        })}
      </section>

      <div className="price-note">{L.priceNote}</div>

      <section className="join">
        <h2>{L.joinTitle}</h2>
        <p className="selected-tier">
          {L.selectedTier} <strong>{tierLabel(selectedTierObj)}</strong>
        </p>

        <form onSubmit={submit} className="form">
          <div className="form-grid">
            <Field label={L.name}>
              <input
                type="text"
                placeholder={L.namePlaceholder}
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                autoComplete="name"
              />
            </Field>

            <Field label={L.email}>
              <input
                type="email"
                placeholder={L.emailPlaceholder}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                autoComplete="email"
                required
              />
            </Field>
          </div>

          <div className="form-grid">
            <Field label={L.instagram}>
              <input
                type="text"
                placeholder={L.socialPlaceholder}
                value={form.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
              />
            </Field>

            <Field label={L.tiktok}>
              <input
                type="text"
                placeholder={L.socialPlaceholder}
                value={form.tiktok}
                onChange={(e) => updateField("tiktok", e.target.value)}
              />
            </Field>
          </div>

          <div className="form-grid">
            <Field label={L.audience}>
              <input
                type="text"
                placeholder={L.audiencePlaceholder}
                value={form.audienceSize}
                onChange={(e) => updateField("audienceSize", e.target.value)}
              />
            </Field>

            <Field label={L.niche}>
              <input
                type="text"
                placeholder={L.nichePlaceholder}
                value={form.niche}
                onChange={(e) => updateField("niche", e.target.value)}
              />
            </Field>
          </div>

          <Field label={L.message}>
            <textarea
              rows={5}
              placeholder={L.messagePlaceholder}
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
            />
          </Field>

          <button className="cta" disabled={loading} type="submit">
            {loading ? L.submitLoading : L.submit}
          </button>

          {ok ? <div className="ok">{mailInfo || L.success}</div> : null}
          {err ? <div className="err">{err}</div> : null}

          <small className="fine">{L.fine1}</small>
          <small className="fine">{L.fine2}</small>
        </form>
      </section>

      <section className="code-flow">
        <div className="code-flow-head">
          <h2>{L.codeFlowTitle}</h2>
          <p>{L.codeFlowLead}</p>
        </div>

        <div className="code-flow-grid">
          <article className="code-flow-card">
            <strong>{L.codeFlow1Title}</strong>
            <p>{L.codeFlow1Body}</p>
          </article>

          <article className="code-flow-card">
            <strong>{L.codeFlow2Title}</strong>
            <p>{L.codeFlow2Body}</p>
          </article>

          <article className="code-flow-card">
            <strong>{L.codeFlow3Title}</strong>
            <p>{L.codeFlow3Body}</p>
          </article>
        </div>
      </section>

      <section className="faq">
        <h2>{L.faqTitle}</h2>

        <details>
          <summary>{L.faq1Q}</summary>
          <p>{L.faq1A}</p>
        </details>

        <details>
          <summary>{L.faq2Q}</summary>
          <p>{L.faq2A}</p>
        </details>

        <details>
          <summary>{L.faq3Q}</summary>
          <p>{L.faq3A}</p>
        </details>

        <details>
          <summary>{L.faq4Q}</summary>
          <p>{L.faq4A}</p>
        </details>
      </section>

      <section className="back">
        <div className="back-buttons">
          <Link to="/shop" className="ghost">
            {L.backShop}
          </Link>
          <Link to="/progress" className="ghost ghost-alt">
            {L.backProgress}
          </Link>
        </div>
      </section>

      <style>{styles}</style>
    </main>
  );
}

const styles = `
.assoc{
  max-width:1040px;
  margin:0 auto;
  padding:18px 16px 28px;
}

.hero{padding-top:4px}

.hero-kicker{
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
  margin-bottom:12px;
}

.hero-dot{
  width:8px;
  height:8px;
  border-radius:999px;
  background:#22c55e;
  box-shadow:0 0 0 0 rgba(34,197,94,.35);
  animation:assocPulse 1.8s infinite;
}

@keyframes assocPulse{
  0%{ box-shadow:0 0 0 0 rgba(34,197,94,.35); }
  70%{ box-shadow:0 0 0 8px rgba(34,197,94,0); }
  100%{ box-shadow:0 0 0 0 rgba(34,197,94,0); }
}

.hero h1{
  margin:0 0 8px;
  font-size:clamp(34px, 5vw, 58px);
  line-height:1.02;
  letter-spacing:-.05em;
  color:#0f172a;
}

.lead{
  margin:0 0 12px;
  color:#334155;
  max-width:760px;
  font-size:15px;
  line-height:1.65;
  font-weight:750;
}

.badges{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:8px;
}

.badges span{
  border-radius:999px;
  border:1px solid rgba(15,23,42,.08);
  background:rgba(255,255,255,.78);
  padding:6px 11px;
  font-size:12px;
  font-weight:900;
  color:#334155;
}

.assoc-progress-band{
  display:grid;
  grid-template-columns:1.08fr .92fr;
  gap:16px;
  margin:18px 0;
  padding:20px;
  border-radius:24px;
  background:
    radial-gradient(circle at top left, rgba(251,191,36,.10), transparent 30%),
    radial-gradient(circle at bottom right, rgba(99,102,241,.08), transparent 34%),
    linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 18px 40px rgba(15,23,42,.06);
}

.assoc-progress-eyebrow{
  display:inline-flex;
  align-items:center;
  min-height:32px;
  padding:0 12px;
  border-radius:999px;
  background:rgba(15,23,42,.05);
  border:1px solid rgba(15,23,42,.08);
  font-size:12px;
  font-weight:1000;
  letter-spacing:.06em;
  text-transform:uppercase;
  margin-bottom:12px;
}

.assoc-progress-copy h2{
  margin:0 0 10px;
  font-size:clamp(24px, 3vw, 38px);
  line-height:1.05;
  letter-spacing:-.04em;
  color:#0f172a;
}

.assoc-progress-copy p{
  margin:0;
  max-width:720px;
  font-size:15px;
  line-height:1.65;
  color:#334155;
  font-weight:700;
}

.assoc-proof{
  margin-top:14px;
  display:grid;
  gap:6px;
}

.proof-line{
  color:#0f172a;
  font-size:14px;
  font-weight:900;
}

.proof-line.muted{
  color:#64748b;
  font-size:13px;
}

.assoc-progress-card{
  padding:18px;
  border-radius:22px;
  color:#fff;
  background:
    radial-gradient(circle at top right, rgba(251,191,36,.16), transparent 24%),
    linear-gradient(135deg, #0f172a, #172554 55%, #312e81);
  box-shadow:0 22px 44px rgba(15,23,42,.18);
}

.assoc-progress-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:12px;
}

.phase-pill{
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

.assoc-progress-top strong{
  font-size:28px;
  line-height:1;
  font-weight:1000;
  letter-spacing:-.04em;
}

.progress-bar{
  position:relative;
  width:100%;
  height:10px;
  border-radius:999px;
  background:rgba(255,255,255,.12);
  overflow:hidden;
}

.progress-fill{
  height:100%;
  border-radius:999px;
  background:linear-gradient(90deg, #22c55e, #facc15, #fb923c);
  box-shadow:0 10px 24px rgba(250,204,21,.24);
  transition:width .35s ease;
}

.progress-caption{
  margin-top:10px;
  color:rgba(255,255,255,.80);
  font-size:13px;
  line-height:1.5;
  font-weight:700;
}

.progress-mini-grid{
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:10px;
  margin-top:16px;
}

.progress-mini-stat{
  padding:12px;
  border-radius:16px;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.10);
}

.progress-mini-stat .label{
  display:block;
  margin-bottom:6px;
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.08em;
  color:rgba(255,255,255,.66);
  font-weight:900;
}

.progress-mini-stat strong{
  display:block;
  font-size:20px;
  line-height:1;
  font-weight:1000;
  letter-spacing:-.03em;
}

.progress-mini-stat .sub{
  display:block;
  margin-top:6px;
  font-size:11px;
  color:rgba(255,255,255,.68);
  font-weight:800;
}

.tiers{
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:14px;
  margin:18px 0 8px;
}

.tier-card{
  min-width:0;
  text-align:left;
  background:linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
  border:1px solid rgba(15,23,42,.08);
  border-radius:20px;
  padding:16px;
  cursor:pointer;
  transition:box-shadow .18s ease, border-color .18s ease, transform .18s ease, background .18s ease;
}

.tier-card:not(.selected):hover{
  transform:translateY(-1px);
  box-shadow:0 12px 26px rgba(15,23,42,.08);
}

.tier-card.selected{
  border-color:#4b6bfa;
  box-shadow:0 18px 42px rgba(75,107,250,.20);
}

.tier-card.hit{
  background:
    radial-gradient(circle at top right, rgba(251,191,36,.10), transparent 30%),
    linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
}

.tier-top{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:8px;
  margin-bottom:8px;
}

.tier-top h3{
  margin:0;
  font-size:18px;
  line-height:1.1;
  font-weight:1000;
  letter-spacing:-.02em;
  color:#0f172a;
}

.pill{
  border-radius:999px;
  padding:4px 9px;
  font-size:11px;
  font-weight:1000;
  border:1px solid rgba(15,23,42,.08);
  white-space:nowrap;
}

.pill--primary{
  background:#4b6bfa;
  border-color:#4b6bfa;
  color:#fff;
}

.pill--outline{
  background:transparent;
  color:#0f172a;
}

.pill--soft{
  background:#eef2ff;
  border-color:#dbe4ff;
  color:#1e3a8a;
}

.tier-desc{
  margin:0 0 12px;
  font-size:13px;
  line-height:1.55;
  color:#475569;
  font-weight:750;
}

.price{
  font-weight:1000;
  font-size:15px;
  color:#0f172a;
}

.price .per{
  font-weight:700;
  opacity:.72;
  margin-left:2px;
}

.price-note{
  font-size:12px;
  color:#64748b;
  font-weight:750;
  margin:0 0 14px;
}

.join{
  margin-top:10px;
  padding:20px;
  border-radius:24px;
  background:linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 16px 34px rgba(15,23,42,.05);
}

.join h2,
.faq h2,
.code-flow h2{
  margin:0 0 8px;
  font-size:26px;
  line-height:1.08;
  letter-spacing:-.03em;
  color:#0f172a;
}

.selected-tier{
  font-size:14px;
  margin:0 0 12px;
  color:#475569;
}

.form{
  display:grid;
  gap:12px;
  max-width:760px;
}

.form-grid{
  display:grid;
  grid-template-columns:repeat(2, minmax(0, 1fr));
  gap:12px;
}

.label{
  display:grid;
  gap:6px;
  font-size:13px;
  font-weight:900;
  color:#334155;
}

.form input,
.form textarea{
  width:100%;
  border-radius:14px;
  border:1px solid rgba(15,23,42,.10);
  background:#fff;
  color:#0f172a;
  font:inherit;
  font-weight:750;
  outline:none;
}

.form input{
  height:46px;
  padding:0 12px;
}

.form textarea{
  padding:12px;
  resize:vertical;
  line-height:1.5;
}

.form input:focus,
.form textarea:focus{
  border-color:#4b6bfa;
  box-shadow:0 0 0 4px rgba(75,107,250,.12);
}

.cta{
  height:48px;
  border-radius:14px;
  background:linear-gradient(135deg, #4b6bfa, #3558ff);
  color:#fff;
  border:1px solid #4b6bfa;
  font-weight:1000;
  cursor:pointer;
  box-shadow:0 16px 30px rgba(75,107,250,.16);
}

.cta[disabled]{
  opacity:.65;
  cursor:not-allowed;
}

.ok,
.err{
  border-radius:14px;
  padding:10px 12px;
  font-size:13px;
  font-weight:900;
}

.ok{
  background:rgba(34,197,94,.10);
  border:1px solid rgba(34,197,94,.20);
  color:#166534;
}

.err{
  background:rgba(239,68,68,.10);
  border:1px solid rgba(239,68,68,.20);
  color:#991b1b;
}

.fine{
  display:block;
  font-size:12px;
  color:#64748b;
  line-height:1.5;
  font-weight:700;
}

.code-flow{
  margin-top:20px;
  padding:20px;
  border-radius:24px;
  background:
    radial-gradient(circle at top right, rgba(34,197,94,.10), transparent 30%),
    linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 16px 34px rgba(15,23,42,.05);
}

.code-flow-head p{
  margin:0;
  max-width:760px;
  color:#475569;
  font-size:14px;
  line-height:1.65;
  font-weight:750;
}

.code-flow-grid{
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:12px;
  margin-top:14px;
}

.code-flow-card{
  border-radius:18px;
  padding:14px;
  background:rgba(255,255,255,.78);
  border:1px solid rgba(15,23,42,.08);
}

.code-flow-card strong{
  display:block;
  color:#0f172a;
  font-size:14px;
  line-height:1.35;
  font-weight:1000;
}

.code-flow-card p{
  margin:8px 0 0;
  color:#475569;
  font-size:13px;
  line-height:1.55;
  font-weight:750;
}

.faq{
  margin-top:20px;
  max-width:760px;
}

.faq details{
  margin:8px 0;
  border:1px dashed rgba(15,23,42,.14);
  border-radius:14px;
  padding:10px 12px;
  background:rgba(255,255,255,.72);
}

.faq summary{
  cursor:pointer;
  font-weight:950;
  color:#0f172a;
}

.faq p{
  margin:8px 0 0;
  color:#475569;
  line-height:1.6;
  font-weight:700;
}

.back{
  margin-top:16px;
}

.back-buttons{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}

.ghost{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:40px;
  border:1px solid rgba(15,23,42,.10);
  padding:0 13px;
  border-radius:999px;
  text-decoration:none;
  font-size:13px;
  font-weight:900;
  background:rgba(255,255,255,.76);
  color:#0f172a;
}

.ghost:hover{
  background:rgba(15,23,42,.06);
}

.ghost-alt{
  font-weight:1000;
}

.theme-dark .hero h1,
.theme-dark .assoc-progress-copy h2,
.theme-dark .tier-top h3,
.theme-dark .price,
.theme-dark .join h2,
.theme-dark .faq h2,
.theme-dark .code-flow h2,
.theme-dark .code-flow-card strong,
.theme-dark .faq summary{
  color:#f8fafc;
}

.theme-dark .lead,
.theme-dark .assoc-progress-copy p,
.theme-dark .tier-desc,
.theme-dark .selected-tier,
.theme-dark .code-flow-head p,
.theme-dark .code-flow-card p,
.theme-dark .faq p{
  color:#cbd5e1;
}

.theme-dark .hero-kicker,
.theme-dark .badges span,
.theme-dark .assoc-progress-eyebrow,
.theme-dark .code-flow-card,
.theme-dark .faq details,
.theme-dark .ghost{
  border-color:rgba(255,255,255,.10);
  background:rgba(255,255,255,.04);
  color:#e5e7eb;
}

.theme-dark .assoc-progress-band,
.theme-dark .tier-card,
.theme-dark .join,
.theme-dark .code-flow{
  background:linear-gradient(135deg, #020617, #0f172a);
  border-color:#1e293b;
  box-shadow:0 18px 40px rgba(0,0,0,.55);
}

.theme-dark .proof-line{
  color:#f8fafc;
}

.theme-dark .proof-line.muted,
.theme-dark .price-note,
.theme-dark .fine{
  color:#94a3b8;
}

.theme-dark .tier-card.selected{
  border-color:#6366f1;
  box-shadow:0 22px 46px rgba(79,70,229,.46);
}

.theme-dark .pill--soft{
  background:#0f172a;
  border-color:#334155;
  color:#e5e7eb;
}

.theme-dark .pill--outline{
  color:#e5e7eb;
  border-color:#334155;
}

.theme-dark .form input,
.theme-dark .form textarea{
  background:#020617;
  border-color:#1e293b;
  color:#f8fafc;
}

.theme-dark .label{
  color:#e2e8f0;
}

@media (max-width:900px){
  .assoc-progress-band,
  .tiers,
  .form-grid,
  .code-flow-grid{
    grid-template-columns:1fr;
  }
}

@media (max-width:640px){
  .assoc{
    padding:14px 12px 28px;
  }

  .assoc-progress-band,
  .join,
  .code-flow{
    padding:16px;
    border-radius:20px;
  }

  .progress-mini-grid{
    grid-template-columns:1fr;
  }

  .badges span,
  .ghost,
  .cta{
    width:100%;
    justify-content:center;
  }
}

@media (prefers-reduced-motion:reduce){
  .hero-dot{
    animation:none;
  }

  .progress-fill,
  .tier-card{
    transition:none;
  }
}
`;