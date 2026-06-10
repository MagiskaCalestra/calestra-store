// D:\WebProjects\Calestra\apps\store-classic\src\components\Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { TT } from "../i18n/tt.js";

const EVT_OPEN_COOKIE = "cw:cookie:open";

function openCookieManager() {
  try {
    window.dispatchEvent(new CustomEvent(EVT_OPEN_COOKIE));
  } catch {}
}

function getLang(i18n) {
  const raw = String(i18n?.resolvedLanguage || i18n?.language || "sv").toLowerCase();
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("tr")) return "tr";
  return "sv";
}

function safeLangTag(i18n) {
  return getLang(i18n).toUpperCase();
}

function pickLang(i18n, values = {}) {
  const lang = getLang(i18n);
  return values[lang] || values.sv || values.en || values.tr || "";
}

function envAny(keys = []) {
  try {
    for (const key of keys) {
      const v = String(import.meta?.env?.[key] || "").trim();
      if (v) return v;
    }
  } catch {}
  return "";
}

function isRealUrl(v) {
  return /^https?:\/\//i.test(String(v || "").trim());
}

function cleanHandle(v) {
  return String(v || "").trim().replace(/^@+/, "").replace(/^\/+/, "").replace(/\/+$/, "");
}

function socialUrl(platform, raw) {
  const value = String(raw || "").trim();
  if (isRealUrl(value)) return value;

  const handle = cleanHandle(value);
  if (!handle) return "";

  const map = {
    instagram: `https://www.instagram.com/${handle}`,
    tiktok: `https://www.tiktok.com/@${handle}`,
    youtube: handle.startsWith("@")
      ? `https://www.youtube.com/${handle}`
      : `https://www.youtube.com/@${handle}`,
    x: `https://x.com/${handle}`,
    facebook: `https://www.facebook.com/${handle}`,
    threads: `https://www.threads.net/@${handle}`,
    linkedin: `https://www.linkedin.com/company/${handle}`,
    pinterest: `https://www.pinterest.com/${handle}`,
  };

  return map[platform] || "";
}

const Icon = {
  Visa: () => (
    <svg viewBox="0 0 36 12" width="34" height="12" aria-label="Visa" role="img">
      <rect width="36" height="12" rx="2" fill="#1a1f71" />
      <text x="18" y="8.6" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="7">VISA</text>
    </svg>
  ),
  MC: () => (
    <svg viewBox="0 0 36 12" width="34" height="12" aria-label="Mastercard" role="img">
      <rect width="36" height="12" rx="2" fill="#111" />
      <circle cx="15" cy="6" r="4.2" fill="#eb001b" />
      <circle cx="21" cy="6" r="4.2" fill="#f79e1b" opacity="0.9" />
    </svg>
  ),
  Amex: () => (
    <svg viewBox="0 0 36 12" width="34" height="12" aria-label="American Express" role="img">
      <rect width="36" height="12" rx="2" fill="#2e77bb" />
      <text x="18" y="8.6" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="5">AMEX</text>
    </svg>
  ),
  PayPal: () => (
    <svg viewBox="0 0 36 12" width="38" height="12" aria-label="PayPal" role="img">
      <rect width="36" height="12" rx="2" fill="#003087" />
      <text x="18" y="8.3" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="6">PayPal</text>
    </svg>
  ),
  ApplePay: () => (
    <svg viewBox="0 0 36 12" width="40" height="12" aria-label="Apple Pay" role="img">
      <rect width="36" height="12" rx="2" fill="#111" />
      <text x="18" y="8.3" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="6"> Pay</text>
    </svg>
  ),
  Swish: () => (
    <svg viewBox="0 0 36 12" width="34" height="12" aria-label="Swish" role="img">
      <rect width="36" height="12" rx="2" fill="#fff" />
      <text x="18" y="8.3" textAnchor="middle" fill="#6b46c1" fontWeight="800" fontSize="6">Swish</text>
      <rect width="36" height="12" rx="2" fill="none" stroke="#e2e8f0" />
    </svg>
  ),
  Klarna: () => (
    <svg viewBox="0 0 36 12" width="38" height="12" aria-label="Klarna" role="img">
      <rect width="36" height="12" rx="2" fill="#ffb3c7" />
      <text x="18" y="8.3" textAnchor="middle" fill="#111" fontWeight="800" fontSize="6">Klarna</text>
    </svg>
  ),
  IG: () => <span aria-hidden>📷</span>,
  TT: () => <span aria-hidden>🎵</span>,
  YT: () => <span aria-hidden>▶️</span>,
  X: () => <span aria-hidden>𝕏</span>,
  FB: () => <span aria-hidden>📘</span>,
  TH: () => <span aria-hidden>@</span>,
  IN: () => <span aria-hidden>in</span>,
  PI: () => <span aria-hidden>📌</span>,
};

function SocialChip({ label, IconEl, href, soonText }) {
  const live = isRealUrl(href);
  const soonLabel = soonText || label;

  if (!live) {
    return (
      <span className="sbtn sbtn--disabled" aria-label={soonLabel} title={soonLabel}>
        <IconEl />
      </span>
    );
  }

  return (
    <a className="sbtn" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
      <IconEl />
    </a>
  );
}

export default function Footer() {
  const { t, i18n } = useTranslation();
  const { currency } = useCurrency();
  const year = new Date().getFullYear();

  const tx = React.useCallback(
    (key, fallback) => TT(i18n, t, key, fallback),
    [i18n, t]
  );

  const isPreview = (() => {
    try {
      return String(import.meta?.env?.MODE || "").toLowerCase() !== "production";
    } catch {
      return true;
    }
  })();

  const previewTag = tx("footer.preview", {
    sv: "PREVIEW",
    en: "PREVIEW",
    tr: "ÖNİZLEME",
  });

  const socials = React.useMemo(
    () => ({
      instagram: socialUrl("instagram", envAny(["VITE_SOCIAL_INSTAGRAM", "VITE_INSTAGRAM_URL", "VITE_INSTAGRAM", "VITE_INSTAGRAM_HANDLE"])),
      tiktok: socialUrl("tiktok", envAny(["VITE_SOCIAL_TIKTOK", "VITE_TIKTOK_URL", "VITE_TIKTOK", "VITE_TIKTOK_HANDLE"])),
      youtube: socialUrl("youtube", envAny(["VITE_SOCIAL_YOUTUBE", "VITE_YOUTUBE_URL", "VITE_YOUTUBE", "VITE_YOUTUBE_HANDLE"])),
      x: socialUrl("x", envAny(["VITE_SOCIAL_X", "VITE_X_URL", "VITE_TWITTER_URL", "VITE_X_HANDLE"])),
      facebook: socialUrl("facebook", envAny(["VITE_SOCIAL_FACEBOOK", "VITE_FACEBOOK_URL", "VITE_FACEBOOK", "VITE_FACEBOOK_HANDLE"])),
      threads: socialUrl("threads", envAny(["VITE_SOCIAL_THREADS", "VITE_THREADS_URL", "VITE_THREADS", "VITE_THREADS_HANDLE"])),
      linkedin: socialUrl("linkedin", envAny(["VITE_SOCIAL_LINKEDIN", "VITE_LINKEDIN_URL", "VITE_LINKEDIN", "VITE_LINKEDIN_HANDLE"])),
      pinterest: socialUrl("pinterest", envAny(["VITE_SOCIAL_PINTEREST", "VITE_PINTEREST_URL", "VITE_PINTEREST", "VITE_PINTEREST_HANDLE"])),
    }),
    []
  );

  const hasAnySocial = Object.values(socials).some(isRealUrl);

  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const abortRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      try {
        abortRef.current?.abort?.();
      } catch {}
    };
  }, []);

  function msgFor(errKey) {
    const key = String(errKey || "unknown");

    const fallbacks = {
      invalid_email: {
        sv: "Skriv en giltig e-postadress.",
        en: "Enter a valid email address.",
        tr: "Geçerli bir e-posta adresi yazın.",
      },
      bad_content_type: {
        sv: "Något blev fel. Försök igen.",
        en: "Something went wrong. Please try again.",
        tr: "Bir şeyler yanlış gitti. Lütfen tekrar deneyin.",
      },
      mail_send_failed: {
        sv: "Jag kunde inte skicka bekräftelsen just nu. Försök igen om en stund.",
        en: "The confirmation could not be sent right now. Please try again shortly.",
        tr: "Onay şu anda gönderilemedi. Lütfen biraz sonra tekrar deneyin.",
      },
      server_error: {
        sv: "Tekniskt fel. Försök igen om en stund.",
        en: "Technical error. Please try again shortly.",
        tr: "Teknik hata. Lütfen biraz sonra tekrar deneyin.",
      },
      network: {
        sv: "Ingen kontakt just nu. Kolla uppkoppling och testa igen.",
        en: "No connection right now. Check your connection and try again.",
        tr: "Şu anda bağlantı yok. Bağlantınızı kontrol edip tekrar deneyin.",
      },
      unknown: {
        sv: "Något gick fel. Försök igen.",
        en: "Something went wrong. Please try again.",
        tr: "Bir şeyler yanlış gitti. Lütfen tekrar deneyin.",
      },
    };

    return tx(`newsletter.errors.${key}`, fallbacks[key] || fallbacks.unknown);
  }

  async function submitNewsletter(e) {
    e.preventDefault();

    const trimmed = String(email || "").trim();
    if (!trimmed) return;

    setErrorMsg("");
    setState("loading");

    try {
      abortRef.current?.abort?.();
    } catch {}

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          lang: getLang(i18n),
          source: "footer",
        }),
        signal: ac.signal,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setErrorMsg(msgFor(String(data?.error || "unknown")));
        setState("error");
        return;
      }

      setState("ok");
      setEmail("");
      window.setTimeout(() => setState("idle"), 2600);
    } catch (err) {
      if (String(err?.name || "") === "AbortError") return;
      setErrorMsg(msgFor("network"));
      setState("error");
    }
  }

  const isBusy = state === "loading";
  const langTag = safeLangTag(i18n);

  const socialSoonText = (label) =>
    pickLang(i18n, {
      sv: `${label} kommer snart`,
      en: `${label} coming soon`,
      tr: `${label} yakında`,
    });

  const L = {
    fomoAria: tx("footer.fomo.aria", {
      sv: "Calestra – nyheter",
      en: "Calestra — news",
      tr: "Calestra — haberler",
    }),
    fomo: tx("footer.fomo", {
      sv: "Nya droppar släpps löpande – missa inte nästa!",
      en: "New drops launch continuously — do not miss the next one!",
      tr: "Yeni drop’lar düzenli olarak yayınlanır — sıradakini kaçırma!",
    }),
    shopNow: tx("footer.shopNow", {
      sv: "Handla nu",
      en: "Shop now",
      tr: "Şimdi alışveriş yap",
    }),
    assoc: tx("nav.assoc", {
      sv: "Bli Associate",
      en: "Become an Associate",
      tr: "Associate ol",
    }),
    homeAria: tx("nav.home", {
      sv: "Calestra – Hem",
      en: "Calestra — Home",
      tr: "Calestra — Ana sayfa",
    }),
    tag: tx("footer.tag", {
      sv: "Calestra World – där magi, känslor och framtid möts.",
      en: "Calestra World — where magic, emotion, and the future meet.",
      tr: "Calestra World — büyünün, duyguların ve geleceğin buluştuğu yer.",
    }),
    trust: tx("footer.trust", {
      sv: "Trygghet",
      en: "Trust",
      tr: "Güven",
    }),
    securePay: tx("footer.pay.secure", {
      sv: "Säker betalning",
      en: "Secure payment",
      tr: "Güvenli ödeme",
    }),
    payMethods: tx("footer.pay.methods", {
      sv: "Betalningsmetoder",
      en: "Payment methods",
      tr: "Ödeme yöntemleri",
    }),
    payNote: tx("footer.pay.note", {
      sv: "Visade betalmetoder och partnerstöd kan variera beroende på land, valuta och launchläge.",
      en: "Displayed payment methods and partner support may vary by country, currency, and launch mode.",
      tr: "Gösterilen ödeme yöntemleri ve partner desteği ülkeye, para birimine ve lansman moduna göre değişebilir.",
    }),
    shop: tx("footer.shop", {
      sv: "Butik",
      en: "Shop",
      tr: "Mağaza",
    }),
    navShop: tx("nav.shop", {
      sv: "Butik",
      en: "Shop",
      tr: "Mağaza",
    }),
    navGallery: tx("nav.gallery", {
      sv: "Galleri",
      en: "Gallery",
      tr: "Galeri",
    }),
    navProgress: tx("nav.progress", {
      sv: "Progress",
      en: "Progress",
      tr: "Progress",
    }),
    navPress: tx("nav.press", {
      sv: "Press",
      en: "Press",
      tr: "Basın",
    }),
    help: tx("footer.help", {
      sv: "Hjälp & info",
      en: "Help & info",
      tr: "Yardım & bilgi",
    }),
    shipping: tx("footer.shipping", {
      sv: "Frakt",
      en: "Shipping",
      tr: "Kargo",
    }),
    returns: tx("footer.returns", {
      sv: "Returer & ångerrätt",
      en: "Returns & right of withdrawal",
      tr: "İadeler & cayma hakkı",
    }),
    contact: tx("footer.contact", {
      sv: "Kontakt",
      en: "Contact",
      tr: "İletişim",
    }),
    terms: tx("footer.terms", {
      sv: "Villkor",
      en: "Terms",
      tr: "Şartlar",
    }),
    privacy: tx("footer.privacy", {
      sv: "Integritet",
      en: "Privacy",
      tr: "Gizlilik",
    }),
    publicReleases: tx("nav.publicReleases", {
      sv: "Publika dokument",
      en: "Public Releases",
      tr: "Yayınlanan belgeler",
    }),
    news: tx("footer.news", {
      sv: "Nyhetsbrev",
      en: "Newsletter",
      tr: "Bülten",
    }),
    newsCopy: tx("footer.news.copy", {
      sv: "Få en notis när nästa drop släpps. Du behöver bekräfta via e-post.",
      en: "Get a note when the next drop launches. You need to confirm by email.",
      tr: "Sıradaki drop yayınlandığında bildirim al. E-posta ile onaylamanız gerekir.",
    }),
    emailPlaceholder: tx("footer.news.placeholder", {
      sv: "Din e-post",
      en: "Your email",
      tr: "E-postanız",
    }),
    newsLoading: tx("footer.news.loading", {
      sv: "Skickar…",
      en: "Sending…",
      tr: "Gönderiliyor…",
    }),
    subscribe: tx("footer.news.subscribe", {
      sv: "Prenumerera",
      en: "Subscribe",
      tr: "Abone ol",
    }),
    newsletterOk: tx("newsletter.ok", {
      sv: "Tack! Kolla din inkorg och bekräfta ✦",
      en: "Thank you! Check your inbox and confirm ✦",
      tr: "Teşekkürler! Gelen kutunuzu kontrol edip onaylayın ✦",
    }),
    newsletterError: tx("newsletter.error", {
      sv: "Något gick fel. Försök igen om en stund.",
      en: "Something went wrong. Please try again shortly.",
      tr: "Bir şeyler yanlış gitti. Lütfen biraz sonra tekrar deneyin.",
    }),
    legal: tx("footer.legal", {
      sv: "Genom att prenumerera godkänner du våra villkor och integritetspolicy.",
      en: "By subscribing, you accept our terms and privacy policy.",
      tr: "Abone olarak şartlarımızı ve gizlilik politikamızı kabul edersiniz.",
    }),
    follow: tx("footer.follow", {
      sv: "Följ Calestra",
      en: "Follow Calestra",
      tr: "Calestra’yı takip et",
    }),
    socialLive: tx("footer.social.live", {
      sv: "Minst en social kanal är nu aktiv.",
      en: "At least one social channel is now active.",
      tr: "En az bir sosyal kanal şu anda aktif.",
    }),
    socialSoon: tx("footer.social.soon", {
      sv: "Sociala kanaler aktiveras vid lansering.",
      en: "Social channels activate at launch.",
      tr: "Sosyal kanallar lansmanda aktifleşir.",
    }),
    rights: tx("footer.rights", {
      sv: "Alla rättigheter förbehålls.",
      en: "All rights reserved.",
      tr: "Tüm hakları saklıdır.",
    }),
    cookiesLink: tx("footer.cookiesLink", {
      sv: "Cookies",
      en: "Cookies",
      tr: "Çerezler",
    }),
    cookiesManage: tx("footer.cookies.manage", {
      sv: "Hantera cookies",
      en: "Manage cookies",
      tr: "Çerezleri yönet",
    }),
    vat: tx("footer.vat", {
      sv: "Moms ingår där det är tillämpligt.",
      en: "VAT is included where applicable.",
      tr: "Geçerli olduğu yerlerde KDV dahildir.",
    }),
  };

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="fomo" aria-label={L.fomoAria}>
        <div className="container fomo__in">
          <span className="spark" aria-hidden>✦</span>
          <span className="fomo__msg">{L.fomo}</span>

          <div className="fomo__cta">
            <Link to="/shop" className="fomo__link">{L.shopNow}</Link>
            <Link to="/assoc" className="fomo__link ghost">{L.assoc}</Link>
          </div>
        </div>
      </div>

      <div className="container fgrid">
        <section className="fcol fcol-brand">
          <Link to="/" className="fbrand" aria-label={L.homeAria}>
            <span className="fmark" aria-hidden>
              <img src="/images/brand/mark.svg" width="16" height="16" alt="" loading="lazy" />
            </span>
            <span className="fname">Calestra</span>
            {isPreview ? <span className="pill-preview">{previewTag}</span> : null}
          </Link>

          <p className="tag">{L.tag}</p>

          <div className="trust" aria-label={L.trust}>
            <span className="chip chip-strong">SSL</span>
            <span className="chip">{L.securePay}</span>
            <span className="chip">{currency}</span>
          </div>

          <div className="pay" aria-label={L.payMethods}>
            <Icon.Visa />
            <Icon.MC />
            <Icon.Amex />
            <Icon.PayPal />
            <Icon.ApplePay />
            <Icon.Swish />
            <Icon.Klarna />
          </div>

          <div className="pay-note">{L.payNote}</div>
        </section>

        <section className="fcol">
          <h4>{L.shop}</h4>
          <ul>
            <li><Link to="/shop">{L.navShop}</Link></li>
            <li><Link to="/gallery">{L.navGallery}</Link></li>
            <li><Link to="/progress">{L.navProgress}</Link></li>
            <li><Link to="/assoc">{L.assoc}</Link></li>
            <li><Link to="/press">{L.navPress}</Link></li>
          </ul>
        </section>

        <section className="fcol">
          <h4>{L.help}</h4>
          <ul>
            <li><Link to="/shipping">{L.shipping}</Link></li>
            <li><Link to="/returns">{L.returns}</Link></li>
            <li><Link to="/contact">{L.contact}</Link></li>
            <li><Link to="/terms">{L.terms}</Link></li>
            <li><Link to="/privacy">{L.privacy}</Link></li>
            <li><Link to="/corp">{L.publicReleases}</Link></li>
          </ul>
        </section>

        <section className="fcol newsletter">
          <div className="news-hd">
            <h4>{L.news}</h4>
            {isPreview ? <span className="pill-preview">{previewTag}</span> : null}
          </div>

          <p className="news-copy">{L.newsCopy}</p>

          <form className="nform" onSubmit={submitNewsletter}>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={L.emailPlaceholder}
              disabled={isBusy}
            />
            <button type="submit" disabled={isBusy}>
              {isBusy ? L.newsLoading : L.subscribe}
            </button>
          </form>

          {state === "ok" ? (
            <div className="news-ok">{L.newsletterOk}</div>
          ) : state === "error" ? (
            <div className="news-err" role="status" aria-live="polite">
              {errorMsg || L.newsletterError}
            </div>
          ) : (
            <small className="legal">{L.legal}</small>
          )}

          <div className="social" role="list" aria-label={L.follow}>
            <SocialChip label="Instagram" IconEl={Icon.IG} href={socials.instagram} soonText={socialSoonText("Instagram")} />
            <SocialChip label="TikTok" IconEl={Icon.TT} href={socials.tiktok} soonText={socialSoonText("TikTok")} />
            <SocialChip label="YouTube" IconEl={Icon.YT} href={socials.youtube} soonText={socialSoonText("YouTube")} />
            <SocialChip label="X / Twitter" IconEl={Icon.X} href={socials.x} soonText={socialSoonText("X / Twitter")} />
            <SocialChip label="Facebook" IconEl={Icon.FB} href={socials.facebook} soonText={socialSoonText("Facebook")} />
            <SocialChip label="Threads" IconEl={Icon.TH} href={socials.threads} soonText={socialSoonText("Threads")} />
            <SocialChip label="LinkedIn" IconEl={Icon.IN} href={socials.linkedin} soonText={socialSoonText("LinkedIn")} />
            <SocialChip label="Pinterest" IconEl={Icon.PI} href={socials.pinterest} soonText={socialSoonText("Pinterest")} />
          </div>

          <div className="soon-row">
            <span className="soon-dot" aria-hidden />
            <span className="soon-text">{hasAnySocial ? L.socialLive : L.socialSoon}</span>
          </div>
        </section>
      </div>

      <div className="container fbar">
        <div className="left">
          © {year} Calestra. {L.rights} — {langTag} / {currency}
        </div>

        <div className="right">
          <Link to="/terms">{L.terms}</Link>
          <Link to="/privacy">{L.privacy}</Link>
          <Link to="/cookies">{L.cookiesLink}</Link>

          <button
            type="button"
            className="cookie-manage"
            onClick={openCookieManager}
            aria-label={L.cookiesManage}
            title={L.cookiesManage}
          >
            🍪
          </button>

          <span className="vat">{L.vat}</span>
        </div>
      </div>

      <style>{`
        :root{
          --ft-bg:rgba(255,255,255,.88);
          --ft-border:rgba(15,23,42,.10);
          --ft-text:#0f172a;
          --ft-muted:#475569;
          --ft-chip:rgba(15,23,42,.06);
          --ft-chip-h:rgba(15,23,42,.10);
          --ft-focus:rgba(75,107,250,.45);
          --ft-focus2:rgba(124,58,237,.30);
        }

        .theme-dark{
          --ft-bg:rgba(2,6,23,.82);
          --ft-border:rgba(148,163,184,.12);
          --ft-text:#e5e7eb;
          --ft-muted:#9ca3af;
          --ft-chip:rgba(148,163,184,.10);
          --ft-chip-h:rgba(148,163,184,.16);
          --ft-focus:rgba(165,180,252,.45);
          --ft-focus2:rgba(124,58,237,.28);
        }

        .site-footer{
          margin-top:28px;
          border-top:1px solid var(--ft-border);
          background:var(--ft-bg);
          backdrop-filter:saturate(160%) blur(10px);
          -webkit-backdrop-filter:saturate(160%) blur(10px);
          color:var(--ft-text);
          font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        }

        .site-footer a:focus-visible,
        .site-footer button:focus-visible,
        .site-footer input:focus-visible{
          outline:none;
          box-shadow:0 0 0 3px var(--ft-focus), 0 0 0 6px var(--ft-focus2);
          border-radius:12px;
        }

        .fomo{
          background:linear-gradient(90deg,#0b1120,#0f1220);
          color:rgba(248,250,252,.96);
          border-bottom:1px solid rgba(248,250,252,.14);
        }

        .fomo__in{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:8px 0;
          gap:10px;
        }

        .spark{opacity:.85}

        .fomo__msg{
          font-weight:900;
          letter-spacing:.2px;
          font-size:12.5px;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .fomo__cta{
          display:flex;
          gap:8px;
          flex-shrink:0;
        }

        .fomo__link{
          color:rgba(248,250,252,.96);
          text-decoration:none;
          border:1px solid rgba(248,250,252,.22);
          border-radius:999px;
          padding:5px 10px;
          font-weight:900;
          font-size:12px;
          white-space:nowrap;
        }

        .fomo__link:hover{background:rgba(248,250,252,.10)}

        .fgrid{
          display:grid;
          grid-template-columns:minmax(240px,1.6fr) minmax(140px,1fr) minmax(140px,1fr) minmax(240px,1.4fr);
          gap:18px;
          padding:16px 0 12px;
          align-items:start;
          font-size:12.5px;
        }

        .fcol h4{
          margin:0 0 8px;
          font-size:13px;
          font-weight:950;
          letter-spacing:.2px;
        }

        .fcol ul{
          list-style:none;
          margin:0;
          padding:0;
          display:grid;
          gap:6px;
        }

        .fcol a{
          color:var(--ft-muted);
          text-decoration:none;
          font-weight:650;
        }

        .fcol a:hover{
          color:var(--ft-text);
          text-decoration:underline;
        }

        .fbrand{
          display:inline-flex;
          align-items:center;
          gap:8px;
          text-decoration:none;
          color:var(--ft-text);
          font-weight:950;
          letter-spacing:.06em;
          text-transform:uppercase;
          font-size:12.5px;
        }

        .fmark{
          width:28px;
          height:28px;
          border-radius:999px;
          background:var(--ft-chip);
          border:1px solid var(--ft-border);
          display:inline-flex;
          align-items:center;
          justify-content:center;
        }

        .pill-preview{
          font-size:9px;
          font-weight:950;
          letter-spacing:.14em;
          padding:3px 8px;
          border-radius:999px;
          border:1px solid rgba(250,204,21,.30);
          background:rgba(250,204,21,.10);
          color:rgba(161,98,7,.95);
        }

        .theme-dark .pill-preview{color:rgba(250,204,21,.95)}

        .tag{
          margin:8px 0 10px;
          color:var(--ft-muted);
          max-width:320px;
          line-height:1.45;
        }

        .trust{
          display:flex;
          gap:7px;
          flex-wrap:wrap;
          margin-top:2px;
        }

        .chip{
          display:inline-flex;
          align-items:center;
          gap:6px;
          font-size:11.5px;
          color:var(--ft-muted);
          background:var(--ft-chip);
          border:1px solid var(--ft-border);
          border-radius:999px;
          padding:4px 9px;
          font-weight:850;
        }

        .chip-strong{
          color:var(--ft-text);
          background:linear-gradient(135deg,rgba(75,107,250,.18),rgba(124,58,237,.14));
        }

        .pay{
          display:flex;
          gap:6px;
          align-items:center;
          margin-top:10px;
          flex-wrap:wrap;
          opacity:.96;
        }

        .pay-note{
          margin-top:8px;
          color:var(--ft-muted);
          font-size:11.5px;
          line-height:1.45;
          max-width:340px;
        }

        .news-hd{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          margin-bottom:8px;
        }

        .news-hd h4{margin:0}

        .news-copy{
          margin:0 0 8px;
          color:var(--ft-muted);
          line-height:1.45;
          font-size:12px;
        }

        .newsletter .nform{
          display:flex;
          gap:8px;
          margin-bottom:6px;
        }

        .newsletter input{
          flex:1;
          min-width:0;
          padding:9px 11px;
          border-radius:12px;
          border:1px solid var(--ft-border);
          background:rgba(255,255,255,.92);
          color:var(--ft-text);
          font-size:13px;
        }

        .theme-dark .newsletter input{background:rgba(2,6,23,.65)}

        .newsletter button{
          padding:0 12px;
          height:36px;
          border-radius:12px;
          border:0;
          background:linear-gradient(135deg,#4b6bfa,#7c3aed);
          color:#fff;
          font-weight:950;
          font-size:13px;
          white-space:nowrap;
          cursor:pointer;
        }

        .newsletter button:hover{opacity:.96}

        .newsletter button:disabled{
          opacity:.75;
          cursor:default;
          filter:saturate(.9);
        }

        .newsletter .legal{
          color:var(--ft-muted);
          display:block;
          margin-top:4px;
          line-height:1.45;
          font-size:11.5px;
        }

        .news-ok{
          margin-top:4px;
          font-size:12px;
          font-weight:950;
          color:rgba(16,185,129,.95);
        }

        .news-err{
          margin-top:4px;
          font-size:12px;
          font-weight:900;
          color:rgba(239,68,68,.92);
        }

        .social{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          margin-top:10px;
        }

        .sbtn{
          width:32px;
          height:32px;
          border-radius:12px;
          border:1px solid var(--ft-border);
          display:grid;
          place-items:center;
          font-size:15px;
          background:var(--ft-chip);
          color:var(--ft-text);
          text-decoration:none;
        }

        .sbtn:hover{background:var(--ft-chip-h)}

        .sbtn--disabled{
          cursor:default;
          opacity:.52;
          filter:saturate(.8);
        }

        .soon-row{
          display:flex;
          align-items:center;
          gap:10px;
          margin-top:8px;
          color:var(--ft-muted);
          font-size:11.5px;
        }

        .soon-dot{
          width:7px;
          height:7px;
          border-radius:999px;
          background:rgba(250,204,21,.85);
          box-shadow:0 0 0 5px rgba(250,204,21,.12);
          flex:0 0 auto;
        }

        .fbar{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:10px 0 12px;
          border-top:1px dashed var(--ft-border);
          font-size:12px;
          gap:10px;
          color:var(--ft-muted);
        }

        .fbar .right{
          display:flex;
          gap:10px;
          align-items:center;
          flex-wrap:wrap;
          justify-content:flex-end;
        }

        .fbar .right a{
          color:var(--ft-muted);
          text-decoration:none;
          font-weight:750;
        }

        .fbar .right a:hover{
          color:var(--ft-text);
          text-decoration:underline;
        }

        .cookie-manage{
          border:1px solid var(--ft-border);
          background:var(--ft-chip);
          color:var(--ft-text);
          border-radius:999px;
          padding:6px 10px;
          cursor:pointer;
          font-weight:900;
          font-size:12px;
          line-height:1;
        }

        .cookie-manage:hover{background:var(--ft-chip-h)}

        .vat{opacity:.85}

        @media (max-width:980px){
          .fgrid{
            grid-template-columns:1fr 1fr;
            gap:16px;
          }

          .fcol-brand{
            grid-column:1 / -1;
          }
        }

        @media (max-width:640px){
          .fgrid{
            grid-template-columns:1fr;
          }

          .newsletter .nform{
            flex-direction:column;
          }

          .fomo__in{
            flex-wrap:wrap;
            align-items:flex-start;
          }

          .fomo__msg{
            white-space:normal;
          }

          .fbar{
            flex-direction:column;
            align-items:flex-start;
          }

          .fbar .right{
            justify-content:flex-start;
          }
        }
      `}</style>
    </footer>
  );
}