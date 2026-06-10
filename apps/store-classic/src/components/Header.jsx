// D:\WebProjects\Calestra\apps\store-classic\src\components\Header.jsx
// apps/store-classic/src/components/Header.jsx

import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";

import { useCurrency } from "../context/CurrencyContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useSound } from "../context/SoundContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCampaign } from "../hooks/useCampaign.jsx";
import { convertFromSEK, formatMoney } from "../utils/money.js";
import { TT } from "../i18n/tt.js";

import {
  readCachedAuthUser,
  readCachedAuthState,
  readCurrentSessionToken,
} from "../core/member/memberClient.js";

import {
  MEMBER_LS_KEYS,
  safeGetLS,
  safeSetLS,
  safeRemoveLS,
  safeJsonParse,
  cleanString,
  readCustomerPrefill,
  readIdentityShell,
} from "../core/member/memberMeta.js";

const RECENT_SEARCHES_KEY = "cw.recentSearches";
const SEARCH_KEY = "cw.search";
const MUTED_KEY = "cw.muted";

function getShortLang(i18n) {
  return String(i18n?.resolvedLanguage || i18n?.language || "sv")
    .slice(0, 2)
    .toLowerCase();
}

function pickLang(i18n, values = {}) {
  const lang = getShortLang(i18n);
  return values[lang] || values.sv || values.en || values.tr || "";
}

function getDefaultMemberLabel(i18n) {
  return pickLang(i18n, {
    sv: "Mitt Calestra",
    en: "My Calestra",
    tr: "Benim Calestra",
  });
}

function getLocale(i18n) {
  const lang = getShortLang(i18n);
  if (lang === "tr") return "tr-TR";
  if (lang === "en") return "en-US";
  return "sv-SE";
}

function useRecentSearches() {
  const [list, setList] = React.useState(() => {
    try {
      const parsed = JSON.parse(safeGetLS(RECENT_SEARCHES_KEY, "[]"));
      return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
    } catch {
      return [];
    }
  });

  const push = React.useCallback((q) => {
    const v = String(q || "").trim();
    if (!v) return;

    setList((prev) => {
      const next = [v, ...prev.filter((x) => x !== v)].slice(0, 6);
      safeSetLS(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = React.useCallback(() => {
    safeRemoveLS(RECENT_SEARCHES_KEY);
    setList([]);
  }, []);

  return { list, push, clear };
}

function normalizeMemberLabel(input, i18n) {
  const defaultLabel = getDefaultMemberLabel(i18n);
  const raw = cleanString(input || "", 80);
  if (!raw) return defaultLabel;

  const lower = raw.toLowerCase();
  if (
    lower.includes("gäst") ||
    lower.includes("guest") ||
    lower.includes("misafir") ||
    lower.includes("snabbkassa") ||
    lower.includes("quick checkout")
  ) {
    return defaultLabel;
  }

  return raw;
}

function readMemberEntrySettings(i18n) {
  const defaultLabel = getDefaultMemberLabel(i18n);

  try {
    const raw = safeGetLS(MEMBER_LS_KEYS.memberControl, "");
    if (!raw) {
      return {
        enabled: true,
        label: defaultLabel,
      };
    }

    const parsed = safeJsonParse(raw, {});
    return {
      enabled: parsed?.memberEntryEnabled !== false,
      label: normalizeMemberLabel(parsed?.memberEntryLabel || defaultLabel, i18n),
    };
  } catch {
    return {
      enabled: true,
      label: defaultLabel,
    };
  }
}

function useMemberEntrySettings(i18n) {
  const [cfg, setCfg] = React.useState(() => readMemberEntrySettings(i18n));

  React.useEffect(() => {
    function sync() {
      setCfg(readMemberEntrySettings(i18n));
    }

    sync();

    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("cw:member-auth-changed", sync);
    window.addEventListener("cw:identity-sync", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("cw:member-auth-changed", sync);
      window.removeEventListener("cw:identity-sync", sync);
    };
  }, [i18n]);

  return {
    enabled: cfg?.enabled !== false,
    label: normalizeMemberLabel(cfg?.label || getDefaultMemberLabel(i18n), i18n),
  };
}

function readPresenceSnapshot() {
  try {
    const prefill = readCustomerPrefill();
    const shell = readIdentityShell();
    const member = shell?.member || {};
    const identity = shell?.identity || {};
    const authUser = readCachedAuthUser() || {};
    const authState = readCachedAuthState() || {};
    const sessionToken = readCurrentSessionToken();

    const name = cleanString(
      authUser?.name ||
        prefill?.name ||
        identity?.name ||
        identity?.fullName ||
        member?.name ||
        "",
      160
    );

    const email = cleanString(
      authUser?.email ||
        prefill?.email ||
        identity?.email ||
        member?.email ||
        "",
      160
    );

    const phone = cleanString(prefill?.phone || identity?.phone || member?.phone || "", 80);

    const memberId = cleanString(shell?.memberId || member?.memberId || member?.id || "", 160);

    const userId = cleanString(
      authUser?.id ||
        authUser?.userId ||
        shell?.userId ||
        identity?.userId ||
        identity?.id ||
        "",
      160
    );

    const hasSessionToken = !!sessionToken;
    const isLoggedIn = !!(authState?.loggedIn || hasSessionToken || authUser?.email);
    const hasSavedProfile = !!(name || email || phone);

    return {
      hasIdentity: !!(hasSavedProfile || memberId || isLoggedIn),
      hasSavedProfile,
      hasMember: !!memberId,
      isLoggedIn,
      hasSessionToken,
      name,
      email,
      phone,
      memberId,
      userId,
    };
  } catch {
    return {
      hasIdentity: false,
      hasSavedProfile: false,
      hasMember: false,
      isLoggedIn: false,
      hasSessionToken: false,
      name: "",
      email: "",
      phone: "",
      memberId: "",
      userId: "",
    };
  }
}

function useMemberPresence() {
  const [state, setState] = React.useState(() => readPresenceSnapshot());

  React.useEffect(() => {
    function sync() {
      setState(readPresenceSnapshot());
    }

    sync();

    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("cw:member-auth-changed", sync);
    window.addEventListener("cw:identity-sync", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("cw:member-auth-changed", sync);
      window.removeEventListener("cw:identity-sync", sync);
    };
  }, []);

  return state;
}

function samePathAndSearch(currentPathname, currentSearch, to) {
  const raw = String(to || "");
  const [targetPath, targetSearchRaw = ""] = raw.split("?");
  const targetSearch = targetSearchRaw ? `?${targetSearchRaw}` : "";

  if (targetSearch) {
    return currentPathname === targetPath && currentSearch === targetSearch;
  }

  return currentPathname === targetPath;
}

function getSmartActiveClass(currentPathname, currentSearch, to) {
  return samePathAndSearch(currentPathname, currentSearch, to) ? "active" : "";
}

const I = {
  Menu: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path
        d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 21l-4.3-4.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Moon: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path
        d="M21 14.5A7.5 7.5 0 0 1 9.5 3 6.8 6.8 0 1 0 21 14.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Sun: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l-1.4-1.4M20.4 20.4 19 19M19 5l1.4-1.4M3.6 20.4 5 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  SoundOn: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path
        d="M11 5 6.5 9H3v6h3.5L11 19V5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a4.5 4.5 0 0 1 0 7M18 6a7.5 7.5 0 0 1 0 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  SoundOff: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path
        d="M11 5 6.5 9H3v6h3.5L11 19V5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 9l5 6M21 9l-5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Cart: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path
        d="M6.5 6h15l-1.5 8h-12L6.5 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 6 6 4H3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  Star: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...p}>
      <path
        d="M12 2l2.6 6.6 7.1.5-5.4 4.1 1.8 6.8L12 16.9 5.9 20l1.8-6.8L2.3 9.1l7.1-.5L12 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Spark: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" {...p}>
      <path
        d="M12 2v5M12 17v5M2 12h5M17 12h5M5.6 5.6l3.5 3.5M14.9 14.9l3.5 3.5M18.4 5.6l-3.5 3.5M9.1 14.9l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

function BrandMark() {
  return (
    <span className="mark" aria-hidden="true">
      <img src="/images/brand/mark.svg" alt="" width="24" height="24" />
    </span>
  );
}

function BrandLockup({ tx }) {
  return (
    <>
      <BrandMark />
      <span className="brand-copy">
        <span className="word">Calestra</span>
        <span className="tagline">
          {tx("hdr.tagline", {
            sv: "Harmonic Drops",
            en: "Harmonic Drops",
            tr: "Harmonic Drops",
          })}
        </span>
      </span>
      <span className="brand-badge">
        {tx("hdr.brandBadge", {
          sv: "Early Access",
          en: "Early Access",
          tr: "Erken Erişim",
        })}
      </span>
    </>
  );
}

function SmartLink({ to, children, className = "nav-link", pathname, search, onClick }) {
  const active = getSmartActiveClass(pathname, search, to);
  return (
    <Link
      to={to}
      className={`${className} ${active}`.trim()}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

function MobileDrawer({
  menuOpen,
  setMenuOpen,
  tx,
  i18n,
  pathname,
  search,
  memberEntry,
  memberText,
  userDisplayName,
  memberSubText,
  currency,
  setCurrency,
  currencyOptions,
  toggleTheme,
  theme,
  muted,
  toggleSound,
  freeShipText,
  goToPortal,
}) {
  if (typeof document === "undefined") return null;

  const close = () => setMenuOpen(false);

  return createPortal(
    <div className={`drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
      <div className="backdrop" onClick={close} />
      <div
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label={tx("nav.primary", {
          sv: "Huvudmeny",
          en: "Main menu",
          tr: "Ana menü",
        })}
      >
        <div className="panel-top">
          <div className="panel-brand">
            <BrandMark />
            <span>Calestra</span>
          </div>

          <button
            className="close"
            onClick={close}
            aria-label={tx("nav.close", {
              sv: "Stäng",
              en: "Close",
              tr: "Kapat",
            })}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="panel-hot">
          <span className="panel-hot-badge">
            {tx("hdr.brandBadge", {
              sv: "Early Access",
              en: "Early Access",
              tr: "Erken Erişim",
            })}
          </span>
          <p>
            {tx("hdr.panelCopy", {
              sv: "Utvalda drop’ar, känslodriven design och begränsade vågor.",
              en: "Selected drops, emotion-driven design, and limited waves.",
              tr: "Seçili drop’lar, duygu odaklı tasarım ve sınırlı dalgalar.",
            })}
          </p>
        </div>

        <div className="panel-links">
          <SmartLink to="/shop" pathname={pathname} search={search} onClick={close}>
            {tx("nav.shop", { sv: "Butik", en: "Shop", tr: "Mağaza" })}
          </SmartLink>

          <SmartLink to="/gallery" pathname={pathname} search={search} onClick={close}>
            {tx("nav.gallery", { sv: "Galleri", en: "Gallery", tr: "Galeri" })}
          </SmartLink>

          <SmartLink to="/shop?cat=surprise-boxes" pathname={pathname} search={search} onClick={close}>
            {tx("nav.surpriseBoxes", {
              sv: "Surprise Boxes",
              en: "Surprise Boxes",
              tr: "Surprise Boxes",
            })}
          </SmartLink>

          <SmartLink to="/progress" pathname={pathname} search={search} onClick={close}>
            {tx("nav.progress", { sv: "Progress", en: "Progress", tr: "Progress" })}
          </SmartLink>

          <SmartLink to="/press" pathname={pathname} search={search} onClick={close}>
            {tx("nav.press", { sv: "Press", en: "Press", tr: "Basın" })}
          </SmartLink>

          <SmartLink to="/corp" pathname={pathname} search={search} onClick={close}>
            {tx("nav.publicReleases", {
              sv: "Publika dokument",
              en: "Public Releases",
              tr: "Yayınlanan belgeler",
            })}
          </SmartLink>

          {memberEntry.enabled ? (
            <Link to="/member" className="member-panel-link" onClick={close}>
              <span className="member-panel-title">{memberText}</span>
              <span className="member-panel-sub">{userDisplayName || memberSubText}</span>
            </Link>
          ) : null}

          <Link to="/assoc" className="nav-cta mobile-cta ghost" onClick={close}>
            {tx("nav.assoc", { sv: "Bli Associate", en: "Become an Associate", tr: "Associate ol" })}
          </Link>

          <Link to="/shop" className="nav-cta mobile-cta hot" onClick={close}>
            {tx("nav.dropCta", {
              sv: "Se heta drops",
              en: "See hot drops",
              tr: "Popüler drop’ları gör",
            })}
          </Link>

          <button
            type="button"
            className="portal mobile-portal"
            onClick={() => {
              close();
              goToPortal();
            }}
          >
            <I.Star />
            <span>
              {tx("portal.cta", {
                sv: "Calestra World",
                en: "Calestra World",
                tr: "Calestra World",
              })}
            </span>
          </button>
        </div>

        <div className="panel-settings">
          <div className="panel-settings-hd">
            {tx("hdr.settings", { sv: "Inställningar", en: "Settings", tr: "Ayarlar" })}
          </div>

          <div className="panel-grid">
            <label className="panel-field">
              <span>{tx("nav.language.label", { sv: "Språk", en: "Language", tr: "Dil" })}</span>
              <select
                value={getShortLang(i18n)}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                aria-label={tx("nav.language.label", {
                  sv: "Språk",
                  en: "Language",
                  tr: "Dil",
                })}
              >
                <option value="sv">SV</option>
                <option value="en">EN</option>
                <option value="tr">TR</option>
              </select>
            </label>

            <label className="panel-field">
              <span>
                {tx("nav.currency.label", {
                  sv: "Valuta",
                  en: "Currency",
                  tr: "Para birimi",
                })}
              </span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label={tx("nav.currency.label", {
                  sv: "Valuta",
                  en: "Currency",
                  tr: "Para birimi",
                })}
              >
                {currencyOptions.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <button className="panel-action" type="button" onClick={toggleTheme}>
              {theme === "light" ? <I.Sun /> : <I.Moon />}
              <span>
                {tx("nav.theme.toggle", {
                  sv: "Byt tema",
                  en: "Change theme",
                  tr: "Temayı değiştir",
                })}
              </span>
            </button>

            <button className={`panel-action ${muted ? "muted" : ""}`} type="button" onClick={toggleSound}>
              {muted ? <I.SoundOff /> : <I.SoundOn />}
              <span>
                {muted
                  ? tx("nav.sound.on", { sv: "Slå på ljud", en: "Turn sound on", tr: "Sesi aç" })
                  : tx("nav.sound.off", {
                      sv: "Stäng av ljud",
                      en: "Turn sound off",
                      tr: "Sesi kapat",
                    })}
              </span>
            </button>

            <div className="panel-freeship" title={freeShipText}>
              {freeShipText}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, rates, locale } = useCurrency();
  const { theme, toggle: toggleTheme } = useTheme();
  const { count } = useCart();
  const { muted, toggle: toggleSound } = useSound();
  const { isAuthenticated, user, member } = useAuth();

  const tx = React.useCallback((key, fallback, opts) => TT(i18n, t, key, fallback, opts), [i18n, t]);

  const memberEntry = useMemberEntrySettings(i18n);
  const memberPresence = useMemberPresence();

  const nav = useNavigate();
  const location = useLocation();
  const { pathname, search } = location;

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [q, setQ] = React.useState(() => safeGetLS(SEARCH_KEY, ""));
  const { list: recent, push: pushRecent, clear: clearRecent } = useRecentSearches();

  const searchRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const [recentIndex, setRecentIndex] = React.useState(-1);

  const campaign = useCampaign();
  const campaignId = campaign?.id || "";
  const campaignTheme = campaign?.themeKey || campaignId || "";

  React.useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname, search]);

  React.useEffect(() => {
    function onDown(ev) {
      if (!searchRef.current) return;
      if (searchRef.current.contains(ev.target)) return;
      setSearchOpen(false);
    }

    if (searchOpen) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [searchOpen]);

  React.useEffect(() => {
    function onKey(e) {
      const el = e.target;
      const inField =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

      if (
        (!inField && e.key === "/") ||
        (String(e.key || "").toLowerCase() === "k" && (e.ctrlKey || e.metaKey))
      ) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }

      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }

      if (!inField && String(e.key || "").toLowerCase() === "g") {
        let fired = false;

        const onNext = (evt) => {
          if (fired) return;
          fired = true;
          window.removeEventListener("keydown", onNext, true);

          const kk = String(evt.key || "").toLowerCase();
          if (kk === "c") nav("/cart");
          else if (kk === "s") nav("/shop");
          else if (kk === "m") nav("/member");
        };

        window.addEventListener("keydown", onNext, true);
        setTimeout(() => {
          if (!fired) window.removeEventListener("keydown", onNext, true);
        }, 700);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav]);

  React.useEffect(() => {
    safeSetLS(MUTED_KEY, muted ? "1" : "0");
  }, [muted]);

  React.useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const { body, documentElement } = document;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyTouchAction = body.style.touchAction;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevHtmlOverflow = documentElement.style.overflow;
    const prevHtmlTouchAction = documentElement.style.touchAction;
    const prevHtmlOverscroll = documentElement.style.overscrollBehavior;

    if (menuOpen) {
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
      body.style.overscrollBehavior = "none";
      documentElement.style.overflow = "hidden";
      documentElement.style.touchAction = "none";
      documentElement.style.overscrollBehavior = "none";
    }

    return () => {
      body.style.overflow = prevBodyOverflow;
      body.style.touchAction = prevBodyTouchAction;
      body.style.overscrollBehavior = prevBodyOverscroll;
      documentElement.style.overflow = prevHtmlOverflow;
      documentElement.style.touchAction = prevHtmlTouchAction;
      documentElement.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, [menuOpen]);

  const prevCountRef = React.useRef(count);
  const [pulse, setPulse] = React.useState(false);

  React.useEffect(() => {
    if (count > (prevCountRef.current || 0)) {
      setPulse(true);
      const to = setTimeout(() => setPulse(false), 450);
      prevCountRef.current = count;
      return () => clearTimeout(to);
    }

    prevCountRef.current = count;
  }, [count]);

  function submitSearch(e) {
    e?.preventDefault?.();

    const value = String(q || "").trim();
    safeSetLS(SEARCH_KEY, value);
    if (value) pushRecent(value);

    nav(`/shop${value ? `?q=${encodeURIComponent(value)}` : ""}`);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  function onSearchKeyDown(e) {
    if (!recent.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setRecentIndex((i) => (i + 1) % recent.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setRecentIndex((i) => (i <= 0 ? recent.length - 1 : i - 1));
    } else if (e.key === "Enter" && recentIndex >= 0) {
      e.preventDefault();
      const next = recent[recentIndex];
      setQ(next);
      safeSetLS(SEARCH_KEY, next);
      pushRecent(next);
      nav(`/shop?q=${encodeURIComponent(next)}`);
      setSearchOpen(false);
      setMenuOpen(false);
    }
  }

  const NavItem = ({ to, label }) => (
    <SmartLink to={to} pathname={pathname} search={search} onClick={() => setMenuOpen(false)}>
      {label}
    </SmartLink>
  );

  const currencyOptions = React.useMemo(
    () => [
      { v: "SEK", label: "SEK" },
      { v: "EUR", label: "EUR" },
      { v: "USD", label: "USD" },
      { v: "TRY", label: "TRY" },
    ],
    []
  );

  const goToPortal = React.useCallback(() => {
    const worldUrl = String(import.meta?.env?.VITE_WORLD_URL || "").trim();

    if (/^https?:\/\//i.test(worldUrl)) {
      window.location.href = worldUrl;
      return;
    }

    nav("/progress");
  }, [nav]);

  const promoText = React.useMemo(() => {
    if (campaign?.fomo) return campaign.fomo;

    return tx("promo.default", {
      sv: "Just nu: begränsad release i butiken.",
      en: "Now live: limited release in the shop.",
      tr: "Şimdi yayında: mağazada sınırlı release.",
    });
  }, [campaign?.fomo, tx]);

  const freeShipThresholdSEK = React.useMemo(() => {
    const env = Number(import.meta?.env?.VITE_FREE_SHIP_SEK);
    return Number.isFinite(env) && env > 0 ? env : 500;
  }, []);

  const freeShipText = React.useMemo(() => {
    const amountActive = convertFromSEK(freeShipThresholdSEK, currency, rates);
    const pretty = formatMoney(amountActive, currency, locale || getLocale(i18n));
    const approx = currency !== "SEK" ? "≈ " : "";
    const amount = `${approx}${pretty}`;

    return pickLang(i18n, {
      sv: `Fri frakt i Sverige över ${amount}`,
      en: `Free shipping in Sweden over ${amount}`,
      tr: `İsveç’te ${amount} üzeri ücretsiz kargo`,
    });
  }, [freeShipThresholdSEK, currency, rates, locale, i18n]);

  const defaultMemberLabel = tx("nav.member", {
    sv: "Mitt Calestra",
    en: "My Calestra",
    tr: "Benim Calestra",
  });

  const memberText =
    memberEntry.label === "Mitt Calestra" ||
    memberEntry.label === "My Calestra" ||
    memberEntry.label === "Benim Calestra"
      ? defaultMemberLabel
      : memberEntry.label || defaultMemberLabel;

  const isHeaderLoggedIn = !!(isAuthenticated || memberPresence.isLoggedIn);

  const memberSubText = React.useMemo(() => {
    if (isHeaderLoggedIn && member?.tier) {
      return pickLang(i18n, {
        sv: `Privat rum • ${String(member.tier)} • DreamPoints`,
        en: `Private room • ${String(member.tier)} • DreamPoints`,
        tr: `Özel alan • ${String(member.tier)} • DreamPoints`,
      });
    }

    if (isHeaderLoggedIn) {
      return tx("hdr.memberSub.loggedIn", {
        sv: "Privat rum • inloggad • DreamPoints",
        en: "Private room • logged in • DreamPoints",
        tr: "Özel alan • giriş yapıldı • DreamPoints",
      });
    }

    if (memberPresence.hasMember) {
      return tx("hdr.memberSub.member", {
        sv: "Privat rum • medlem • DreamPoints",
        en: "Private room • member • DreamPoints",
        tr: "Özel alan • üye • DreamPoints",
      });
    }

    if (memberPresence.hasSavedProfile || memberPresence.hasIdentity) {
      return tx("hdr.memberSub.saved", {
        sv: "Privat rum • sparade uppgifter • DreamPoints",
        en: "Private room • saved details • DreamPoints",
        tr: "Özel alan • kayıtlı bilgiler • DreamPoints",
      });
    }

    return tx("hdr.memberSub.default", {
      sv: "Privat rum för sparade uppgifter och framtida förmåner",
      en: "Private room for saved details and future benefits",
      tr: "Kayıtlı bilgiler ve gelecek avantajlar için özel alan",
    });
  }, [
    i18n,
    tx,
    isHeaderLoggedIn,
    member?.tier,
    memberPresence.hasMember,
    memberPresence.hasSavedProfile,
    memberPresence.hasIdentity,
  ]);

  const memberChipLabel = isHeaderLoggedIn
    ? tx("hdr.memberState.loggedIn", {
        sv: "Inloggad",
        en: "Logged in",
        tr: "Giriş yapıldı",
      })
    : memberPresence.hasSavedProfile || memberPresence.hasMember
      ? tx("hdr.memberState.saved", {
          sv: "Privat rum",
          en: "Private room",
          tr: "Özel alan",
        })
      : tx("hdr.memberState.guest", {
          sv: "Gäst",
          en: "Guest",
          tr: "Misafir",
        });

  const userDisplayName = cleanString(user?.email || memberPresence?.email || memberPresence?.name || "", 120);

  const ui = React.useMemo(
    () => ({
      skip: TT(i18n, t, "a11y.skip", {
        sv: "Hoppa till innehåll",
        en: "Skip to content",
        tr: "İçeriğe geç",
      }),
      heatNew: TT(i18n, t, "hdr.heat.new", {
        sv: "DROP MODE",
        en: "DROP MODE",
        tr: "DROP MODE",
      }),
      heatCopy: TT(i18n, t, "hdr.heat.copy", {
        sv: "Mindre massmarknad. Mer releasekänsla.",
        en: "Less mass market. More launch energy.",
        tr: "Daha az seri pazar. Daha çok lansman hissi.",
      }),
      shopNow: TT(i18n, t, "promo.shopNow", {
        sv: "Handla nu",
        en: "Shop now",
        tr: "Şimdi alışveriş yap",
      }),
      surpriseBoxes: TT(i18n, t, "nav.surpriseBoxes", {
        sv: "Surprise Boxes",
        en: "Surprise Boxes",
        tr: "Surprise Boxes",
      }),
      menuOpen: TT(i18n, t, "nav.toggle", {
        sv: "Öppna meny",
        en: "Open menu",
        tr: "Menüyü aç",
      }),
      home: TT(i18n, t, "nav.home", {
        sv: "Calestra – Hem",
        en: "Calestra — Home",
        tr: "Calestra — Ana sayfa",
      }),
      portal: TT(i18n, t, "portal.cta", {
        sv: "Calestra World",
        en: "Calestra World",
        tr: "Calestra World",
      }),
      limited: TT(i18n, t, "hdr.limited", {
        sv: "Utvalda släpp live nu",
        en: "Selected releases live now",
        tr: "Seçili lansmanlar şimdi yayında",
      }),
      searchTitle: TT(i18n, t, "nav.search", {
        sv: "Sök (/ eller Ctrl+K)",
        en: "Search (/ or Ctrl+K)",
        tr: "Ara (/ veya Ctrl+K)",
      }),
      searchPlaceholder: TT(i18n, t, "search.placeholder", {
        sv: "Sök efter nästa favorit…",
        en: "Search for your next favorite…",
        tr: "Sıradaki favorini ara…",
      }),
      searchAria: TT(i18n, t, "search.aria", {
        sv: "Sök i butiken",
        en: "Search the shop",
        tr: "Mağazada ara",
      }),
      searchGo: TT(i18n, t, "search.go", {
        sv: "Sök",
        en: "Search",
        tr: "Ara",
      }),
      recent: TT(i18n, t, "search.recent", {
        sv: "Senaste sökningar",
        en: "Recent searches",
        tr: "Son aramalar",
      }),
      clear: TT(i18n, t, "search.clear", {
        sv: "Rensa",
        en: "Clear",
        tr: "Temizle",
      }),
      language: TT(i18n, t, "nav.language.label", {
        sv: "Språk",
        en: "Language",
        tr: "Dil",
      }),
      currency: TT(i18n, t, "nav.currency.label", {
        sv: "Valuta",
        en: "Currency",
        tr: "Para birimi",
      }),
      themeToggle: TT(i18n, t, "nav.theme.toggle", {
        sv: "Byt tema",
        en: "Change theme",
        tr: "Temayı değiştir",
      }),
      soundOn: TT(i18n, t, "nav.sound.on", {
        sv: "Slå på ljud",
        en: "Turn sound on",
        tr: "Sesi aç",
      }),
      soundOff: TT(i18n, t, "nav.sound.off", {
        sv: "Stäng av ljud",
        en: "Turn sound off",
        tr: "Sesi kapat",
      }),
      cart: TT(i18n, t, "nav.cart", {
        sv: "Varukorg",
        en: "Cart",
        tr: "Sepet",
      }),
      primaryNav: TT(i18n, t, "nav.primary", {
        sv: "Huvudmeny",
        en: "Main menu",
        tr: "Ana menü",
      }),
      shop: TT(i18n, t, "nav.shop", {
        sv: "Butik",
        en: "Shop",
        tr: "Mağaza",
      }),
      gallery: TT(i18n, t, "nav.gallery", {
        sv: "Galleri",
        en: "Gallery",
        tr: "Galeri",
      }),
      progress: TT(i18n, t, "nav.progress", {
        sv: "Progress",
        en: "Progress",
        tr: "Progress",
      }),
      press: TT(i18n, t, "nav.press", {
        sv: "Press",
        en: "Press",
        tr: "Basın",
      }),
      publicReleases: TT(i18n, t, "nav.publicReleases", {
        sv: "Publika dokument",
        en: "Public Releases",
        tr: "Yayınlanan belgeler",
      }),
      assoc: TT(i18n, t, "nav.assoc", {
        sv: "Bli Associate",
        en: "Become an Associate",
        tr: "Associate ol",
      }),
      dropCta: TT(i18n, t, "nav.dropCta", {
        sv: "Se heta drops",
        en: "See hot drops",
        tr: "Popüler drop’ları gör",
      }),
    }),
    [i18n, t]
  );

  return (
    <>
      <header
        className={`cw-header ${campaignId ? "has-campaign" : ""} ${
          campaignTheme ? `header--${campaignTheme}` : ""
        }`}
        role="banner"
      >
        <a className="skip" href="#main">
          {ui.skip}
        </a>

        <div className="heatline" aria-hidden="true">
          <div className="cw-container heatline-inner">
            <span className="heat-chip">
              <I.Spark />
              <span>{ui.heatNew}</span>
            </span>
            <span className="heat-text">{ui.heatCopy}</span>
          </div>
        </div>

        <div className={`promo-bar promo--${campaignId || "default"}`} role="note" aria-live="polite">
          <div className="cw-container promo-inner">
            <div className="promo-msg">{promoText}</div>
            <div className="promo-cta">
              <Link to="/shop" className="promo-link">
                {ui.shopNow}
              </Link>
              <Link to="/shop?cat=surprise-boxes" className="promo-link ghost">
                {ui.surpriseBoxes}
              </Link>
            </div>
          </div>
        </div>

        <div className="cw-container topbar">
          <div className="top-left">
            <button
              aria-label={ui.menuOpen}
              className="iconbtn mobile"
              onClick={() => setMenuOpen(true)}
              type="button"
            >
              <I.Menu />
            </button>

            <Link to="/" className="brand" aria-label={ui.home}>
              <BrandLockup tx={tx} />
            </Link>

            <button type="button" className="portal portal-desktop" onClick={goToPortal}>
              <I.Star />
              <span>{ui.portal}</span>
            </button>
          </div>

          <div className="top-center desktop">
            {memberEntry.enabled ? (
              <Link to="/member" className="member-top-link" aria-label={memberText}>
                <div className="member-top-row">
                  <span className="member-top-title">{memberText}</span>
                  <span className="member-top-chip">{memberChipLabel}</span>
                </div>
                <span className="member-top-sub" title={userDisplayName || memberSubText}>
                  {userDisplayName || memberSubText}
                </span>
              </Link>
            ) : (
              <div className="header-note-pill">
                <span className="pulse-dot" />
                <span>{ui.limited}</span>
              </div>
            )}
          </div>

          <div className="top-right">
            <span className="freeship widescreen" title={freeShipText}>
              {freeShipText}
            </span>

            <div className={`search ${searchOpen ? "open" : ""}`} ref={searchRef}>
              <button
                className="iconbtn"
                aria-expanded={searchOpen}
                aria-controls="hdr-search"
                title={ui.searchTitle}
                onClick={() => {
                  setSearchOpen((s) => !s);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                type="button"
              >
                <I.Search />
              </button>

              {searchOpen ? (
                <form id="hdr-search" className="search-form" onSubmit={submitSearch} role="search">
                  <input
                    ref={inputRef}
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setRecentIndex(-1);
                    }}
                    onKeyDown={onSearchKeyDown}
                    placeholder={ui.searchPlaceholder}
                    aria-label={ui.searchAria}
                  />

                  <button className="go" type="submit">
                    {ui.searchGo}
                  </button>

                  {!!recent.length && (
                    <div className="recent">
                      <div className="recent-hd">
                        <span>{ui.recent}</span>
                        <button type="button" className="link-clear" onClick={clearRecent}>
                          {ui.clear}
                        </button>
                      </div>

                      <div className="recent-list">
                        {recent.map((s, i) => (
                          <button
                            key={`${s}-${i}`}
                            type="button"
                            className={`recent-item ${i === recentIndex ? "is-active" : ""}`}
                            onMouseEnter={() => setRecentIndex(i)}
                            onMouseLeave={() => setRecentIndex(-1)}
                            onClick={() => {
                              setQ(s);
                              safeSetLS(SEARCH_KEY, s);
                              pushRecent(s);
                              nav(`/shop?q=${encodeURIComponent(s)}`);
                              setSearchOpen(false);
                              setMenuOpen(false);
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              ) : null}
            </div>

            <div className="settings desktop">
              <select
                className="pillselect"
                value={getShortLang(i18n)}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                title={ui.language}
                aria-label={ui.language}
              >
                <option value="sv">SV</option>
                <option value="en">EN</option>
                <option value="tr">TR</option>
              </select>

              <select
                className="pillselect"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                title={ui.currency}
                aria-label={ui.currency}
              >
                {currencyOptions.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>

              <button className="iconbtn" onClick={toggleTheme} aria-label={ui.themeToggle} type="button">
                {theme === "light" ? <I.Sun /> : <I.Moon />}
              </button>

              <button
                className={`iconbtn ${muted ? "muted" : ""}`}
                onClick={toggleSound}
                aria-label={muted ? ui.soundOn : ui.soundOff}
                type="button"
              >
                {muted ? <I.SoundOff /> : <I.SoundOn />}
              </button>
            </div>

            <Link to="/cart" className={`iconbtn cart ${pulse ? "pulse" : ""}`} aria-label={ui.cart}>
              <I.Cart />
              {count > 0 ? (
                <span className="badge" aria-live="polite">
                  {count}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <div className="cw-container navrow desktop" aria-label={ui.primaryNav}>
          <nav className="main-nav">
            <NavItem to="/shop" label={ui.shop} />
            <NavItem to="/gallery" label={ui.gallery} />
            <NavItem to="/shop?cat=surprise-boxes" label={ui.surpriseBoxes} />
            <NavItem to="/progress" label={ui.progress} />
            <NavItem to="/press" label={ui.press} />
            <NavItem to="/corp" label={ui.publicReleases} />
            {memberEntry.enabled ? <NavItem to="/member" label={memberText} /> : null}
          </nav>

          <div className="nav-right">
            <Link to="/assoc" className="nav-cta ghost" onClick={() => setMenuOpen(false)}>
              {ui.assoc}
            </Link>
            <Link to="/shop" className="nav-cta hot" onClick={() => setMenuOpen(false)}>
              {ui.dropCta}
            </Link>
          </div>
        </div>

        <style>{`
          .cw-header,
          .cw-header *{
            box-sizing:border-box;
          }

          .cw-header{
            position:sticky;
            top:0;
            z-index:1200;
            isolation:isolate;
            width:100%;
            left:0;
            right:0;
            overflow:visible;
            background:linear-gradient(180deg, rgba(255,255,255,.985), rgba(255,255,255,.94));
            backdrop-filter:blur(18px) saturate(150%);
            -webkit-backdrop-filter:blur(18px) saturate(150%);
            border-bottom:1px solid rgba(15,23,42,.075);
            box-shadow:0 10px 34px rgba(15,23,42,.055);
            font-family:system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .theme-dark .cw-header{
            background:linear-gradient(180deg, rgba(7,11,18,.96), rgba(7,11,18,.90));
            border-bottom-color:rgba(255,255,255,.08);
            box-shadow:0 10px 34px rgba(0,0,0,.26);
          }

          .skip{
            position:absolute;
            left:-999px;
            top:-999px;
            background:#111827;
            color:#fff;
            padding:8px 10px;
            border-radius:10px;
            z-index:1300;
          }

          .skip:focus{
            left:12px;
            top:12px;
          }

          .cw-container{
            max-width:1320px;
            margin:0 auto;
            padding:0 18px;
          }

          .heatline{
            position:relative;
            z-index:1;
            border-bottom:1px solid rgba(15,23,42,.06);
            background:
              radial-gradient(circle at 18% 50%, rgba(251,191,36,.10), transparent 22%),
              linear-gradient(90deg, rgba(15,23,42,.03), rgba(99,102,241,.055), rgba(15,23,42,.03));
            pointer-events:none;
          }

          .theme-dark .heatline{
            border-bottom-color:rgba(255,255,255,.07);
            background:
              radial-gradient(circle at 18% 50%, rgba(251,191,36,.10), transparent 22%),
              linear-gradient(90deg, rgba(255,255,255,.03), rgba(99,102,241,.12), rgba(255,255,255,.03));
          }

          .heatline-inner{
            display:flex;
            align-items:center;
            justify-content:center;
            gap:10px;
            min-height:34px;
            font-size:11px;
            font-weight:900;
            letter-spacing:.08em;
            text-transform:uppercase;
            pointer-events:none;
          }

          .heat-chip{
            display:inline-flex;
            align-items:center;
            gap:6px;
            padding:4px 9px;
            border-radius:999px;
            background:rgba(15,23,42,.88);
            color:#fff;
            flex:0 0 auto;
            pointer-events:none;
          }

          .theme-dark .heat-chip{
            background:rgba(248,250,252,.92);
            color:#0b1220;
          }

          .heat-text{
            opacity:.82;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            pointer-events:none;
          }

          .promo-bar{
            position:relative;
            z-index:2;
            background:#0f172a;
            color:#e5e7eb;
            font-size:13px;
            pointer-events:none;
          }

          .promo--xmas{ background:linear-gradient(90deg,#0b1120,#1f2937); }
          .promo--black-week{ background:#020617; }
          .promo--valentines{ background:linear-gradient(90deg,#be123c,#9f1239); }
          .promo--eid,
          .promo--ramadan{ background:radial-gradient(circle at 0 0,#facc15,#0f172a); }
          .promo--default{ background:linear-gradient(90deg,#111827,#1e293b,#111827); }

          .promo-inner{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
            padding:8px 0;
            pointer-events:none;
          }

          .promo-msg{
            min-width:0;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            opacity:.95;
            font-weight:900;
            letter-spacing:.01em;
            pointer-events:none;
          }

          .promo-cta{
            display:flex;
            gap:8px;
            flex:0 0 auto;
            pointer-events:auto;
          }

          .promo-link{
            position:relative;
            z-index:3;
            font-size:12px;
            min-height:30px;
            padding:0 12px;
            border-radius:999px;
            text-decoration:none;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            background:#f9fafb;
            color:#111827;
            font-weight:900;
            border:1px solid rgba(255,255,255,.35);
            transition:transform .12s ease, background .12s ease, border-color .12s ease;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .promo-link:hover{
            transform:translateY(-1px);
          }

          .promo-link.ghost{
            background:transparent;
            color:#e5e7eb;
            border:1px solid rgba(249,250,251,.5);
          }

          .promo-link:focus-visible,
          .nav-link:focus-visible,
          .nav-cta:focus-visible,
          .brand:focus-visible,
          .member-top-link:focus-visible,
          .iconbtn:focus-visible,
          .portal:focus-visible,
          .pillselect:focus-visible,
          .close:focus-visible,
          .panel-action:focus-visible,
          .panel-field select:focus-visible,
          .recent-item:focus-visible,
          .go:focus-visible,
          .link-clear:focus-visible{
            outline:2px solid #4B6BFA;
            outline-offset:2px;
          }

          .topbar{
            position:relative;
            z-index:4;
            display:grid;
            grid-template-columns:minmax(310px, 1.1fr) minmax(220px, .78fr) minmax(420px, auto);
            align-items:center;
            gap:14px;
            padding:12px 0;
            background:inherit;
          }

          .top-left,
          .top-center,
          .top-right{
            min-width:0;
            display:flex;
            align-items:center;
            gap:10px;
            position:relative;
          }

          .top-left{
            overflow:hidden;
          }

          .top-center{
            justify-content:center;
            z-index:1;
          }

          .top-right{
            justify-content:flex-end;
            flex-wrap:nowrap;
          }

          .brand{
            min-width:0;
            display:flex;
            align-items:center;
            gap:12px;
            text-decoration:none;
            color:#0f172a;
            font-weight:900;
            flex:0 1 auto;
            overflow:hidden;
            border-radius:16px;
            transition:transform .12s ease, opacity .12s ease;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .brand:hover{
            transform:translateY(-1px);
          }

          .theme-dark .brand{
            color:#f1f5f9;
          }

          .mark{
            width:34px;
            height:34px;
            border-radius:999px;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            flex:0 0 auto;
            background:
              radial-gradient(circle at 35% 35%, rgba(250,204,21,.20), rgba(250,204,21,0) 68%),
              rgba(255,255,255,.5);
            border:1px solid rgba(245,158,11,.16);
            box-shadow:0 10px 22px rgba(245,158,11,.08);
            pointer-events:none;
          }

          .theme-dark .mark{
            background:
              radial-gradient(circle at 35% 35%, rgba(250,204,21,.18), rgba(250,204,21,0) 68%),
              rgba(255,255,255,.04);
            border-color:rgba(251,191,36,.18);
          }

          .mark img{
            border-radius:999px;
            display:block;
            width:24px;
            height:24px;
            pointer-events:none;
          }

          .brand-copy{
            min-width:0;
            display:flex;
            flex-direction:column;
            gap:2px;
            pointer-events:none;
          }

          .word{
            font-size:16px;
            line-height:1;
            text-transform:uppercase;
            letter-spacing:.12em;
            white-space:nowrap;
          }

          .tagline{
            font-size:11px;
            line-height:1.2;
            opacity:.72;
            font-weight:900;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            letter-spacing:.06em;
            text-transform:uppercase;
          }

          .brand-badge{
            display:inline-flex;
            align-items:center;
            justify-content:center;
            min-height:26px;
            padding:0 10px;
            border-radius:999px;
            background:linear-gradient(135deg, rgba(251,191,36,.18), rgba(249,115,22,.14));
            border:1px solid rgba(249,115,22,.28);
            font-size:11px;
            font-weight:1000;
            white-space:nowrap;
            flex:0 0 auto;
            pointer-events:none;
          }

          .portal{
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            min-height:40px;
            padding:0 14px;
            border-radius:999px;
            border:1px solid rgba(75,107,250,.28);
            background:rgba(75,107,250,.09);
            color:#0f172a;
            font-weight:900;
            cursor:pointer;
            white-space:nowrap;
            flex:0 0 auto;
            transition:transform .12s ease, background .12s ease, border-color .12s ease;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .portal:hover{
            background:rgba(75,107,250,.15);
            transform:translateY(-1px);
          }

          .theme-dark .portal{
            color:#e6e7ea;
            border-color:rgba(124,139,255,.32);
            background:rgba(124,139,255,.10);
          }

          .portal-desktop{
            max-width:180px;
          }

          .member-top-link{
            position:relative;
            z-index:1;
            width:min(100%, 320px);
            min-height:46px;
            padding:8px 12px;
            border-radius:16px;
            border:1px solid rgba(15,23,42,.10);
            background:
              radial-gradient(circle at top right, rgba(75,107,250,.08), transparent 42%),
              rgba(255,255,255,.84);
            color:#0f172a;
            text-decoration:none;
            display:flex;
            flex-direction:column;
            justify-content:center;
            gap:4px;
            overflow:hidden;
            transition:transform .12s ease, background .12s ease, border-color .12s ease;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .member-top-link:hover{
            background:rgba(15,23,42,.05);
            transform:translateY(-1px);
          }

          .theme-dark .member-top-link{
            background:
              radial-gradient(circle at top right, rgba(124,139,255,.13), transparent 42%),
              rgba(11,18,32,.58);
            border-color:rgba(255,255,255,.10);
            color:#f8fafc;
          }

          .member-top-row{
            display:flex;
            align-items:center;
            gap:8px;
            min-width:0;
            pointer-events:none;
          }

          .member-top-title{
            font-size:12px;
            font-weight:1000;
            line-height:1.1;
            min-width:0;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
          }

          .member-top-chip{
            min-height:20px;
            padding:0 7px;
            border-radius:999px;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            background:rgba(75,107,250,.10);
            border:1px solid rgba(75,107,250,.22);
            color:#3557d6;
            font-size:10px;
            font-weight:1000;
            white-space:nowrap;
            flex:0 0 auto;
          }

          .theme-dark .member-top-chip{
            background:rgba(124,139,255,.12);
            border-color:rgba(124,139,255,.24);
            color:#cdd7ff;
          }

          .member-top-sub{
            font-size:11px;
            line-height:1.2;
            opacity:.74;
            font-weight:900;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            pointer-events:none;
          }

          .header-note-pill{
            display:inline-flex;
            align-items:center;
            gap:8px;
            min-height:40px;
            padding:0 12px;
            border-radius:999px;
            border:1px solid rgba(15,23,42,.10);
            background:rgba(255,255,255,.68);
            font-size:12px;
            font-weight:900;
            color:#0f172a;
            white-space:nowrap;
            max-width:100%;
            pointer-events:none;
          }

          .theme-dark .header-note-pill{
            background:rgba(11,18,32,.55);
            border-color:rgba(255,255,255,.10);
            color:#e6e7ea;
          }

          .pulse-dot{
            width:8px;
            height:8px;
            border-radius:999px;
            background:#f97316;
            box-shadow:0 0 0 0 rgba(249,115,22,.5);
            animation:headerPulse 1.7s infinite;
            flex:0 0 auto;
            pointer-events:none;
          }

          @keyframes headerPulse{
            0%{ box-shadow:0 0 0 0 rgba(249,115,22,.45); }
            70%{ box-shadow:0 0 0 8px rgba(249,115,22,0); }
            100%{ box-shadow:0 0 0 0 rgba(249,115,22,0); }
          }

          .freeship{
            font-size:12px;
            font-weight:900;
            color:#0f172a;
            opacity:.78;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            pointer-events:none;
          }

          .theme-dark .freeship{
            color:#e6e7ea;
            opacity:.8;
          }

          .widescreen{
            max-width:190px;
          }

          .search{
            flex:0 0 auto;
            position:relative;
            z-index:20;
          }

          .search-form{
            position:absolute;
            top:calc(100% + 10px);
            right:0;
            width:min(360px, calc(100vw - 24px));
            background:#fff;
            border:1px solid rgba(15,23,42,.10);
            border-radius:16px;
            padding:12px;
            box-shadow:0 18px 50px rgba(15,23,42,.18);
            z-index:40;
            pointer-events:auto;
          }

          .theme-dark .search-form{
            background:#0b1220;
            border-color:rgba(255,255,255,.10);
            box-shadow:0 18px 50px rgba(0,0,0,.55);
          }

          .search-form input{
            width:100%;
            height:42px;
            border-radius:12px;
            border:1px solid rgba(148,163,184,.85);
            padding:0 12px;
            font-weight:800;
            color:#0f172a;
            background:#fff;
            outline:none;
          }

          .search-form input:focus{
            border-color:#4B6BFA;
            box-shadow:0 0 0 3px rgba(75,107,250,.14);
          }

          .search-form input::placeholder{
            color:#64748b;
            opacity:1;
          }

          .theme-dark .search-form input{
            background:#0b1220;
            border-color:rgba(255,255,255,.14);
            color:#e6e7ea;
          }

          .theme-dark .search-form input::placeholder{
            color:#94a3b8;
            opacity:1;
          }

          .go{
            margin-top:10px;
            width:100%;
            height:40px;
            border-radius:12px;
            border:0;
            background:#0f172a;
            color:#fff;
            font-weight:900;
            cursor:pointer;
            transition:transform .12s ease, opacity .12s ease;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .go:hover{
            transform:translateY(-1px);
          }

          .theme-dark .go{
            background:#f8fafc;
            color:#0b1220;
          }

          .recent{
            margin-top:10px;
            border-top:1px solid rgba(148,163,184,.35);
            padding-top:8px;
          }

          .theme-dark .recent{
            border-top-color:rgba(255,255,255,.10);
          }

          .recent-hd{
            display:flex;
            justify-content:space-between;
            gap:10px;
            font-size:12px;
            font-weight:900;
            opacity:.82;
          }

          .link-clear{
            border:0;
            background:none;
            text-decoration:underline;
            cursor:pointer;
            font-weight:900;
            opacity:.75;
            color:inherit;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .recent-list{
            margin-top:8px;
            display:flex;
            flex-wrap:wrap;
            gap:6px;
          }

          .recent-item{
            border-radius:999px;
            border:1px solid rgba(148,163,184,.75);
            background:rgba(248,250,252,.98);
            padding:5px 10px;
            font-size:12px;
            font-weight:900;
            cursor:pointer;
            color:#0f172a;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .theme-dark .recent-item{
            background:rgba(11,18,32,.55);
            border-color:rgba(255,255,255,.12);
            color:#e6e7ea;
          }

          .recent-item.is-active{
            border-color:#0f172a;
            background:rgba(15,23,42,.06);
          }

          .theme-dark .recent-item.is-active{
            border-color:#f8fafc;
            background:rgba(255,255,255,.10);
          }

          .iconbtn{
            position:relative;
            width:40px;
            height:40px;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            border-radius:12px;
            border:1px solid rgba(15,23,42,.10);
            background:rgba(255,255,255,.74);
            color:#0f172a;
            cursor:pointer;
            flex:0 0 auto;
            transition:transform .12s ease, background .12s ease, border-color .12s ease;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
            text-decoration:none;
          }

          .iconbtn:hover{
            background:rgba(15,23,42,.06);
            transform:translateY(-1px);
          }

          .theme-dark .iconbtn{
            background:rgba(11,18,32,.58);
            border-color:rgba(255,255,255,.10);
            color:#e6e7ea;
          }

          .theme-dark .iconbtn:hover{
            background:rgba(255,255,255,.08);
          }

          .iconbtn.muted{
            opacity:.8;
          }

          .settings{
            display:flex;
            align-items:center;
            gap:10px;
            flex:0 0 auto;
          }

          .pillselect{
            height:40px;
            border-radius:12px;
            border:1px solid rgba(15,23,42,.10);
            padding:0 11px;
            background:rgba(255,255,255,.8);
            font-weight:800;
            font-size:12px;
            color:#0f172a;
            flex:0 0 auto;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .theme-dark .pillselect{
            background:rgba(11,18,32,.58);
            border-color:rgba(255,255,255,.10);
            color:#e6e7ea;
          }

          .badge{
            position:absolute;
            top:-6px;
            right:-6px;
            min-width:18px;
            height:18px;
            border-radius:999px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#f97316;
            color:#fff;
            font-size:11px;
            font-weight:900;
            border:2px solid rgba(255,255,255,.94);
            pointer-events:none;
          }

          .theme-dark .badge{
            border-color:rgba(7,11,18,.95);
          }

          .cart.pulse .badge{
            animation:badgePulse .45s ease-out;
          }

          @keyframes badgePulse{
            0%{ transform:scale(.75); opacity:.55; }
            100%{ transform:scale(1); opacity:1; }
          }

          .navrow{
            position:relative;
            z-index:3;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
            padding:0 0 12px;
            background:inherit;
          }

          .main-nav{
            display:flex;
            align-items:center;
            gap:8px;
            flex-wrap:wrap;
            min-width:0;
          }

          .nav-link,
          .nav-cta{
            position:relative;
            z-index:4;
            pointer-events:auto;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .nav-link{
            text-decoration:none;
            color:#334155;
            font-weight:900;
            font-size:13px;
            line-height:1;
            padding:10px 12px;
            border-radius:999px;
            border:1px solid transparent;
            white-space:nowrap;
            transition:transform .12s ease, background .12s ease, color .12s ease, box-shadow .12s ease;
          }

          .nav-link:hover{
            background:rgba(15,23,42,.06);
            color:#0f172a;
            transform:translateY(-1px);
          }

          .nav-link.active{
            background:linear-gradient(135deg,#0f172a,#1e293b);
            color:#fff;
            box-shadow:0 8px 18px rgba(15,23,42,.10);
          }

          .theme-dark .nav-link{
            color:#cbd5e1;
          }

          .theme-dark .nav-link:hover{
            background:rgba(255,255,255,.08);
            color:#fff;
          }

          .theme-dark .nav-link.active{
            background:#f8fafc;
            color:#0b1220;
            box-shadow:none;
          }

          .nav-right{
            display:flex;
            align-items:center;
            gap:8px;
            flex:0 0 auto;
          }

          .nav-cta{
            text-decoration:none;
            min-height:40px;
            padding:0 14px;
            border-radius:999px;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            font-weight:1000;
            font-size:13px;
            white-space:nowrap;
            flex:0 0 auto;
            transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
          }

          .nav-cta:hover{
            transform:translateY(-1px);
          }

          .nav-cta.ghost{
            background:transparent;
            color:#0f172a;
            border:1px solid rgba(15,23,42,.12);
          }

          .nav-cta.hot{
            background:linear-gradient(135deg,#0f172a,#334155);
            color:#fff;
            box-shadow:0 10px 24px rgba(15,23,42,.18);
          }

          .theme-dark .nav-cta.ghost{
            color:#f8fafc;
            border-color:rgba(255,255,255,.14);
          }

          .theme-dark .nav-cta.hot{
            background:#f8fafc;
            color:#0b1220;
            box-shadow:none;
          }

          .drawer{
            position:fixed;
            inset:0;
            z-index:2147483646;
            pointer-events:none;
            opacity:0;
            transition:opacity .18s ease;
          }

          .drawer.open{
            opacity:1;
            pointer-events:auto;
          }

          .backdrop{
            position:absolute;
            inset:0;
            background:rgba(2,6,23,.55);
            z-index:1;
          }

          .panel{
            position:absolute;
            top:0;
            bottom:0;
            left:0;
            width:min(380px, 90vw);
            max-width:90vw;
            background:#fff;
            border-right:1px solid rgba(15,23,42,.10);
            padding:calc(12px + env(safe-area-inset-top, 0px)) 12px calc(12px + env(safe-area-inset-bottom, 0px));
            overflow:auto;
            overscroll-behavior:contain;
            -webkit-overflow-scrolling:touch;
            z-index:2;
            box-shadow:18px 0 48px rgba(2,6,23,.24);
          }

          .theme-dark .panel{
            background:#0b1220;
            border-right-color:rgba(255,255,255,.10);
          }

          .panel-top{
            display:flex;
            align-items:center;
            justify-content:space-between;
            padding:6px 6px 10px;
          }

          .panel-brand{
            display:flex;
            align-items:center;
            gap:10px;
            font-weight:900;
            letter-spacing:.06em;
            text-transform:uppercase;
          }

          .close{
            width:36px;
            height:36px;
            border-radius:12px;
            border:1px solid rgba(15,23,42,.10);
            background:transparent;
            font-size:22px;
            cursor:pointer;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .theme-dark .close{
            border-color:rgba(255,255,255,.10);
            color:#e6e7ea;
          }

          .panel-hot{
            margin:0 6px 10px;
            padding:14px;
            border-radius:18px;
            background:linear-gradient(135deg, rgba(15,23,42,.96), rgba(51,65,85,.94));
            color:#fff;
            box-shadow:0 16px 34px rgba(15,23,42,.18);
          }

          .theme-dark .panel-hot{
            background:linear-gradient(135deg, rgba(248,250,252,.12), rgba(255,255,255,.06));
            box-shadow:none;
          }

          .panel-hot-badge{
            display:inline-flex;
            padding:4px 8px;
            border-radius:999px;
            background:rgba(255,255,255,.12);
            border:1px solid rgba(255,255,255,.14);
            font-size:11px;
            font-weight:1000;
            text-transform:uppercase;
            letter-spacing:.08em;
          }

          .panel-hot p{
            margin:10px 0 0;
            font-size:13px;
            line-height:1.45;
            font-weight:800;
            opacity:.95;
          }

          .panel-links{
            display:flex;
            flex-direction:column;
            gap:8px;
            padding:6px;
          }

          .panel-links .nav-link{
            border:1px solid rgba(148,163,184,.30);
          }

          .theme-dark .panel-links .nav-link{
            border-color:rgba(255,255,255,.10);
          }

          .member-panel-link{
            text-decoration:none;
            color:inherit;
            border:1px solid rgba(148,163,184,.30);
            border-radius:16px;
            padding:12px;
            display:flex;
            flex-direction:column;
            gap:4px;
            background:rgba(255,255,255,.5);
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .theme-dark .member-panel-link{
            border-color:rgba(255,255,255,.10);
            background:rgba(255,255,255,.04);
            color:#f8fafc;
          }

          .member-panel-title{
            font-size:13px;
            font-weight:1000;
            color:#0f172a;
          }

          .theme-dark .member-panel-title{
            color:#f8fafc;
          }

          .member-panel-sub{
            font-size:12px;
            line-height:1.45;
            color:#64748b;
            font-weight:800;
          }

          .theme-dark .member-panel-sub{
            color:#cbd5e1;
          }

          .mobile-cta{
            display:inline-flex;
            justify-content:center;
          }

          .mobile-portal{
            justify-content:center;
            width:100%;
          }

          .panel-settings{
            margin-top:12px;
            padding:6px;
            border-top:1px solid rgba(148,163,184,.25);
          }

          .theme-dark .panel-settings{
            border-top-color:rgba(255,255,255,.10);
          }

          .panel-settings-hd{
            font-weight:900;
            font-size:12px;
            opacity:.8;
            margin:8px 0 10px;
          }

          .panel-grid{
            display:grid;
            grid-template-columns:1fr;
            gap:10px;
          }

          .panel-field{
            display:flex;
            flex-direction:column;
            gap:6px;
            font-weight:900;
            font-size:12px;
          }

          .panel-field span{
            opacity:.8;
          }

          .panel-field select{
            height:40px;
            border-radius:12px;
            border:1px solid rgba(15,23,42,.10);
            padding:0 10px;
            background:rgba(255,255,255,.85);
            font-weight:900;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .theme-dark .panel-field select{
            background:rgba(11,18,32,.55);
            border-color:rgba(255,255,255,.10);
            color:#e6e7ea;
          }

          .panel-action{
            display:flex;
            align-items:center;
            gap:10px;
            min-height:42px;
            border-radius:14px;
            border:1px solid rgba(15,23,42,.10);
            background:rgba(255,255,255,.75);
            font-weight:900;
            cursor:pointer;
            padding:0 12px;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
          }

          .theme-dark .panel-action{
            background:rgba(11,18,32,.55);
            border-color:rgba(255,255,255,.10);
            color:#e6e7ea;
          }

          .panel-action.muted{
            opacity:.8;
          }

          .panel-freeship{
            font-weight:900;
            font-size:12px;
            opacity:.85;
            padding:10px 12px;
            border-radius:14px;
            border:1px dashed rgba(148,163,184,.55);
          }

          .theme-dark .panel-freeship{
            border-color:rgba(255,255,255,.18);
          }

          .mobile{
            display:none;
          }

          .desktop{
            display:flex;
          }

          @media (max-width:1280px){
            .topbar{
              grid-template-columns:minmax(280px, 1fr) minmax(190px, .7fr) auto;
            }

            .member-top-link{
              width:min(100%, 270px);
            }

            .widescreen{
              max-width:150px;
            }

            .brand-badge{
              display:none;
            }
          }

          @media (max-width:1160px){
            .topbar{
              grid-template-columns:minmax(0, 1fr) auto;
            }

            .top-center{
              display:none;
            }

            .portal-desktop{
              display:none;
            }

            .widescreen{
              display:none;
            }
          }

          @media (max-width:980px){
            .cw-header{
              position:relative;
              top:auto;
              z-index:80;
              background:#fff;
              backdrop-filter:none;
              -webkit-backdrop-filter:none;
              transform:none;
              contain:layout paint;
            }

            .theme-dark .cw-header{
              background:#0b1220;
              backdrop-filter:none;
              -webkit-backdrop-filter:none;
            }

            .desktop{
              display:none;
            }

            .mobile{
              display:inline-flex;
            }

            .topbar{
              display:flex;
              justify-content:space-between;
              gap:10px;
              padding:10px 0;
            }

            .top-left{
              flex:1 1 auto;
              min-width:0;
              gap:8px;
            }

            .top-right{
              flex:0 0 auto;
              min-width:auto;
              gap:8px;
            }

            .brand{
              flex:1 1 auto;
              gap:10px;
              max-width:calc(100vw - 170px);
            }

            .tagline{
              display:none;
            }

            .word{
              font-size:15px;
            }

            .search{
              position:static;
            }

            .search-form{
              position:fixed;
              top:calc(10px + env(safe-area-inset-top, 0px));
              left:12px;
              right:12px;
              width:auto;
              max-width:none;
              z-index:2147483000;
              border-radius:18px;
            }
          }

          @media (max-width:760px){
            .heatline-inner{
              justify-content:flex-start;
              overflow:hidden;
              white-space:nowrap;
            }

            .promo-inner{
              align-items:flex-start;
              flex-direction:column;
            }

            .promo-msg{
              white-space:normal;
            }

            .promo-cta{
              width:100%;
              flex-wrap:wrap;
            }

            .promo-link{
              flex:1 1 auto;
            }
          }

          @media (max-width:560px){
            .cw-container{
              padding:0 14px;
            }

            .word{
              font-size:14px;
              letter-spacing:.11em;
            }

            .brand{
              max-width:calc(100vw - 150px);
            }

            .panel{
              width:min(360px, 92vw);
              max-width:92vw;
            }
          }

          @media (prefers-reduced-motion: reduce){
            .drawer{
              transition:none;
            }

            .pulse-dot{
              animation:none;
            }

            .nav-cta,
            .iconbtn,
            .promo-link,
            .portal,
            .brand,
            .member-top-link,
            .nav-link,
            .go{
              transition:none;
            }
          }
        `}</style>
      </header>

      <MobileDrawer
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        tx={tx}
        i18n={i18n}
        pathname={pathname}
        search={search}
        memberEntry={memberEntry}
        memberText={memberText}
        userDisplayName={userDisplayName}
        memberSubText={memberSubText}
        currency={currency}
        setCurrency={setCurrency}
        currencyOptions={currencyOptions}
        toggleTheme={toggleTheme}
        theme={theme}
        muted={muted}
        toggleSound={toggleSound}
        freeShipText={freeShipText}
        goToPortal={goToPortal}
      />
    </>
  );
}