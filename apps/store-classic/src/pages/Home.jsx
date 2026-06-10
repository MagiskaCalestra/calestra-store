// D:\WebProjects\Calestra\apps\store-classic\src\pages\Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import PromoStrips from "../components/PromoStrips.jsx";
import { useCampaign } from "../hooks/useCampaign.jsx";
import { TT } from "../i18n/tt.js";

function HotCard({ to, eyebrow, title, text, cta, tone = "dark" }) {
  return (
    <Link to={to} className={`hot-card hot-card--${tone}`}>
      <span className="hot-card-eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <span className="hot-card-cta">{cta}</span>
    </Link>
  );
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function ProgressTeaser() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/progress", {
          headers: { accept: "application/json" },
          cache: "no-store",
        });

        const json = await res.json().catch(() => null);

        if (!alive) return;
        if (json?.ok) setData(json);
      } catch (err) {
        console.warn("Home progress teaser failed:", err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const tr = (key, fallbackByLang, opts) => TT(i18n, t, key, fallbackByLang, opts);

  const summary = data?.summary || {};
  const narrative = data?.narrative || {};
  const signals = data?.signals || {};

  const currentLabel =
    summary.currentLabel ||
    tr("home.progress.fallback.current", {
      sv: "First Light",
      en: "First Light",
      tr: "First Light",
    });

  const nextLabel =
    summary.nextLabel ||
    tr("home.progress.fallback.next", {
      sv: "Nästa nivå",
      en: "Next level",
      tr: "Sonraki seviye",
    });

  const progressPct = Math.max(0, Math.min(100, safeNumber(summary.progressPct, 0)));
  const currentStep = safeNumber(summary.currentStep, 1);
  const totalSteps = safeNumber(summary.totalSteps, 7);
  const nextUnlockAt = safeNumber(summary.nextUnlockAt, 0);

  const ordersCount = safeNumber(signals.ordersCount, 0);
  const subscribersActive = safeNumber(signals.subscribersActive, 0);
  const recoveredOrders = safeNumber(signals.recoveredOrders, 0);

  const socialProof =
    ordersCount > 0
      ? tr(
          "home.progress.social.orders",
          {
            sv: "{{count}} ordrar har redan satt rörelsen i gång.",
            en: "{{count}} orders have already started the movement.",
            tr: "{{count}} sipariş hareketi şimdiden başlattı.",
          },
          { count: ordersCount }
        )
      : subscribersActive > 0
        ? tr(
            "home.progress.social.subscribers",
            {
              sv: "{{count}} personer följer redan utvecklingen.",
              en: "{{count}} people are already following the development.",
              tr: "{{count}} kişi gelişimi şimdiden takip ediyor.",
            },
            { count: subscribersActive }
          )
        : tr("home.progress.social.default", {
            sv: "Tidiga signaler samlas innan nästa våg öppnar.",
            en: "Early signals are gathered before the next wave opens.",
            tr: "Sonraki dalga açılmadan önce erken sinyaller toplanıyor.",
          });

  const secondaryProof =
    recoveredOrders > 0
      ? tr(
          "home.progress.secondary.recovered",
          {
            sv: "{{count}} återställda köp visar att intresset lever vidare.",
            en: "{{count}} recovered purchases show that the interest is still alive.",
            tr: "{{count}} geri kazanılan alışveriş ilginin sürdüğünü gösteriyor.",
          },
          { count: recoveredOrders }
        )
      : nextUnlockAt > 0
        ? tr(
            "home.progress.secondary.nextUnlock",
            {
              sv: "{{pct}}% till nästa nivå.",
              en: "{{pct}}% to the next level.",
              tr: "Sonraki seviyeye {{pct}}% kaldı.",
            },
            { pct: nextUnlockAt }
          )
        : tr("home.progress.secondary.default", {
            sv: "Nästa nivå låses upp när tillräckligt många signaler samlas.",
            en: "The next level unlocks when enough signals have been gathered.",
            tr: "Yeterli sinyal toplandığında sonraki seviye açılır.",
          });

  return (
    <section
      className="home-progress-teaser"
      aria-label={tr("home.progress.aria", {
        sv: "Live progress",
        en: "Live progress",
        tr: "Canlı progress",
      })}
    >
      <div className="progress-teaser-copy">
        <div className="progress-kicker">
          <span className="progress-kicker-dot" />
          <span>
            {tr("home.progress.kicker", {
              sv: "LIVE PROGRESS",
              en: "LIVE PROGRESS",
              tr: "CANLI PROGRESS",
            })}
          </span>
        </div>

        <h2>
          {loading
            ? tr("home.progress.loadingTitle", {
                sv: "Läser Calestras resa...",
                en: "Reading Calestra’s journey...",
                tr: "Calestra’nın yolculuğu okunuyor...",
              })
            : tr(
                "home.progress.activeTitle",
                {
                  sv: "{{label}} pågår nu",
                  en: "{{label}} is active now",
                  tr: "{{label}} şu anda aktif",
                },
                { label: currentLabel }
              )}
        </h2>

        <p>
          {loading
            ? tr("home.progress.loadingBody", {
                sv: "Vi hämtar den senaste progressen från systemet.",
                en: "We are loading the latest progress from the system.",
                tr: "Sistemden en güncel progress bilgisi alınıyor.",
              })
            : narrative?.body ||
              tr("home.progress.body", {
                sv: "Calestra växer genom verkliga butikssignaler, återkommande intresse och tydlig publikrespons.",
                en: "Calestra grows through real store signals, returning interest, and clear audience response.",
                tr: "Calestra gerçek mağaza sinyalleri, tekrar eden ilgi ve net kitle tepkisiyle büyür.",
              })}
        </p>

        <div className="progress-proof">
          <div className="proof-line">{socialProof}</div>
          <div className="proof-line muted">{secondaryProof}</div>
        </div>

        <div className="hero-actions">
          <Link to="/progress" className="cta primary">
            {tr("home.progress.ctaProgress", {
              sv: "Se hela progressen",
              en: "See full progress",
              tr: "Tüm ilerlemeyi gör",
            })}
          </Link>
          <Link to="/shop" className="cta secondary">
            {tr("home.progress.ctaShop", {
              sv: "Gå till shoppen",
              en: "Go to the shop",
              tr: "Mağazaya git",
            })}
          </Link>
        </div>
      </div>

      <div className="progress-teaser-card">
        <div className="progress-teaser-top">
          <div className="progress-phase">
            {tr(
              "home.progress.stepOf",
              {
                sv: "Steg {{step}} av {{total}}",
                en: "Step {{step}} of {{total}}",
                tr: "Adım {{step}} / {{total}}",
              },
              { step: currentStep, total: totalSteps }
            )}
          </div>
          <div className="progress-value">{Math.round(progressPct)}%</div>
        </div>

        <div className="progress-title-row">
          <strong>{loading ? "..." : currentLabel}</strong>
          <span>
            {loading
              ? "..."
              : tr(
                  "home.progress.next",
                  {
                    sv: "Nästa: {{label}}",
                    en: "Next: {{label}}",
                    tr: "Sonraki: {{label}}",
                  },
                  { label: nextLabel }
                )}
          </span>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="progress-caption">
          {loading
            ? tr("home.progress.loadingSignals", {
                sv: "Hämtar live-signaler...",
                en: "Loading live signals...",
                tr: "Canlı sinyaller yükleniyor...",
              })
            : narrative?.caption ||
              tr("home.progress.caption", {
                sv: "Butikssignaler driver momentum. Parkfaser kräver separat kapital- och genomförandeberedskap.",
                en: "Store signals drive momentum. Park phases require separate capital and execution readiness.",
                tr: "Mağaza sinyalleri ivme yaratır. Park fazları ayrı sermaye ve uygulama hazırlığı gerektirir.",
              })}
        </div>

        <div className="progress-mini-grid">
          <div className="progress-mini-box">
            <span className="label">
              {tr("home.progress.orders", {
                sv: "Ordrar",
                en: "Orders",
                tr: "Siparişler",
              })}
            </span>
            <strong>{ordersCount}</strong>
          </div>

          <div className="progress-mini-box">
            <span className="label">
              {tr("home.progress.subscribers", {
                sv: "Subscribers",
                en: "Subscribers",
                tr: "Aboneler",
              })}
            </span>
            <strong>{subscribersActive}</strong>
          </div>

          <div className="progress-mini-box">
            <span className="label">
              {tr("home.progress.recovery", {
                sv: "Recovery",
                en: "Recovery",
                tr: "Recovery",
              })}
            </span>
            <strong>{recoveredOrders}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const campaign = useCampaign();
  const campaignId = campaign?.id || "";

  const tr = (key, fallbackByLang, opts) => TT(i18n, t, key, fallbackByLang, opts);

  return (
    <main className="home-shell" id="main">
      <section
        className="calestra-brand-hero"
        aria-label={tr("home.hero.aria", {
          sv: "Calestra start",
          en: "Calestra home",
          tr: "Calestra ana sayfa",
        })}
      >
        <div className="brand-hero-media" aria-hidden="true">
          <div className="brand-star brand-star--main" />
          <div className="brand-star brand-star--soft" />
          <div className="brand-orb" />
        </div>

        <div className="brand-hero-content">
          <div className="brand-kicker">
            <span className="dot" />
            <span>
              {campaignId
                ? tr("home.hero.kickerCampaign", {
                    sv: "KAMPANJLÄGE AKTIVT",
                    en: "CAMPAIGN MODE ACTIVE",
                    tr: "KAMPANYA MODU AKTİF",
                  })
                : tr("home.hero.kicker", {
                    sv: "DROP MODE · EARLY ACCESS",
                    en: "DROP MODE · EARLY ACCESS",
                    tr: "DROP MODU · ERKEN ERİŞİM",
                  })}
            </span>
          </div>

          <div className="brand-found">
            {tr("home.hero.found", {
              sv: "Du hittade den. Nu börjar allt.",
              en: "You found it. Now everything begins.",
              tr: "Onu buldun. Şimdi her şey başlıyor.",
            })}
          </div>

          <h1>
            {tr("home.hero.titleLine1", {
              sv: "Somewhere…",
              en: "Somewhere…",
              tr: "Bir yerde…",
            })}
            <br />
            {tr("home.hero.titleLine2", {
              sv: "it waits for you.",
              en: "it waits for you.",
              tr: "seni bekliyor.",
            })}
          </h1>

          <p>
            {tr("home.hero.leadLine1", {
              sv: "You don’t follow the light.",
              en: "You don’t follow the light.",
              tr: "Işığı takip etmezsin.",
            })}
            <br />
            {tr("home.hero.leadLine2", {
              sv: "You become it.",
              en: "You become it.",
              tr: "Ona dönüşürsün.",
            })}
          </p>

          <div className="brand-actions">
            <Link to="/shop" className="cta cta-light">
              {tr("home.hero.ctaDrop", {
                sv: "Enter the drop",
                en: "Enter the drop",
                tr: "Drop’a gir",
              })}
            </Link>
            <Link to="/shop?cat=surprise-boxes" className="cta cta-dark">
              {tr("home.hero.ctaBoxes", {
                sv: "Surprise Boxes",
                en: "Surprise Boxes",
                tr: "Sürpriz Kutular",
              })}
            </Link>
          </div>
        </div>
      </section>

      <section
        className="home-drop-strip"
        aria-label={tr("home.drop.aria", {
          sv: "Första droppen",
          en: "The first drop",
          tr: "İlk drop",
        })}
      >
        <div>
          <span>
            {tr("home.drop.kicker", {
              sv: "The First Drop",
              en: "The First Drop",
              tr: "İlk Drop",
            })}
          </span>
          <strong>
            {tr("home.drop.text", {
              sv: "Symboler, plagg och samlarobjekt i en begränsad första våg.",
              en: "Symbols, clothing, and collectibles in a limited first wave.",
              tr: "Sınırlı ilk dalgada semboller, kıyafetler ve koleksiyon ürünleri.",
            })}
          </strong>
        </div>
        <Link to="/shop" className="strip-link">
          {tr("home.drop.cta", {
            sv: "Till butiken →",
            en: "To the shop →",
            tr: "Mağazaya →",
          })}
        </Link>
      </section>

      <section
        className="home-quick-grid"
        aria-label={tr("home.quick.aria", {
          sv: "Snabba vägar",
          en: "Quick paths",
          tr: "Hızlı yollar",
        })}
      >
        <HotCard
          to="/shop"
          eyebrow={tr("home.cards.shop.eyebrow", {
            sv: "FÖRST",
            en: "FIRST",
            tr: "İLK",
          })}
          title={tr("home.cards.shop.title", {
            sv: "Öppna butiken",
            en: "Open the shop",
            tr: "Mağazayı aç",
          })}
          text={tr("home.cards.shop.text", {
            sv: "Se första droppen, säkra din plats och hitta produkterna som bär Calestras ton.",
            en: "See the first drop, secure your place, and find the products that carry Calestra’s tone.",
            tr: "İlk drop’u gör, yerini ayır ve Calestra’nın tonunu taşıyan ürünleri keşfet.",
          })}
          cta={tr("home.cards.shop.cta", {
            sv: "Handla nu",
            en: "Shop now",
            tr: "Şimdi alışveriş yap",
          })}
          tone="dark"
        />

        <HotCard
          to="/shop?preorder=1"
          eyebrow={tr("home.cards.queue.eyebrow", {
            sv: "COLLECTOR",
            en: "COLLECTOR",
            tr: "KOLEKSİYON",
          })}
          title={tr("home.cards.queue.title", {
            sv: "Reservation Queue",
            en: "Reservation Queue",
            tr: "Rezervasyon Sırası",
          })}
          text={tr("home.cards.queue.text", {
            sv: "För produkter som öppnar i senare våg. Du skriver upp dig först.",
            en: "For products that open in a later wave. You sign up first.",
            tr: "Daha sonraki dalgada açılacak ürünler için. Önce sen kaydolursun.",
          })}
          cta={tr("home.cards.queue.cta", {
            sv: "Se pre-order",
            en: "See pre-order",
            tr: "Ön siparişi gör",
          })}
          tone="accent"
        />

        <HotCard
          to="/shop?cat=surprise-boxes"
          eyebrow={tr("home.cards.boxes.eyebrow", {
            sv: "LIMITED",
            en: "LIMITED",
            tr: "SINIRLI",
          })}
          title={tr("home.cards.boxes.title", {
            sv: "Surprise Boxes",
            en: "Surprise Boxes",
            tr: "Sürpriz Kutular",
          })}
          text={tr("home.cards.boxes.text", {
            sv: "För dig som vill åt spänningen, mystiken och en mer samlarvänlig känsla.",
            en: "For those who want excitement, mystery, and a more collectible feeling.",
            tr: "Heyecan, gizem ve daha koleksiyon hissi isteyenler için.",
          })}
          cta={tr("home.cards.boxes.cta", {
            sv: "Se boxarna",
            en: "See the boxes",
            tr: "Kutuları gör",
          })}
          tone="light"
        />

        <HotCard
          to="/assoc"
          eyebrow={tr("home.cards.assoc.eyebrow", {
            sv: "NÄRA",
            en: "CLOSE",
            tr: "YAKIN",
          })}
          title={tr("home.cards.assoc.title", {
            sv: "Bli Associate",
            en: "Become an Associate",
            tr: "Associate Ol",
          })}
          text={tr("home.cards.assoc.text", {
            sv: "För den som vill stå närmare varumärket, rörelsen och det som byggs tidigt.",
            en: "For those who want to stand closer to the brand, the movement, and what is being built early.",
            tr: "Markaya, harekete ve erken inşa edilen şeye daha yakın durmak isteyenler için.",
          })}
          cta={tr("home.cards.assoc.cta", {
            sv: "Läs mer",
            en: "Read more",
            tr: "Daha fazla oku",
          })}
          tone="dark"
        />
      </section>

      <section
        className="home-signals"
        aria-label={tr("home.signals.aria", {
          sv: "Varför Calestra Store",
          en: "Why Calestra Store",
          tr: "Neden Calestra Store",
        })}
      >
        <div className="signal">
          <span className="signal-title">
            {tr("home.signals.product.title", {
              sv: "Mer än produkt",
              en: "More than product",
              tr: "Üründen fazlası",
            })}
          </span>
          <p>
            {tr("home.signals.product.text", {
              sv: "Varje del ska kännas som en liten del av en värld — inte bara som en artikelrad.",
              en: "Every piece should feel like a small part of a world — not just a product row.",
              tr: "Her parça bir dünyanın küçük bir bölümü gibi hissettirmeli — yalnızca bir ürün satırı gibi değil.",
            })}
          </p>
        </div>

        <div className="signal">
          <span className="signal-title">
            {tr("home.signals.noise.title", {
              sv: "Mindre brus",
              en: "Less noise",
              tr: "Daha az gürültü",
            })}
          </span>
          <p>
            {tr("home.signals.noise.text", {
              sv: "Färre, tydligare ingångar. Mer riktning. Mindre vanlig webshop-känsla.",
              en: "Fewer, clearer entry points. More direction. Less ordinary webshop feeling.",
              tr: "Daha az ama daha net giriş. Daha fazla yön. Daha az sıradan webshop hissi.",
            })}
          </p>
        </div>

        <div className="signal">
          <span className="signal-title">
            {tr("home.signals.temperature.title", {
              sv: "Högre temperatur",
              en: "Higher temperature",
              tr: "Daha yüksek enerji",
            })}
          </span>
          <p>
            {tr("home.signals.temperature.text", {
              sv: "Butiken ska kännas levande, aktuell och laddad även innan full launch.",
              en: "The store should feel alive, current, and charged even before full launch.",
              tr: "Mağaza tam lansmandan önce bile canlı, güncel ve güçlü hissettirmeli.",
            })}
          </p>
        </div>
      </section>

      <ProgressTeaser />

      <section className="home-promo">
        <PromoStrips />
      </section>

      <section
        className="home-bottom-cta"
        aria-label={tr("home.bottom.aria", {
          sv: "Slutlig uppmaning",
          en: "Final call to action",
          tr: "Son çağrı",
        })}
      >
        <div className="bottom-card">
          <div>
            <span className="bottom-eyebrow">
              {tr("home.bottom.eyebrow", {
                sv: "CALESTRA STORE",
                en: "CALESTRA STORE",
                tr: "CALESTRA STORE",
              })}
            </span>
            <h2>
              {tr("home.bottom.title", {
                sv: "Se in i känslan innan nästa våg går.",
                en: "Look into the feeling before the next wave moves.",
                tr: "Sonraki dalga başlamadan önce hissin içine bak.",
              })}
            </h2>
            <p>
              {tr("home.bottom.text", {
                sv: "Gå till butiken, hitta rätt ton och låt användaren känna att något faktiskt pågår här.",
                en: "Go to the shop, find the right tone, and let the user feel that something is truly happening here.",
                tr: "Mağazaya git, doğru tonu bul ve kullanıcının burada gerçekten bir şeylerin olduğunu hissetmesini sağla.",
              })}
            </p>
          </div>

          <div className="bottom-actions">
            <Link to="/shop" className="cta primary">
              {tr("home.bottom.ctaShop", {
                sv: "Till butiken",
                en: "To the shop",
                tr: "Mağazaya",
              })}
            </Link>
            <Link to="/gallery" className="cta secondary">
              {tr("home.bottom.ctaGallery", {
                sv: "Se galleriet",
                en: "See the gallery",
                tr: "Galeriyi gör",
              })}
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .home-shell{
          padding:18px 16px 44px;
          max-width:1200px;
          margin:0 auto;
          scroll-margin-top:180px;
        }

        .calestra-brand-hero{
          position:relative;
          overflow:hidden;
          min-height:560px;
          border-radius:30px;
          margin:10px 0 18px;
          color:#fff;
          background:
            radial-gradient(circle at 64% 2%, rgba(245,158,11,.42), transparent 15%),
            radial-gradient(circle at 78% 72%, rgba(251,191,36,.14), transparent 26%),
            radial-gradient(circle at 12% 18%, rgba(59,130,246,.18), transparent 32%),
            linear-gradient(135deg, #07111f 0%, #0b1020 46%, #05070d 100%);
          border:1px solid rgba(255,255,255,.10);
          box-shadow:0 24px 70px rgba(15,23,42,.22);
          isolation:isolate;
        }

        .brand-hero-media{
          position:absolute;
          inset:0;
          pointer-events:none;
          z-index:0;
        }

        .brand-star{
          position:absolute;
          left:58%;
          top:4%;
          width:330px;
          height:330px;
          transform:translateX(-50%);
          background:
            linear-gradient(90deg, transparent 48%, rgba(245,158,11,.95) 49%, rgba(245,158,11,.95) 51%, transparent 52%),
            linear-gradient(0deg, transparent 48%, rgba(245,158,11,.95) 49%, rgba(245,158,11,.95) 51%, transparent 52%);
          filter:drop-shadow(0 0 34px rgba(251,191,36,.36));
          opacity:.9;
        }

        .brand-star::before,
        .brand-star::after{
          content:"";
          position:absolute;
          inset:0;
          background:
            linear-gradient(45deg, transparent 48.8%, rgba(245,158,11,.75) 49.4%, rgba(245,158,11,.75) 50.6%, transparent 51.2%);
        }

        .brand-star::after{
          transform:rotate(90deg);
        }

        .brand-star--soft{
          left:88%;
          top:68%;
          width:170px;
          height:170px;
          opacity:.16;
          filter:blur(.2px);
        }

        .brand-orb{
          position:absolute;
          width:340px;
          height:340px;
          right:-90px;
          bottom:-130px;
          border-radius:999px;
          background:radial-gradient(circle, rgba(245,158,11,.22), rgba(245,158,11,0) 64%);
          filter:blur(12px);
        }

        .brand-hero-content{
          position:relative;
          z-index:2;
          max-width:760px;
          padding:clamp(28px, 6vw, 72px) clamp(22px, 5vw, 56px);
          min-height:560px;
          display:flex;
          flex-direction:column;
          justify-content:flex-end;
        }

        .brand-kicker,
        .progress-kicker{
          display:inline-flex;
          align-items:center;
          gap:8px;
          width:max-content;
          max-width:100%;
          padding:6px 10px;
          border-radius:999px;
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.13);
          font-size:12px;
          font-weight:1000;
          text-transform:uppercase;
          letter-spacing:.08em;
          margin-bottom:10px;
        }

        .dot{
          width:8px;
          height:8px;
          border-radius:999px;
          background:#f97316;
          box-shadow:0 0 0 0 rgba(249,115,22,.45);
          animation:homePulse 1.8s infinite;
          flex:0 0 auto;
        }

        @keyframes homePulse{
          0%{ box-shadow:0 0 0 0 rgba(249,115,22,.4); }
          70%{ box-shadow:0 0 0 8px rgba(249,115,22,0); }
          100%{ box-shadow:0 0 0 0 rgba(249,115,22,0); }
        }

        .brand-found{
          width:max-content;
          max-width:100%;
          margin:0 0 14px;
          padding:7px 12px;
          border-radius:999px;
          background:rgba(255,255,255,.10);
          border:1px solid rgba(255,255,255,.14);
          font-size:13px;
          line-height:1.3;
          font-weight:1000;
          color:rgba(255,255,255,.94);
        }

        .brand-hero-content h1{
          margin:0;
          font-size:clamp(44px, 7vw, 88px);
          line-height:.95;
          letter-spacing:-.06em;
          color:#fff;
          text-wrap:balance;
        }

        .brand-hero-content p{
          margin:18px 0 0;
          max-width:620px;
          font-size:clamp(16px, 2vw, 22px);
          line-height:1.35;
          color:rgba(255,255,255,.84);
          font-weight:800;
        }

        .brand-actions,
        .hero-actions,
        .bottom-actions{
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:22px;
        }

        .cta{
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
          touch-action:manipulation;
          -webkit-tap-highlight-color:transparent;
        }

        .cta:hover{
          transform:translateY(-1px);
        }

        .cta.primary{
          background:linear-gradient(135deg, #0f172a, #334155);
          color:#fff;
          box-shadow:0 16px 30px rgba(15,23,42,.16);
        }

        .cta.secondary{
          color:#0f172a;
          background:rgba(255,255,255,.78);
          border:1px solid rgba(15,23,42,.10);
        }

        .cta-light{
          background:#fff;
          color:#0f172a;
          box-shadow:0 18px 36px rgba(255,255,255,.12);
        }

        .cta-dark{
          color:#fff;
          background:rgba(255,255,255,.10);
          border:1px solid rgba(255,255,255,.16);
        }

        .home-drop-strip{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:14px;
          margin:0 0 18px;
          padding:16px 18px;
          border-radius:20px;
          background:linear-gradient(135deg, rgba(254,243,199,.72), rgba(255,255,255,.90));
          border:1px solid rgba(245,158,11,.20);
          box-shadow:0 14px 34px rgba(15,23,42,.05);
        }

        .home-drop-strip span{
          display:block;
          margin-bottom:5px;
          font-size:12px;
          font-weight:1000;
          letter-spacing:.10em;
          color:#92400e;
          text-transform:uppercase;
        }

        .home-drop-strip strong{
          color:#0f172a;
          font-size:15px;
          line-height:1.4;
        }

        .strip-link{
          color:#0f172a;
          font-weight:1000;
          text-decoration:none;
          white-space:nowrap;
        }

        .home-quick-grid{
          display:grid;
          grid-template-columns:repeat(4, minmax(0, 1fr));
          gap:14px;
          margin:0 0 18px;
        }

        .hot-card{
          position:relative;
          display:flex;
          flex-direction:column;
          gap:10px;
          min-height:220px;
          padding:18px;
          border-radius:24px;
          text-decoration:none;
          transition:transform .14s ease, box-shadow .14s ease, border-color .14s ease;
          border:1px solid rgba(15,23,42,.08);
          overflow:hidden;
        }

        .hot-card:hover{
          transform:translateY(-2px);
        }

        .hot-card--dark{
          color:#fff;
          background:
            radial-gradient(circle at top right, rgba(251,191,36,.10), transparent 25%),
            linear-gradient(135deg, #0f172a, #1e293b 60%, #334155);
          box-shadow:0 20px 36px rgba(15,23,42,.16);
        }

        .hot-card--accent{
          color:#fff;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,.12), transparent 24%),
            linear-gradient(135deg, #7c2d12, #d97706 58%, #f59e0b);
          box-shadow:0 20px 36px rgba(217,119,6,.18);
        }

        .hot-card--light{
          color:#0f172a;
          background:linear-gradient(135deg, rgba(255,255,255,.94), rgba(241,245,249,.98));
          box-shadow:0 14px 28px rgba(15,23,42,.06);
        }

        .hot-card-eyebrow{
          display:inline-flex;
          width:max-content;
          padding:5px 9px;
          border-radius:999px;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          background:rgba(255,255,255,.10);
          border:1px solid rgba(255,255,255,.12);
        }

        .hot-card--light .hot-card-eyebrow{
          background:rgba(15,23,42,.05);
          border-color:rgba(15,23,42,.08);
        }

        .hot-card h3{
          margin:0;
          font-size:22px;
          line-height:1.06;
          letter-spacing:-.03em;
        }

        .hot-card p{
          margin:0;
          line-height:1.55;
          font-size:14px;
          font-weight:700;
          opacity:.9;
        }

        .hot-card-cta{
          margin-top:auto;
          display:inline-flex;
          width:max-content;
          padding:8px 12px;
          border-radius:999px;
          background:rgba(255,255,255,.12);
          border:1px solid rgba(255,255,255,.16);
          font-size:13px;
          font-weight:1000;
        }

        .hot-card--light .hot-card-cta{
          background:#0f172a;
          border-color:#0f172a;
          color:#fff;
        }

        .home-worlds{
          margin:0 0 18px;
        }

        .worlds-head{
          display:flex;
          justify-content:space-between;
          align-items:flex-end;
          gap:18px;
          margin-bottom:12px;
        }

        .worlds-eyebrow{
          display:inline-block;
          margin-bottom:8px;
          padding:5px 9px;
          border-radius:999px;
          background:rgba(15,23,42,.06);
          border:1px solid rgba(15,23,42,.08);
          color:#475569;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.10em;
          text-transform:uppercase;
        }

        .worlds-head h2{
          margin:0;
          color:#0f172a;
          font-size:clamp(28px, 4vw, 40px);
          line-height:1.03;
          letter-spacing:-.04em;
        }

        .worlds-head p{
          margin:8px 0 0;
          color:#334155;
          font-size:15px;
          line-height:1.5;
          font-weight:800;
        }

        .world-grid{
          display:grid;
          grid-template-columns:repeat(3, minmax(0, 1fr));
          gap:14px;
        }

        .world-card{
          position:relative;
          overflow:hidden;
          min-height:250px;
          border-radius:24px;
          padding:18px;
          display:flex;
          flex-direction:column;
          justify-content:flex-end;
          color:#fff;
          text-decoration:none;
          border:1px solid rgba(255,255,255,.10);
          box-shadow:0 20px 42px rgba(15,23,42,.18);
        }

        .world-card--gate{
          background:
            linear-gradient(180deg, rgba(2,6,23,.12), rgba(2,6,23,.90)),
            radial-gradient(circle at 30% 35%, rgba(245,158,11,.58), transparent 18%),
            radial-gradient(circle at 70% 20%, rgba(34,211,238,.22), transparent 30%),
            linear-gradient(135deg, #06101d, #111827);
        }

        .world-card--keep{
          background:
            linear-gradient(180deg, rgba(2,6,23,.10), rgba(2,6,23,.90)),
            radial-gradient(circle at 55% 22%, rgba(251,191,36,.48), transparent 16%),
            radial-gradient(circle at 76% 56%, rgba(59,130,246,.16), transparent 32%),
            linear-gradient(135deg, #07111f, #111827);
        }

        .world-card--drop{
          background:
            linear-gradient(180deg, rgba(2,6,23,.10), rgba(2,6,23,.90)),
            radial-gradient(circle at 40% 38%, rgba(245,158,11,.55), transparent 16%),
            radial-gradient(circle at 82% 18%, rgba(245,158,11,.20), transparent 28%),
            linear-gradient(135deg, #080b13, #111827);
        }

        .world-card span{
          width:max-content;
          margin-bottom:8px;
          padding:5px 9px;
          border-radius:999px;
          background:rgba(255,255,255,.12);
          border:1px solid rgba(255,255,255,.14);
          font-size:11px;
          font-weight:1000;
          letter-spacing:.10em;
        }

        .world-card h3{
          margin:0 0 6px;
          font-size:26px;
          line-height:1.03;
          letter-spacing:-.04em;
        }

        .world-card p{
          margin:0 0 14px;
          color:rgba(255,255,255,.82);
          font-size:14px;
          line-height:1.5;
          font-weight:800;
        }

        .world-card strong{
          width:max-content;
          padding:8px 12px;
          border-radius:999px;
          background:rgba(255,255,255,.12);
          border:1px solid rgba(255,255,255,.16);
          font-size:13px;
          font-weight:1000;
        }

        .home-signals{
          display:grid;
          grid-template-columns:repeat(3, minmax(0, 1fr));
          gap:14px;
          margin-bottom:18px;
        }

        .signal,
        .bottom-card,
        .home-progress-teaser,
        .progress-teaser-card{
          border-radius:24px;
          box-sizing:border-box;
        }

        .signal{
          padding:18px;
          background:rgba(255,255,255,.88);
          border:1px solid rgba(15,23,42,.08);
          box-shadow:0 12px 24px rgba(15,23,42,.05);
        }

        .signal-title{
          display:block;
          margin-bottom:8px;
          font-size:12px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:#475569;
        }

        .signal p{
          margin:0;
          color:#0f172a;
          line-height:1.55;
          font-size:14px;
          font-weight:700;
        }

        .home-progress-teaser{
          display:grid;
          grid-template-columns:1.15fr .95fr;
          gap:16px;
          margin:0 0 18px;
          padding:20px;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,.10), transparent 30%),
            radial-gradient(circle at bottom right, rgba(99,102,241,.08), transparent 34%),
            linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
          border:1px solid rgba(15,23,42,.08);
          box-shadow:0 18px 40px rgba(15,23,42,.06);
        }

        .progress-kicker{
          color:#0f172a;
          background:rgba(15,23,42,.05);
          border:1px solid rgba(15,23,42,.08);
        }

        .progress-kicker-dot{
          width:8px;
          height:8px;
          border-radius:999px;
          background:#22c55e;
          box-shadow:0 0 0 0 rgba(34,197,94,.35);
          animation:teaserPulse 1.8s infinite;
        }

        @keyframes teaserPulse{
          0%{ box-shadow:0 0 0 0 rgba(34,197,94,.35); }
          70%{ box-shadow:0 0 0 8px rgba(34,197,94,0); }
          100%{ box-shadow:0 0 0 0 rgba(34,197,94,0); }
        }

        .progress-teaser-copy h2{
          margin:0 0 10px;
          font-size:clamp(24px, 3vw, 38px);
          line-height:1.04;
          letter-spacing:-.04em;
          color:#0f172a;
        }

        .progress-teaser-copy p{
          margin:0;
          font-size:15px;
          line-height:1.6;
          color:#334155;
          font-weight:700;
          max-width:720px;
        }

        .progress-proof{
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

        .progress-teaser-card{
          padding:18px;
          color:#fff;
          background:
            radial-gradient(circle at top right, rgba(251,191,36,.16), transparent 24%),
            linear-gradient(135deg, #0f172a, #172554 55%, #312e81);
          box-shadow:0 22px 44px rgba(15,23,42,.18);
        }

        .progress-teaser-top{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom:12px;
        }

        .progress-phase{
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

        .progress-value{
          font-size:28px;
          line-height:1;
          font-weight:1000;
          letter-spacing:-.04em;
        }

        .progress-title-row{
          display:flex;
          justify-content:space-between;
          align-items:flex-end;
          gap:12px;
          margin-bottom:12px;
        }

        .progress-title-row strong{
          font-size:20px;
          line-height:1.05;
          letter-spacing:-.03em;
        }

        .progress-title-row span{
          font-size:12px;
          color:rgba(255,255,255,.72);
          font-weight:800;
          text-align:right;
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

        .progress-mini-box{
          padding:12px;
          border-radius:16px;
          background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.10);
        }

        .progress-mini-box .label{
          display:block;
          margin-bottom:6px;
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:.08em;
          color:rgba(255,255,255,.66);
          font-weight:900;
        }

        .progress-mini-box strong{
          font-size:20px;
          line-height:1;
          font-weight:1000;
          letter-spacing:-.03em;
        }

        .home-promo{
          margin-bottom:18px;
        }

        .bottom-card{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:18px;
          padding:24px;
          background:
            radial-gradient(circle at top left, rgba(99,102,241,.10), transparent 28%),
            linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.98));
          border:1px solid rgba(15,23,42,.08);
          box-shadow:0 18px 34px rgba(15,23,42,.06);
        }

        .bottom-eyebrow{
          display:inline-block;
          margin-bottom:8px;
          font-size:12px;
          font-weight:1000;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:#64748b;
        }

        .bottom-card h2{
          margin:0 0 8px;
          font-size:clamp(24px, 3vw, 34px);
          line-height:1.06;
          letter-spacing:-.03em;
          color:#0f172a;
        }

        .bottom-card p{
          margin:0;
          max-width:720px;
          color:#334155;
          line-height:1.6;
          font-size:15px;
          font-weight:700;
        }

        .theme-dark .home-shell{
          background:transparent;
        }

        .theme-dark .home-drop-strip,
        .theme-dark .signal,
        .theme-dark .home-progress-teaser,
        .theme-dark .bottom-card{
          background:linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,.94));
          border-color:rgba(255,255,255,.08);
          box-shadow:0 18px 40px rgba(0,0,0,.26);
        }

        .theme-dark .home-drop-strip strong,
        .theme-dark .worlds-head h2,
        .theme-dark .signal p,
        .theme-dark .progress-teaser-copy h2,
        .theme-dark .proof-line,
        .theme-dark .bottom-card h2{
          color:#f8fafc;
        }

        .theme-dark .worlds-head p,
        .theme-dark .progress-teaser-copy p,
        .theme-dark .bottom-card p{
          color:#cbd5e1;
        }

        .theme-dark .worlds-eyebrow,
        .theme-dark .signal-title,
        .theme-dark .bottom-eyebrow,
        .theme-dark .proof-line.muted{
          color:#94a3b8;
        }

        .theme-dark .cta.secondary{
          background:rgba(255,255,255,.06);
          color:#f8fafc;
          border-color:rgba(255,255,255,.10);
        }

        @media (max-width:1020px){
          .home-quick-grid{
            grid-template-columns:repeat(2, minmax(0, 1fr));
          }

          .home-signals,
          .world-grid,
          .home-progress-teaser{
            grid-template-columns:1fr;
          }

          .worlds-head,
          .bottom-card,
          .home-drop-strip{
            flex-direction:column;
            align-items:flex-start;
          }
        }

        @media (max-width:640px){
          .home-shell{
            padding:12px 12px 34px;
          }

          .calestra-brand-hero{
            min-height:520px;
            border-radius:24px;
            margin-top:8px;
          }

          .brand-hero-content{
            min-height:520px;
            padding:24px 18px;
          }

          .brand-star--main{
            left:68%;
            width:250px;
            height:250px;
          }

          .home-quick-grid{
            grid-template-columns:1fr;
          }

          .home-drop-strip,
          .bottom-card,
          .signal,
          .hot-card,
          .home-progress-teaser,
          .progress-teaser-card,
          .world-card{
            border-radius:20px;
          }

          .bottom-card,
          .home-progress-teaser{
            padding:18px;
          }

          .progress-mini-grid{
            grid-template-columns:1fr;
          }

          .progress-title-row{
            flex-direction:column;
            align-items:flex-start;
          }

          .brand-kicker{
            font-size:11px;
          }

          .brand-hero-content h1{
            font-size:clamp(40px, 15vw, 62px);
          }
        }

        @media (prefers-reduced-motion:reduce){
          .dot,
          .progress-kicker-dot{
            animation:none;
          }

          .cta,
          .hot-card,
          .progress-fill{
            transition:none;
          }
        }
      `}</style>
    </main>
  );
}