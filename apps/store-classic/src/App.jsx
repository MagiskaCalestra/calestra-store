// D:\WebProjects\Calestra\apps\store-classic\src\App.jsx
// apps/store-classic/src/App.jsx

import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";

import "./styles/scrollbar.css";
import "./styles/themes.css";
import "./styles/solid-bg.css";
import "./styles/product-card.css";
import "./App.css";
import "./styles/patches.css";
import "./styles/store-progress.css";
import "./styles/surprise.css";
import "./styles/z-index.css";

import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import CookieBanner from "./components/CookieBanner.jsx";
import CelesteOverlay from "./components/CelesteOverlay.jsx";

import { CartProvider } from "./context/CartContext.jsx";
import { SoundProvider } from "./context/SoundContext.jsx";
import { FilterProvider } from "./context/FilterContext.jsx";
import { DreamPointsProvider } from "./context/DreamPointsContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Product from "./pages/Product.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import CheckoutRestore from "./pages/CheckoutRestore.jsx";
import Receipt from "./pages/Receipt.jsx";
import Thanks from "./pages/Thanks.jsx";
import NotFound from "./pages/NotFound.jsx";
import Member from "./pages/Member.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Track from "./pages/Track.jsx";

import NewsletterConfirmed from "./pages/NewsletterConfirmed.jsx";
import NewsletterConfirmFailed from "./pages/NewsletterConfirmFailed.jsx";
import NewsletterUnsubscribed from "./pages/NewsletterUnsubscribed.jsx";
import NewsletterUnsubscribeFailed from "./pages/NewsletterUnsubscribeFailed.jsx";

import Associate from "./pages/Associate.jsx";
import Corp from "./pages/Corp.jsx";

import About from "./pages/static/About.jsx";
import Vision from "./pages/static/Vision.jsx";
import Sustainability from "./pages/static/Sustainability.jsx";
import Press from "./pages/static/Press.jsx";
import Careers from "./pages/static/Careers.jsx";
import Contact from "./pages/static/Contact.jsx";
import Terms from "./pages/static/Terms.jsx";
import Privacy from "./pages/static/Privacy.jsx";
import Cookies from "./pages/static/Cookies.jsx";
import Returns from "./pages/static/Returns.jsx";
import Shipping from "./pages/static/Shipping.jsx";
import Billing from "./pages/static/Billing.jsx";
import Claim from "./pages/static/Claim.jsx";

import StoreProgressPage from "./pages/Progress.jsx";
import MediaGallery from "./pages/MediaGallery.jsx";
import DevAssetsCheck from "./pages/DevAssetsCheck.jsx";
import SurpriseBoxes from "./pages/SurpriseBoxes.jsx";

import { runCatalogMigrations } from "./core/catalogMigrations.js";
import { useCampaign } from "./hooks/useCampaign.jsx";
import { startCalestraIdentityBootstrap } from "./core/auth/calestraIdentityBootstrap.js";

import AnalyticsAuto from "./analytics/AnalyticsAuto.jsx";

import AdminLite from "./pages/AdminLite.jsx";
import StatsLite from "./pages/StatsLite.jsx";

/* ---------------- ErrorBoundary ---------------- */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err, info) {
    console.error("UI error:", err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "24px" }}>
          <h2>Oj! Något gick fel.</h2>
          <p>Prova att uppdatera sidan. Om felet kvarstår, kontrollera senaste ändringen.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ---------------- Global app shell layering ---------------- */
function AppShellStyles() {
  return (
    <style>{`
      html,
      body,
      #root{
        min-height:100%;
      }

      body{
        overflow-x:hidden;
      }

      .cw-app{
        position:relative;
        min-height:100dvh;
        width:100%;
        overflow-x:hidden;
        isolation:isolate;
      }

      .cw-app-main{
        position:relative;
        z-index:1;
        min-height:calc(100dvh - 220px);
        scroll-margin-top:120px;
      }

      .cw-app-main:focus{
        outline:none;
      }

      .cw-header{
        z-index:5000;
      }

      .launchBanner{
        z-index:60;
      }

      .pause-overlay{
        z-index:9000;
      }

      @media (max-width:980px){
        html,
        body,
        #root{
          overflow-x:hidden;
        }

        .cw-app{
          overflow-x:clip;
          isolation:isolate;
        }

        .cw-app-main{
          z-index:1;
          scroll-margin-top:16px;
        }

        .cw-header{
          position:sticky;
          top:0;
          z-index:5000 !important;
        }

        /*
          Kritisk mobilfix:
          Desktop-navens osynliga länkar fick fortfarande klickyta på vissa mobila vyer.
          Det var därför klick på t.ex. "Visa kvitto", adressfält eller villkor kunde gå till /assoc eller /corp.
        */
        .cw-header .desktop,
        .cw-header .navrow,
        .cw-header .navrow *,
        .cw-header .nav-right,
        .cw-header .nav-right *,
        .cw-header .portal-desktop,
        .cw-header .settings,
        .cw-header .top-center,
        .cw-header .freeship.widescreen{
          display:none !important;
          visibility:hidden !important;
          pointer-events:none !important;
          position:absolute !important;
          inset:auto !important;
          width:0 !important;
          height:0 !important;
          min-width:0 !important;
          min-height:0 !important;
          max-width:0 !important;
          max-height:0 !important;
          overflow:hidden !important;
          opacity:0 !important;
          transform:none !important;
        }

        .cw-header .topbar,
        .cw-header .top-left,
        .cw-header .top-right,
        .cw-header .brand,
        .cw-header .mobile,
        .cw-header .search,
        .cw-header .cart,
        .cw-header .iconbtn{
          pointer-events:auto !important;
        }

        .launchBanner{
          position:relative !important;
          top:auto !important;
          z-index:20 !important;
        }

        .drawer{
          z-index:2147483646 !important;
        }

        .pause-overlay{
          z-index:2147483645 !important;
        }
      }

      /*
        Mobile checkout safety:
        Hindrar sticky totalraden från att lägga sig ovanpå testköp-knappen.
        Reglerna ligger här globalt så de vinner även om checkout-css laddas från flera filer.
      */
      @media (max-width:760px){
        body:has(.sticky-bar),
        .cw-app:has(.sticky-bar),
        #main:has(.sticky-bar),
        .cw-app-main:has(.sticky-bar){
          padding-bottom:150px !important;
        }

        .sticky-bar{
          position:fixed !important;
          left:10px !important;
          right:10px !important;
          bottom:max(10px, env(safe-area-inset-bottom)) !important;
          top:auto !important;
          z-index:4500 !important;

          display:grid !important;
          grid-template-columns:1fr !important;
          gap:8px !important;

          width:auto !important;
          max-width:none !important;
          min-height:auto !important;
          height:auto !important;

          padding:10px !important;
          border-radius:18px !important;
          box-shadow:0 18px 45px rgba(15,23,42,.22) !important;
          pointer-events:auto !important;
        }

        .sticky-total{
          width:100% !important;
          min-width:0 !important;
          display:flex !important;
          align-items:center !important;
          justify-content:center !important;
          text-align:center !important;
          font-size:13px !important;
          line-height:1.25 !important;
          white-space:normal !important;
          overflow:visible !important;
          pointer-events:none !important;
        }

        .sticky-bar .cta,
        .sticky-bar .cta.sticky{
          width:100% !important;
          min-height:50px !important;
          height:auto !important;
          margin:0 !important;
          position:relative !important;
          z-index:2 !important;
          pointer-events:auto !important;
          touch-action:manipulation !important;
        }

        .summary-card{
          margin-bottom:18px;
        }
      }

      @media (max-width:420px){
        body:has(.sticky-bar),
        .cw-app:has(.sticky-bar),
        #main:has(.sticky-bar),
        .cw-app-main:has(.sticky-bar){
          padding-bottom:165px !important;
        }

        .sticky-bar{
          left:8px !important;
          right:8px !important;
          padding:9px !important;
        }

        .sticky-total{
          font-size:12px !important;
        }

        .sticky-bar .cta,
        .sticky-bar .cta.sticky{
          min-height:52px !important;
        }
      }

      @supports not selector(:has(*)){
        @media (max-width:760px){
          .cw-app-main{
            padding-bottom:150px;
          }
        }

        @media (max-width:420px){
          .cw-app-main{
            padding-bottom:165px;
          }
        }
      }

      @supports not (height:100dvh){
        .cw-app{
          min-height:100vh;
        }

        .cw-app-main{
          min-height:calc(100vh - 220px);
        }
      }
    `}</style>
  );
}

/* ---------------- Mobile header pointer guard ---------------- */
function MobileHeaderPointerGuard() {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    function isMobileWidth() {
      try {
        return window.matchMedia("(max-width: 980px)").matches;
      } catch {
        return typeof window !== "undefined" && window.innerWidth <= 980;
      }
    }

    function shouldBlockHeaderTarget(target) {
      if (!target || typeof target.closest !== "function") return false;
      if (!target.closest(".cw-header")) return false;

      return !!target.closest(
        ".navrow, .navrow *, .nav-right, .nav-right *, .portal-desktop, .settings, .settings *, .top-center, .top-center *, .freeship.widescreen"
      );
    }

    function blockHiddenDesktopHeaderClicks(event) {
      if (!isMobileWidth()) return;
      if (!shouldBlockHeaderTarget(event.target)) return;

      event.preventDefault();
      event.stopPropagation();

      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    }

    document.addEventListener("click", blockHiddenDesktopHeaderClicks, true);
    document.addEventListener("pointerdown", blockHiddenDesktopHeaderClicks, true);
    document.addEventListener("touchstart", blockHiddenDesktopHeaderClicks, true);

    return () => {
      document.removeEventListener("click", blockHiddenDesktopHeaderClicks, true);
      document.removeEventListener("pointerdown", blockHiddenDesktopHeaderClicks, true);
      document.removeEventListener("touchstart", blockHiddenDesktopHeaderClicks, true);
    };
  }, []);

  return null;
}

/* ---------------- Pause/status fetch safe ---------------- */
const DEFAULT_LAUNCH = {
  mode: "preview",
  storefrontVisible: true,
  previewBadge: true,
  reserveMessaging: true,

  checkoutEnabled: false,
  allowedRegions: "SE",
  launchCollectionOnly: true,

  stripeArmed: false,
  manualPaymentMode: true,
  paymentCaptureActive: false,

  printfulDispatchMode: "off",
  orderQueueActive: true,
  recoveryEngineEnabled: true,

  notes: "",
  updatedAt: "",
};

function toBool(v, fallback = false) {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  return fallback;
}

function normalizeLaunch(input) {
  const s = input || {};
  return {
    mode: String(s.mode ?? DEFAULT_LAUNCH.mode),
    storefrontVisible: toBool(s.storefrontVisible, DEFAULT_LAUNCH.storefrontVisible),
    previewBadge: toBool(s.previewBadge, DEFAULT_LAUNCH.previewBadge),
    reserveMessaging: toBool(s.reserveMessaging, DEFAULT_LAUNCH.reserveMessaging),

    checkoutEnabled: toBool(s.checkoutEnabled, DEFAULT_LAUNCH.checkoutEnabled),
    allowedRegions: String(s.allowedRegions ?? DEFAULT_LAUNCH.allowedRegions),
    launchCollectionOnly: toBool(
      s.launchCollectionOnly,
      DEFAULT_LAUNCH.launchCollectionOnly
    ),

    stripeArmed: toBool(s.stripeArmed, DEFAULT_LAUNCH.stripeArmed),
    manualPaymentMode: toBool(
      s.manualPaymentMode,
      DEFAULT_LAUNCH.manualPaymentMode
    ),
    paymentCaptureActive: toBool(
      s.paymentCaptureActive,
      DEFAULT_LAUNCH.paymentCaptureActive
    ),

    printfulDispatchMode: String(
      s.printfulDispatchMode ?? DEFAULT_LAUNCH.printfulDispatchMode
    ),
    orderQueueActive: toBool(
      s.orderQueueActive,
      DEFAULT_LAUNCH.orderQueueActive
    ),
    recoveryEngineEnabled: toBool(
      s.recoveryEngineEnabled,
      DEFAULT_LAUNCH.recoveryEngineEnabled
    ),

    notes: String(s.notes ?? DEFAULT_LAUNCH.notes),
    updatedAt: String(s.updatedAt ?? DEFAULT_LAUNCH.updatedAt),
  };
}

async function fetchStatusSafe() {
  try {
    const r = await fetch("/api/status", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    const text = await r.text();
    let data = null;

    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, error: text };
    }

    if (!r.ok) return { ok: false, error: data?.error || `HTTP ${r.status}` };
    return data;
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

function deriveStoreMode(config) {
  const mode = String(config?.mode || "preview").toLowerCase();

  const emergency = mode === "emergency";
  const reserve = mode === "reserve";
  const preview = mode === "preview";
  const soft = mode === "soft";
  const live = mode === "live";

  const checkoutBlocked = emergency || reserve || preview || !config?.checkoutEnabled;
  const cartBlocked = checkoutBlocked;
  const sensitiveBlocked = false;

  let bannerTone = "neutral";
  if (emergency) bannerTone = "bad";
  else if (soft) bannerTone = "warm";
  else if (live) bannerTone = "ok";
  else if (reserve || preview) bannerTone = "warn";

  let bannerTitle = "Preview mode";
  let bannerText = "Butiken visas i förhandsläge. Skarp checkout är inte öppen ännu.";

  if (reserve) {
    bannerTitle = "Reserve mode";
    bannerText =
      "Butiken är öppen för upptäckt, men skarpa köp är fortfarande begränsade medan första släppet förbereds.";
  } else if (soft) {
    bannerTitle = "Soft launch";
    bannerText =
      "Butiken kör i kontrollerat öppningsläge. Vissa flöden kan fortfarande vara begränsade.";
  } else if (live) {
    bannerTitle = "Live";
    bannerText =
      "Butiken är i live-läge. Checkout och driftfunktioner kan vara aktiva.";
  } else if (emergency) {
    bannerTitle = "Emergency pause";
    bannerText =
      "Checkout och riskfyllda flöden är tillfälligt pausade medan systemet skyddas.";
  }

  return {
    mode,
    preview,
    reserve,
    soft,
    live,
    emergency,
    checkoutBlocked,
    cartBlocked,
    sensitiveBlocked,
    bannerTone,
    bannerTitle,
    bannerText,
  };
}

/* ---------------- Pause overlay ---------------- */
function PauseOverlay({ reason }) {
  return (
    <div className="pause-overlay" role="dialog" aria-label="Butiken är pausad">
      <div className="pause-card">
        <div className="pause-badge">PAUSAD</div>
        <h2>Tillfälligt pausad</h2>
        <p>
          Butiken är pausad en kort stund.
          {reason ? (
            <>
              {" "}
              <span className="muted">({reason})</span>
            </>
          ) : null}
        </p>
        <p className="muted">Prova igen om en stund.</p>
      </div>

      <style>{`
        .pause-overlay{
          position:fixed;
          inset:0;
          background:rgba(2,6,23,.72);
          display:flex;
          align-items:center;
          justify-content:center;
          padding:18px;
        }

        .pause-card{
          width:min(520px, 92vw);
          background:#fff;
          border-radius:22px;
          padding:18px 18px 16px;
          border:1px solid rgba(15,23,42,.12);
          box-shadow:0 30px 90px rgba(0,0,0,.45);
          color:#0f172a;
          text-align:center;
        }

        .pause-badge{
          display:inline-flex;
          padding:6px 12px;
          border-radius:999px;
          font-weight:1000;
          background:rgba(244,63,94,.12);
          border:1px solid rgba(244,63,94,.35);
          margin-bottom:10px;
        }

        .pause-card h2{
          margin:6px 0 8px;
          font-size:22px;
        }

        .pause-card p{
          margin:6px 0;
          font-weight:900;
          opacity:.92;
        }

        .pause-card .muted{
          opacity:.7;
          font-weight:900;
        }
      `}</style>
    </div>
  );
}

/* ---------------- Launch banner ---------------- */
function LaunchModeBanner({ modeState, config }) {
  if (!config?.storefrontVisible) return null;

  const toneClass =
    modeState.bannerTone === "ok"
      ? "ok"
      : modeState.bannerTone === "warm"
        ? "warm"
        : modeState.bannerTone === "bad"
          ? "bad"
          : "warn";

  return (
    <div className={`launchBanner ${toneClass}`} role="status" aria-live="polite">
      <div className="launchBannerInner">
        <div className="launchBannerTitle">{modeState.bannerTitle}</div>
        <div className="launchBannerText">{modeState.bannerText}</div>

        <div className="launchBannerMeta">
          <span className="launchMini">
            Checkout: {config.checkoutEnabled ? "enabled" : "paused"}
          </span>
          <span className="launchMini">Payments: {config.stripeArmed ? "armed" : "off"}</span>
          <span className="launchMini">Printful: {config.printfulDispatchMode || "off"}</span>
          {config.launchCollectionOnly ? (
            <span className="launchMini">Launch collection only</span>
          ) : null}
        </div>
      </div>

      <style>{`
        .launchBanner{
          position:relative;
          border-bottom:1px solid rgba(255,255,255,.08);
          backdrop-filter:blur(10px);
          -webkit-backdrop-filter:blur(10px);
        }

        .launchBanner.warn{
          background:linear-gradient(180deg, rgba(120,85,0,.32), rgba(120,85,0,.18));
        }

        .launchBanner.warm{
          background:linear-gradient(180deg, rgba(140,70,0,.32), rgba(140,70,0,.18));
        }

        .launchBanner.ok{
          background:linear-gradient(180deg, rgba(0,100,40,.28), rgba(0,100,40,.16));
        }

        .launchBanner.bad{
          background:linear-gradient(180deg, rgba(120,20,30,.34), rgba(120,20,30,.18));
        }

        .launchBannerInner{
          max-width:1400px;
          margin:0 auto;
          padding:10px 16px;
        }

        .launchBannerTitle{
          font-size:12px;
          letter-spacing:.12em;
          text-transform:uppercase;
          font-weight:1000;
          color:rgba(255,255,255,.94);
          margin-bottom:4px;
        }

        .launchBannerText{
          font-size:13px;
          font-weight:800;
          color:rgba(255,255,255,.86);
        }

        .launchBannerMeta{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          margin-top:8px;
        }

        .launchMini{
          display:inline-flex;
          align-items:center;
          min-height:28px;
          padding:0 10px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.12);
          background:rgba(255,255,255,.06);
          font-size:11px;
          font-weight:900;
          color:rgba(255,255,255,.86);
        }

        @media (max-width:760px){
          .launchBannerInner{
            padding:9px 14px;
          }

          .launchBannerText{
            font-size:12px;
            line-height:1.45;
          }

          .launchBannerMeta{
            gap:6px;
          }

          .launchMini{
            min-height:26px;
            font-size:10px;
          }
        }
      `}</style>
    </div>
  );
}

function PausedGate({ paused, children }) {
  if (paused) return <Navigate to="/" replace />;
  return children;
}

function LaunchGate({ blocked, children }) {
  if (blocked) return <Navigate to="/" replace />;
  return children;
}

function PauseRouterGuard({ paused }) {
  const loc = useLocation();
  const p = loc.pathname || "/";
  const isSensitive = p.startsWith("/checkout") || p.startsWith("/cart");

  if (paused && isSensitive) return <Navigate to="/" replace />;
  return null;
}

function LaunchRouterGuard({ blocked }) {
  const loc = useLocation();
  const p = loc.pathname || "/";
  const isSensitive = p.startsWith("/checkout") || p.startsWith("/cart");

  if (blocked && isSensitive) return <Navigate to="/" replace />;
  return null;
}

function RequireAuth({ children }) {
  const { booting, isAuthenticated } = useAuth();

  if (booting) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Laddar Mitt Calestra…</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ---------------- Route UX ---------------- */
function RouteUX() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isHashJump = !!location.hash;
      if (!isHashJump) {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        } catch {
          window.scrollTo(0, 0);
        }
      }
    }
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute("data-calestra-app", "store-classic");
    root.setAttribute("data-calestra-route", location.pathname || "/");
    body?.setAttribute("data-calestra-surface", "store-hot");

    return () => {
      root.removeAttribute("data-calestra-route");
    };
  }, [location.pathname]);

  return null;
}

/* ---------------- Attribution / referral bootstrap ---------------- */
function AttributionBootstrap() {
  const location = useLocation();

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(location.search || "");

      const campaign = params.get("campaign") || params.get("campaign_id") || "";
      const creator = params.get("creator") || params.get("creator_id") || "";
      const affiliate =
        params.get("affiliate") || params.get("affiliate_id") || params.get("aff") || "";
      const ref = params.get("ref") || "";
      const associate =
        params.get("associate") || params.get("associate_code") || params.get("code") || "";
      const source = params.get("source") || params.get("utm_source") || "store";
      const entry = params.get("entry") || params.get("entry_point") || location.pathname || "store";

      const associateCode = associate || ref;
      const affiliateId = affiliate || ref;

      if (campaign) window.localStorage.setItem("cw.campaignId", campaign);

      if (creator) {
        window.localStorage.setItem("cw.creatorId", creator);
        window.localStorage.setItem("cw.creator.code", creator);
      }

      if (affiliateId) {
        window.localStorage.setItem("cw.affiliateId", affiliateId);
        window.localStorage.setItem("cw.affiliate.code", affiliateId);
      }

      if (associateCode) {
        window.localStorage.setItem("cw.associateId", associateCode);
        window.localStorage.setItem("cw.associateCode", associateCode);
        window.localStorage.setItem("cw.associate.code", associateCode);
        window.localStorage.setItem("cw.ambassador.code", associateCode);
        window.localStorage.setItem("cw.referral.code", associateCode);
      }

      if (source) window.localStorage.setItem("cw.sourceChannel", source);
      if (entry) window.localStorage.setItem("cw.entryPoint", entry);
    } catch {
      // noop
    }
  }, [location.pathname, location.search]);

  return null;
}

/* ---------------- Legacy /p/:slug -> /product/:slug ---------------- */
function LegacyProductRedirect() {
  const { slug } = useParams();
  const safe = String(slug || "").trim();
  return <Navigate to={`/product/${encodeURIComponent(safe)}`} replace />;
}

export default function App() {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") runCatalogMigrations();
    } catch (err) {
      console.error("runCatalogMigrations() failed:", err);
    }
  }, []);

  useEffect(() => {
    const stopIdentityBootstrap = startCalestraIdentityBootstrap();
    return () => {
      try {
        if (typeof stopIdentityBootstrap === "function") stopIdentityBootstrap();
      } catch (err) {
        console.warn("stopIdentityBootstrap() failed:", err);
      }
    };
  }, []);

  const campaign = useCampaign();

  const [paused, setPaused] = React.useState(false);
  const [pauseReason, setPauseReason] = React.useState("");
  const [launchConfig, setLaunchConfig] = React.useState(DEFAULT_LAUNCH);

  const loc = useLocation();
  const pathname = loc.pathname || "/";

  const isControlPage =
    pathname.startsWith("/_admin-lite") ||
    pathname.startsWith("/__admin-lite") ||
    pathname.startsWith("/stats");

  const launchMode = React.useMemo(() => deriveStoreMode(launchConfig), [launchConfig]);

  const showPauseOverlay = paused && !isControlPage;
  const showLaunchBanner =
    !isControlPage &&
    launchConfig.storefrontVisible &&
    !paused &&
    (launchMode.preview || launchMode.reserve || launchMode.soft || launchMode.emergency);

  useEffect(() => {
    let alive = true;

    async function tick() {
      const s = await fetchStatusSafe();
      if (!alive) return;

      if (!s?.ok) {
        setPaused(false);
        setPauseReason("");
        setLaunchConfig(DEFAULT_LAUNCH);
        return;
      }

      setPaused(!!s.paused);
      setPauseReason(String(s.reason || ""));
      setLaunchConfig(normalizeLaunch(s.launch || {}));
    }

    tick();
    const id = setInterval(tick, 30_000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <AuthProvider>
      <DreamPointsProvider>
        <CartProvider>
          <FilterProvider>
            <SoundProvider>
              <div
                className="cw-app"
                data-campaign={campaign?.id || "none"}
                data-store-mode={launchMode.mode || "preview"}
                data-checkout-enabled={launchConfig.checkoutEnabled ? "1" : "0"}
                data-printful-dispatch={launchConfig.printfulDispatchMode || "off"}
              >
                <AppShellStyles />
                <MobileHeaderPointerGuard />

                <RouteUX />
                <AttributionBootstrap />

                <Header />

                <PauseRouterGuard paused={paused} />
                <LaunchRouterGuard blocked={launchMode.sensitiveBlocked} />

                {showLaunchBanner && (
                  <LaunchModeBanner modeState={launchMode} config={launchConfig} />
                )}

                <AnalyticsAuto appName="store-classic" />

                <main id="main" className="cw-app-main" tabIndex={-1}>
                  <ErrorBoundary>
                    <Routes>
                      <Route path="/stats" element={<StatsLite />} />
                      <Route path="/stats/*" element={<StatsLite />} />

                      <Route path="/_admin-lite" element={<AdminLite />} />
                      <Route path="/_admin-lite/*" element={<AdminLite />} />

                      <Route path="/__admin-lite" element={<AdminLite />} />
                      <Route path="/__admin-lite/*" element={<AdminLite />} />

                      <Route path="/assoc" element={<Associate />} />
                      <Route
                        path="/member"
                        element={
                          <RequireAuth>
                            <Member />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="/mitt-calestra"
                        element={
                          <RequireAuth>
                            <Member />
                          </RequireAuth>
                        }
                      />

                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />

                      <Route path="/" element={<Home />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/surprise-boxes" element={<SurpriseBoxes />} />

                      <Route path="/product/:slug" element={<Product />} />
                      <Route path="/p/:slug" element={<LegacyProductRedirect />} />

                      <Route
                        path="/cart"
                        element={
                          <PausedGate paused={paused}>
                            <LaunchGate blocked={launchMode.cartBlocked}>
                              <Cart />
                            </LaunchGate>
                          </PausedGate>
                        }
                      />
                      <Route
                        path="/checkout"
                        element={
                          <PausedGate paused={paused}>
                            <LaunchGate blocked={launchMode.checkoutBlocked}>
                              <Checkout />
                            </LaunchGate>
                          </PausedGate>
                        }
                      />

                      <Route path="/checkout/restore/:draftId" element={<CheckoutRestore />} />
                      <Route path="/receipt/:id" element={<Receipt />} />
                      <Route path="/thanks/:id" element={<Thanks />} />
                      <Route path="/thanks/:orderId" element={<Thanks />} />

                      <Route path="/progress" element={<StoreProgressPage />} />
                      <Route path="/gallery" element={<MediaGallery />} />
                      <Route path="/gallery/:cat" element={<MediaGallery />} />

                      <Route path="/shop/confirmed" element={<NewsletterConfirmed />} />
                      <Route path="/shop/confirmed/" element={<NewsletterConfirmed />} />

                      <Route path="/shop/confirm-failed" element={<NewsletterConfirmFailed />} />
                      <Route path="/shop/confirm-failed/" element={<NewsletterConfirmFailed />} />
                      <Route path="/shop/confirm_failed" element={<NewsletterConfirmFailed />} />

                      <Route path="/shop/unsubscribed" element={<NewsletterUnsubscribed />} />
                      <Route path="/shop/unsubscribed/" element={<NewsletterUnsubscribed />} />

                      <Route
                        path="/shop/unsubscribe-failed"
                        element={<NewsletterUnsubscribeFailed />}
                      />
                      <Route
                        path="/shop/unsubscribe-failed/"
                        element={<NewsletterUnsubscribeFailed />}
                      />
                      <Route
                        path="/shop/unsubscribe_failed"
                        element={<NewsletterUnsubscribeFailed />}
                      />

                      <Route path="/corp" element={<Corp />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/vision" element={<Vision />} />
                      <Route path="/sustainability" element={<Sustainability />} />
                      <Route path="/press" element={<Press />} />
                      <Route path="/careers" element={<Careers />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/cookies" element={<Cookies />} />
                      <Route path="/returns" element={<Returns />} />
                      <Route path="/shipping" element={<Shipping />} />
                      <Route path="/billing" element={<Billing />} />
                      <Route path="/track" element={<Track />} />

                      <Route path="/claim" element={<Claim />} />
                      <Route path="/claims" element={<Claim />} />
                      <Route path="/returns/claim" element={<Claim />} />
                      <Route path="/problem-med-order" element={<Claim />} />

                      <Route path="/dev/assets" element={<DevAssetsCheck />} />
                      <Route path="/dev" element={<Navigate to="/dev/assets" replace />} />
                      <Route path="/values" element={<Navigate to="/vision" replace />} />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ErrorBoundary>
                </main>

                <Footer />
                <CookieBanner />

                {!isControlPage && <CelesteOverlay appName="store-classic" />}
                {showPauseOverlay && <PauseOverlay reason={pauseReason} />}
              </div>
            </SoundProvider>
          </FilterProvider>
        </CartProvider>
      </DreamPointsProvider>
    </AuthProvider>
  );
}