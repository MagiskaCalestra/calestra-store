// D:\WebProjects\Calestra\apps\store-classic\src\pages\Member.jsx

import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDreamPoints } from "../context/DreamPointsContext.jsx";
import { TT } from "../i18n/tt.js";
import {
  MEMBER_LS_KEYS,
  cleanString,
  normalizeEmail,
  readJsonLS,
  safeSetLS,
  safeRemoveLS,
  writeCustomerPrefill,
  readIdentityShell,
  persistIdentityShell,
  createLocalId,
} from "../core/member/memberMeta.js";
import {
  fetchMemberById,
  fetchMemberByEmail,
  fetchCurrentMember,
  registerOrLoginMember,
  patchMember,
  fetchMemberPackage,
  fetchMemberPresence,
  requestMemberLogin,
  verifyMemberLoginToken,
  logoutCurrentMember,
  readCurrentSessionToken,
} from "../core/member/memberClient.js";
import {
  MEMBER_VIEW_LS_KEYS,
  readControlConfig,
  ensureIdentityShellState,
  readOrders,
  readSavedCustomer,
  readSavedShipping,
  readSavedBilling,
  readCheckoutDraftInfo,
} from "../core/member/memberViewState.js";

const SESSION_TOKEN_KEY = "cw.sessionToken";
const MEMBER_SYNC_MIN_MS = 1400;

const LS_KEYS = {
  identity: MEMBER_LS_KEYS.identity,
  member: MEMBER_LS_KEYS.member,
  memberId: MEMBER_LS_KEYS.memberId,
  memberTier: MEMBER_LS_KEYS.memberTier,
  userId: MEMBER_LS_KEYS.userId,
  draftId: MEMBER_VIEW_LS_KEYS.draftId,
  savedCustomer: MEMBER_LS_KEYS.savedCustomer,
  savedShipping: MEMBER_LS_KEYS.savedShipping,
  savedBilling: MEMBER_LS_KEYS.savedBilling,
  memberControl: MEMBER_VIEW_LS_KEYS.memberControl,
  checkoutDraft: MEMBER_VIEW_LS_KEYS.checkoutDraft,
  checkoutPrefill: MEMBER_LS_KEYS.checkoutPrefill,
  orders: MEMBER_VIEW_LS_KEYS.orders,
};

const ASSOCIATE_LS_KEYS = [
  "cw.associate.code",
  "cw.creator.code",
  "cw.affiliate.code",
  "cw.ambassador.code",
  "cw.referral.code",
];

function nowIso() {
  return new Date().toISOString();
}

function getLocale(i18n) {
  const lang = String(i18n?.resolvedLanguage || i18n?.language || "sv").slice(0, 2);
  if (lang === "tr") return "tr-TR";
  if (lang === "en") return "en-US";
  return "sv-SE";
}

function formatDate(v, i18n) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return new Intl.DateTimeFormat(getLocale(i18n), {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(v);
  }
}

function formatShort(v, i18n) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return new Intl.DateTimeFormat(getLocale(i18n), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return String(v);
  }
}

function asBool(v) {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ["1", "true", "yes", "y", "preorder", "pre-order", "mixed"].includes(s);
}

function normalizeOrderId(order, idx = 0) {
  return cleanString(order?.id || order?.orderId || order?.order_id || `order-${idx}`, 180);
}

function getOrderFlow(order) {
  const raw = cleanString(
    order?.orderFlowType ||
      order?.uiMeta?.flowType ||
      order?.preorderMeta?.flowType ||
      order?.flowType ||
      "",
    80
  ).toLowerCase();

  const status = cleanString(order?.status || "", 100).toLowerCase();

  const hasPreorder =
    asBool(order?.preorderMeta?.hasPreorder) ||
    asBool(order?.preorderSystem?.enabled) ||
    status.includes("preorder") ||
    (Array.isArray(order?.items) &&
      order.items.some(
        (it) =>
          asBool(it?.isPreorder) ||
          asBool(it?.preorder) ||
          it?.lineMode === "preorder" ||
          it?.orderType === "preorder" ||
          asBool(it?.meta?.preorder)
      ));

  if (raw === "mixed" || status.includes("mixed")) return "mixed";
  if (raw === "preorder" || hasPreorder) return "preorder";
  if (raw === "notify_only") return "notify_only";
  return "standard";
}

function getOrderMode(order) {
  const mode = cleanString(order?.mode || "", 40).toLowerCase();
  if (mode) return mode;
  return order?.isTest === false ? "live" : "preview";
}

function getOrderStatusLabel(order, i18n, t) {
  const flow = getOrderFlow(order);
  const mode = getOrderMode(order);
  const status = cleanString(order?.status || "", 120);

  if (flow === "mixed") {
    return TT(i18n, t, "member.orders.status.mixed", {
      sv: "Blandad order",
      en: "Mixed order",
      tr: "Karma sipariş",
    });
  }

  if (flow === "preorder") {
    return TT(i18n, t, "member.orders.status.preorder", {
      sv: "Förbeställning",
      en: "Pre-order",
      tr: "Ön sipariş",
    });
  }

  if (flow === "notify_only") {
    return TT(i18n, t, "member.orders.status.notify", {
      sv: "Bevaka",
      en: "Notify",
      tr: "Bildirim",
    });
  }

  if (mode === "preview") {
    return TT(i18n, t, "member.orders.status.preview", {
      sv: "Testorder",
      en: "Test order",
      tr: "Test siparişi",
    });
  }

  return (
    status ||
    TT(i18n, t, "member.orders.status.standard", {
      sv: "Order",
      en: "Order",
      tr: "Sipariş",
    })
  );
}

function getOrderTone(order) {
  const flow = getOrderFlow(order);
  if (flow === "mixed") return "warning";
  if (flow === "preorder") return "primary";
  if (flow === "notify_only") return "default";
  return getOrderMode(order) === "preview" ? "default" : "success";
}

function getOrderTotal(order) {
  const totals = order?.totalsSEK || {};
  const total = Number(totals.grand ?? totals.total ?? totals.sum ?? 0);
  if (Number.isFinite(total) && total > 0) return `${Math.round(total)} kr`;

  const items = Array.isArray(order?.items) ? order.items : [];
  const sum = items.reduce((acc, it) => {
    const qty = Math.max(1, Number(it?.qty || it?.quantity || 1));
    const price = Number(it?.priceSEK ?? it?.price ?? it?.product?.price ?? 0);
    return acc + qty * price;
  }, 0);

  return sum > 0 ? `${Math.round(sum)} kr` : "—";
}

function getOrderDreamEarned(order) {
  return Math.max(
    0,
    Number(
      order?.dreamPointsEarned ??
        order?.dreamPointsMeta?.earned ??
        order?.dreamPointsMeta?.earnPreview ??
        order?.dreamPoints?.earned ??
        0
    )
  );
}

function getReservationCode(order) {
  return cleanString(
    order?.preorderSystem?.reservationCode || order?.preorderMeta?.reservationCode || "",
    180
  );
}

function calcLevelFromPoints(points) {
  const p = Math.max(0, Number(points || 0));
  if (p >= 2500) return "celestial";
  if (p >= 1200) return "aurora";
  if (p >= 400) return "moonlight";
  return "starlight";
}

function levelLabel(level, i18n, t) {
  const key = String(level || "starlight").toLowerCase();
  return TT(i18n, t, `member.level.${key}`, {
    sv:
      key === "celestial"
        ? "Celestial"
        : key === "aurora"
          ? "Aurora"
          : key === "moonlight"
            ? "Moonlight"
            : "Starlight",
    en:
      key === "celestial"
        ? "Celestial"
        : key === "aurora"
          ? "Aurora"
          : key === "moonlight"
            ? "Moonlight"
            : "Starlight",
    tr:
      key === "celestial"
        ? "Celestial"
        : key === "aurora"
          ? "Aurora"
          : key === "moonlight"
            ? "Moonlight"
            : "Starlight",
  });
}

function mergeIdentity(customer, baseUserId = "") {
  return persistIdentityShell({
    userId:
      cleanString(baseUserId || "", 160) ||
      readIdentityShell().userId ||
      createLocalId("user"),
    name: cleanString(customer?.name || "", 160),
    email: normalizeEmail(customer?.email || ""),
    phone: cleanString(customer?.phone || "", 80),
  });
}

function mergeMemberShell(customer, fallbackTier = "starlight") {
  const shell = readIdentityShell();
  const existingMember = readJsonLS(LS_KEYS.member, {}) || {};
  const memberId = cleanString(
    shell.memberId || existingMember.memberId || existingMember.id || "",
    160
  );

  if (!memberId) return null;

  return persistIdentityShell({
    userId: shell.userId,
    memberId,
    memberTier: cleanString(
      existingMember.memberTier || existingMember.tier || fallbackTier || "starlight",
      80
    ),
    name: cleanString(customer?.name || existingMember.name || "", 160),
    email: normalizeEmail(customer?.email || existingMember.email || ""),
    phone: cleanString(customer?.phone || existingMember.phone || "", 80),
  });
}

function readFirstLocalValue(keys = []) {
  if (typeof window === "undefined") return "";
  for (const key of keys) {
    try {
      const value = cleanString(window.localStorage.getItem(key) || "", 220);
      if (value) return value;
    } catch {}
  }
  return "";
}

function getMemberAssociateCode(remoteMember, authSnapshot) {
  const shell = readIdentityShell();
  const localCode = readFirstLocalValue(ASSOCIATE_LS_KEYS);

  return cleanString(
    remoteMember?.associateCode ||
      remoteMember?.associate_code ||
      remoteMember?.creatorCode ||
      remoteMember?.creator_code ||
      remoteMember?.affiliateCode ||
      remoteMember?.affiliate_code ||
      remoteMember?.ambassadorCode ||
      remoteMember?.ambassador_code ||
      remoteMember?.referralCode ||
      remoteMember?.referral_code ||
      remoteMember?.marketing?.associateCode ||
      remoteMember?.marketing?.creatorCode ||
      remoteMember?.marketing?.affiliateCode ||
      authSnapshot?.member?.associateCode ||
      authSnapshot?.member?.creatorCode ||
      authSnapshot?.member?.affiliateCode ||
      authSnapshot?.user?.associateCode ||
      authSnapshot?.user?.creatorCode ||
      authSnapshot?.user?.affiliateCode ||
      shell?.associateCode ||
      shell?.creatorCode ||
      shell?.affiliateCode ||
      shell?.identity?.associateCode ||
      shell?.identity?.creatorCode ||
      shell?.identity?.affiliateCode ||
      localCode ||
      "",
    220
  );
}

function buildAssociateShareUrl(code) {
  const safeCode = cleanString(code, 220);
  if (!safeCode) return "";

  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://magiskacalestra.se";

  const url = new URL("/shop", origin);
  url.searchParams.set("ref", safeCode);
  url.searchParams.set("associate", safeCode);
  return url.toString();
}

function copyText(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  if (typeof document === "undefined") {
    return Promise.reject(new Error("clipboard_unavailable"));
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  } finally {
    document.body.removeChild(textarea);
  }
}

function MemberStat({ label, value, sub }) {
  return (
    <div className="member-stat">
      <div className="member-stat-value">{value}</div>
      <div className="member-stat-label">{label}</div>
      {sub ? <div className="member-stat-sub">{sub}</div> : null}
    </div>
  );
}

function SectionCard({ title, lead, children, aside }) {
  return (
    <section className="member-card">
      <div className="member-card-head">
        <div>
          <div className="member-card-title">{title}</div>
          {lead ? <div className="member-card-lead">{lead}</div> : null}
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }) {
  return (
    <div className="member-field">
      <div className="member-field-label">{label}</div>
      <div className="member-field-value">{value || "—"}</div>
    </div>
  );
}

function MiniPill({ children, tone = "default" }) {
  return <span className={`member-pill ${tone}`}>{children}</span>;
}

function emitAuthChanged(detail = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("cw:member-auth-changed", { detail }));
    window.dispatchEvent(new CustomEvent("cw:identity-sync", { detail }));
  } catch {}
}

function hardLocalLogoutCleanup() {
  try {
    safeRemoveLS(SESSION_TOKEN_KEY);
    safeRemoveLS("cw.auth.user");
    safeRemoveLS("cw.auth.state");
    safeRemoveLS("cw.session");
    safeRemoveLS("cw.member.session");
    safeRemoveLS("cw.member.auth");
    safeRemoveLS(LS_KEYS.memberId);
    safeRemoveLS(LS_KEYS.memberTier);
  } catch {}

  const shell = readIdentityShell();
  persistIdentityShell({
    userId: shell.userId || createLocalId("user"),
    memberId: "",
    memberTier: "guest",
    name: cleanString(shell?.identity?.name || shell?.name || "", 160),
    email: normalizeEmail(shell?.identity?.email || shell?.email || ""),
    phone: cleanString(shell?.identity?.phone || shell?.phone || "", 80),
  });

  emitAuthChanged({
    type: "logout",
    localOnly: true,
  });
}

export default function Member() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const location = useLocation();
  const { points, level } = useDreamPoints();

  const ui = React.useMemo(
    () => ({
      ready: TT(i18n, t, "member.words.ready", {
        sv: "Redo",
        en: "Ready",
        tr: "Hazır",
      }),
      start: TT(i18n, t, "member.words.start", {
        sv: "Starta",
        en: "Start",
        tr: "Başlat",
      }),
      yes: TT(i18n, t, "member.words.yes", {
        sv: "Ja",
        en: "Yes",
        tr: "Evet",
      }),
      no: TT(i18n, t, "member.words.no", {
        sv: "Nej",
        en: "No",
        tr: "Hayır",
      }),
      exists: TT(i18n, t, "member.words.exists", {
        sv: "Finns",
        en: "Exists",
        tr: "Var",
      }),
      missing: TT(i18n, t, "member.words.missing", {
        sv: "Saknas",
        en: "Missing",
        tr: "Yok",
      }),
      synced: TT(i18n, t, "member.words.synced", {
        sv: "Synkad",
        en: "Synced",
        tr: "Senkronize",
      }),
      noSession: TT(i18n, t, "member.words.noSession", {
        sv: "Ingen session",
        en: "No session",
        tr: "Oturum yok",
      }),
      error: TT(i18n, t, "member.words.error", {
        sv: "Fel",
        en: "Error",
        tr: "Hata",
      }),
      idle: TT(i18n, t, "member.words.idle", {
        sv: "Vilande",
        en: "Idle",
        tr: "Beklemede",
      }),
      live: TT(i18n, t, "member.words.live", {
        sv: "Live",
        en: "Live",
        tr: "Canlı",
      }),
      preview: TT(i18n, t, "member.words.preview", {
        sv: "Preview",
        en: "Preview",
        tr: "Önizleme",
      }),
      notActivated: TT(i18n, t, "member.words.notActivated", {
        sv: "Inte aktiverad ännu",
        en: "Not activated yet",
        tr: "Henüz etkinleştirilmedi",
      }),
      notSaved: TT(i18n, t, "member.words.notSaved", {
        sv: "Inte sparad ännu",
        en: "Not saved yet",
        tr: "Henüz kaydedilmedi",
      }),
      checkoutActive: TT(i18n, t, "member.checkout.active", {
        sv: "Checkout aktiv",
        en: "Checkout active",
        tr: "Checkout aktif",
      }),
      noDraft: TT(i18n, t, "member.checkout.noDraft", {
        sv: "Ingen påbörjad checkout",
        en: "No checkout started",
        tr: "Başlatılmış checkout yok",
      }),
      tokenInStorage: TT(i18n, t, "member.auth.tokenInStorage", {
        sv: "Finns i localStorage",
        en: "Exists in localStorage",
        tr: "localStorage içinde var",
      }),
      identitySynced: TT(i18n, t, "member.auth.identitySynced", {
        sv: "Identity-service synkad",
        en: "Identity service synced",
        tr: "Identity-service senkronize",
      }),
      authUser: TT(i18n, t, "member.auth.user", {
        sv: "Auth user",
        en: "Auth user",
        tr: "Auth kullanıcısı",
      }),
      verified: TT(i18n, t, "member.auth.verified", {
        sv: "Verifierad",
        en: "Verified",
        tr: "Doğrulandı",
      }),
      devToken: TT(i18n, t, "member.login.devTokenLabel", {
        sv: "Dev-token",
        en: "Dev token",
        tr: "Dev token",
      }),
      pasteToken: TT(i18n, t, "member.login.pasteToken", {
        sv: "klistra in token här",
        en: "paste token here",
        tr: "token buraya yapıştır",
      }),
      sessionToken: TT(i18n, t, "member.auth.sessionToken", {
        sv: "Session token",
        en: "Session token",
        tr: "Oturum tokeni",
      }),
      identityAuth: TT(i18n, t, "member.auth.identityAuth", {
        sv: "Identity auth",
        en: "Identity auth",
        tr: "Identity auth",
      }),
      authSync: TT(i18n, t, "member.auth.sync", {
        sv: "Auth sync",
        en: "Auth sync",
        tr: "Auth sync",
      }),
      userId: TT(i18n, t, "member.private.userId", {
        sv: "User ID",
        en: "User ID",
        tr: "User ID",
      }),
      memberId: TT(i18n, t, "member.private.memberId", {
        sv: "Member ID",
        en: "Member ID",
        tr: "Member ID",
      }),
      identitySnapshotTitle: TT(i18n, t, "member.identity.title", {
        sv: "Identity snapshot",
        en: "Identity snapshot",
        tr: "Identity özeti",
      }),
      identitySnapshotLead: TT(i18n, t, "member.identity.lead", {
        sv: "Läst från identity-service när medlem finns.",
        en: "Read from identity service when a member exists.",
        tr: "Üye varsa identity-service üzerinden okunur.",
      }),
      dining: TT(i18n, t, "member.identity.dining", {
        sv: "Dining",
        en: "Dining",
        tr: "Yemek",
      }),
      credit: TT(i18n, t, "member.identity.credit", {
        sv: "Credit",
        en: "Credit",
        tr: "Kredi",
      }),
      presence: TT(i18n, t, "member.identity.presence", {
        sv: "Presence",
        en: "Presence",
        tr: "Varlık",
      }),
      meals: TT(i18n, t, "member.identity.meals", {
        sv: "Måltider",
        en: "Meals",
        tr: "Öğünler",
      }),
      snacks: TT(i18n, t, "member.identity.snacks", {
        sv: "Snacks",
        en: "Snacks",
        tr: "Atıştırmalıklar",
      }),
      park: TT(i18n, t, "member.identity.park", {
        sv: "Park",
        en: "Park",
        tr: "Park",
      }),
      zone: TT(i18n, t, "member.identity.zone", {
        sv: "Zon",
        en: "Zone",
        tr: "Bölge",
      }),
      notInPark: TT(i18n, t, "member.identity.notInPark", {
        sv: "Inte i park just nu",
        en: "Not in park right now",
        tr: "Şu anda parkta değil",
      }),
      reservation: TT(i18n, t, "member.orders.reservation", {
        sv: "Reservation",
        en: "Reservation",
        tr: "Rezervasyon",
      }),
    }),
    [i18n, t]
  );

  const control = React.useMemo(() => readControlConfig(), []);
  const bootstrapIdentity = React.useMemo(() => ensureIdentityShellState(), []);
  const savedCustomerBoot = React.useMemo(() => readSavedCustomer(), []);
  const savedShipping = React.useMemo(() => readSavedShipping(), []);
  const savedBilling = React.useMemo(() => readSavedBilling(), []);

  const [identityState, setIdentityState] = React.useState(bootstrapIdentity);
  const [remoteMember, setRemoteMember] = React.useState(null);
  const [memberPackage, setMemberPackage] = React.useState(null);
  const [memberPresence, setMemberPresence] = React.useState(null);
  const [backendStatus, setBackendStatus] = React.useState("idle");
  const [backendMsg, setBackendMsg] = React.useState("");

  const [authStatus, setAuthStatus] = React.useState("idle");
  const [authMsg, setAuthMsg] = React.useState("");
  const [authSnapshot, setAuthSnapshot] = React.useState(null);
  const [sessionToken, setSessionToken] = React.useState(readCurrentSessionToken());

  const [name, setName] = React.useState(savedCustomerBoot.name || "");
  const [email, setEmail] = React.useState(savedCustomerBoot.email || "");
  const [phone, setPhone] = React.useState(savedCustomerBoot.phone || "");

  const [saveMsg, setSaveMsg] = React.useState("");
  const [copyMsg, setCopyMsg] = React.useState("");

  const [loginEmail, setLoginEmail] = React.useState(savedCustomerBoot.email || "");
  const [loginName, setLoginName] = React.useState(savedCustomerBoot.name || "");
  const [magicToken, setMagicToken] = React.useState("");
  const [loginBusy, setLoginBusy] = React.useState(false);
  const [loginMsg, setLoginMsg] = React.useState("");
  const [loginError, setLoginError] = React.useState("");
  const [devMagicToken, setDevMagicToken] = React.useState("");
  const [autoTokenBusy, setAutoTokenBusy] = React.useState(false);

  const syncInFlightRef = React.useRef(false);
  const syncQueuedRef = React.useRef(false);
  const syncTimerRef = React.useRef(null);
  const lastSyncAtRef = React.useRef(0);
  const mountedRef = React.useRef(true);
  const latestEmailRef = React.useRef(email);

  React.useEffect(() => {
    latestEmailRef.current = email;
  }, [email]);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, []);

  const effectiveLevel = React.useMemo(() => {
    if (level) return String(level).toLowerCase();
    return calcLevelFromPoints(points);
  }, [level, points]);

  const draftInfo = React.useMemo(() => readCheckoutDraftInfo(), [
    identityState.memberId,
    sessionToken,
    saveMsg,
    loginMsg,
    loginError,
  ]);

  const orders = React.useMemo(() => readOrders(), [
    identityState.memberId,
    sessionToken,
    saveMsg,
    loginMsg,
    loginError,
  ]);

  const savedCustomer = React.useMemo(() => readSavedCustomer(), [
    identityState.memberId,
    sessionToken,
    saveMsg,
  ]);

  const hasMemberAccount = !!identityState.memberId;
  const hasSavedCheckout = !!(
    savedCustomer.name ||
    savedCustomer.email ||
    savedCustomer.phone ||
    name ||
    email ||
    phone
  );
  const hasSessionToken = !!sessionToken;
  const isLoggedIn = authStatus === "ok";

  const associateCode = React.useMemo(
    () => getMemberAssociateCode(remoteMember, authSnapshot),
    [remoteMember, authSnapshot, identityState.memberId, sessionToken, saveMsg, loginMsg]
  );

  const associateShareUrl = React.useMemo(
    () => buildAssociateShareUrl(associateCode),
    [associateCode]
  );

  const recentOrders = React.useMemo(
    () =>
      orders
        .slice()
        .sort((a, b) => {
          const ta = new Date(a?.createdAt || a?.created_at || 0).getTime();
          const tb = new Date(b?.createdAt || b?.created_at || 0).getTime();
          return tb - ta;
        })
        .slice(0, 5),
    [orders]
  );

  const memberModeTitle = isLoggedIn
    ? TT(i18n, t, "member.mode.loggedIn", {
        sv: "Du är inloggad i Mitt Calestra",
        en: "You are logged in to Mitt Calestra",
        tr: "Benim Calestra’ya giriş yaptın",
      })
    : hasMemberAccount
      ? TT(i18n, t, "member.mode.member", {
          sv: "Ditt privata rum i Calestra",
          en: "Your private room in Calestra",
          tr: "Calestra’daki özel alanın",
        })
      : TT(i18n, t, "member.mode.private", {
          sv: "Ett privat rum som gör köpet smidigare",
          en: "A private room that makes checkout smoother",
          tr: "Ödemeyi daha akıcı yapan özel bir alan",
        });

  const runSync = React.useCallback(
    async ({ force = false } = {}) => {
      const now = Date.now();

      if (!force && now - lastSyncAtRef.current < MEMBER_SYNC_MIN_MS) {
        return;
      }

      if (syncInFlightRef.current) {
        syncQueuedRef.current = true;
        return;
      }

      syncInFlightRef.current = true;
      lastSyncAtRef.current = now;

      try {
        const shell = ensureIdentityShellState();
        if (!mountedRef.current) return;

        setIdentityState(shell);
        setSessionToken(readCurrentSessionToken());

        const authResult = await fetchCurrentMember().catch((err) => ({
          ok: false,
          error: cleanString(err?.message || "auth_fetch_failed", 220),
        }));

        if (!mountedRef.current) return;

        if (authResult?.ok && authResult?.member) {
          const nextShell = ensureIdentityShellState();
          setIdentityState(nextShell);
          setSessionToken(readCurrentSessionToken());
          setAuthSnapshot(authResult.raw || authResult);
          setAuthStatus("ok");
          setAuthMsg("");
          setLoginError("");

          if (authResult.member?.name || authResult.member?.email || authResult.member?.phone) {
            setName((prev) => prev || authResult.member.name || "");
            setEmail((prev) => prev || authResult.member.email || "");
            setPhone((prev) => prev || authResult.member.phone || "");
            setLoginName((prev) => prev || authResult.member.name || "");
            setLoginEmail((prev) => prev || authResult.member.email || "");
          }
        } else {
          setAuthSnapshot(null);
          setSessionToken(readCurrentSessionToken());

          if (authResult?.error === "missing_session" || authResult?.status === 401) {
            setAuthStatus("missing_session");
            setAuthMsg(
              TT(i18n, t, "member.auth.missingSession", {
                sv: "Ingen aktiv session hittades. Sparad profil och DreamPoints kan finnas kvar, men kundsessionen är inte inloggad just nu.",
                en: "No active session was found. Saved profile and DreamPoints may still remain, but the customer session is not logged in right now.",
                tr: "Aktif bir oturum bulunamadı. Kayıtlı profil ve DreamPoints kalabilir, ancak müşteri oturumu şu anda giriş yapmış değil.",
              })
            );
          } else if (authResult?.error) {
            setAuthStatus("error");
            setAuthMsg(authResult.error);
          } else {
            setAuthStatus("idle");
            setAuthMsg("");
          }
        }

        const refreshed = ensureIdentityShellState();
        if (!mountedRef.current) return;
        setIdentityState(refreshed);

        let memberId = cleanString(refreshed.memberId || "", 160);

        if (!memberId) {
          const fallbackEmail = normalizeEmail(
            readSavedCustomer()?.email || latestEmailRef.current || ""
          );

          if (fallbackEmail) {
            const memberByEmail = await fetchMemberByEmail(fallbackEmail).catch(() => null);
            if (memberByEmail?.id) {
              memberId = cleanString(memberByEmail.id, 160);
              setRemoteMember(memberByEmail || null);
            }
          }
        }

        if (memberId) {
          setBackendStatus("loading");

          const [memberById, pkg, presence] = await Promise.all([
            fetchMemberById(memberId).catch(() => null),
            fetchMemberPackage(memberId).catch(() => null),
            fetchMemberPresence(memberId).catch(() => null),
          ]);

          if (!mountedRef.current) return;

          setRemoteMember(memberById || remoteMember || null);
          setMemberPackage(pkg || null);
          setMemberPresence(presence || null);
          setIdentityState(ensureIdentityShellState());
          setBackendStatus("ok");
          setBackendMsg("");
        } else {
          if (!mountedRef.current) return;
          setRemoteMember(null);
          setMemberPackage(null);
          setMemberPresence(null);
          setBackendStatus("idle");
          setBackendMsg("");
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setBackendStatus("error");
        setBackendMsg(
          cleanString(err?.message || "member_sync_failed", 220) || "member_sync_failed"
        );
      } finally {
        syncInFlightRef.current = false;

        if (syncQueuedRef.current && mountedRef.current) {
          syncQueuedRef.current = false;
          if (syncTimerRef.current) {
            window.clearTimeout(syncTimerRef.current);
          }
          syncTimerRef.current = window.setTimeout(() => {
            syncTimerRef.current = null;
            runSync({ force: true });
          }, 250);
        }
      }
    },
    [i18n, t, remoteMember]
  );

  const scheduleSync = React.useCallback(
    (opts = {}) => {
      const { force = false, delay = 0 } = opts;
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }

      if (delay > 0) {
        syncTimerRef.current = window.setTimeout(() => {
          syncTimerRef.current = null;
          runSync({ force });
        }, delay);
        return;
      }

      runSync({ force });
    },
    [runSync]
  );

  React.useEffect(() => {
    scheduleSync({ force: true });

    function onFocus() {
      scheduleSync({ delay: 120 });
    }

    function onAuthChanged() {
      scheduleSync({ delay: 120 });
    }

    function onStorage(e) {
      const key = String(e?.key || "");
      if (!key) return;

      if (
        key === SESSION_TOKEN_KEY ||
        key === "cw.auth.user" ||
        key === "cw.auth.state" ||
        key === LS_KEYS.member ||
        key === LS_KEYS.memberId ||
        key === LS_KEYS.savedCustomer ||
        key === LS_KEYS.checkoutPrefill ||
        key === LS_KEYS.orders ||
        ASSOCIATE_LS_KEYS.includes(key)
      ) {
        scheduleSync({ delay: 160 });
      }
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener("cw:member-auth-changed", onAuthChanged);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("cw:member-auth-changed", onAuthChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [scheduleSync]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken =
      cleanString(
        params.get("token") ||
          params.get("magicToken") ||
          params.get("magic_token") ||
          params.get("devToken") ||
          params.get("dev_token") ||
          params.get("loginToken") ||
          "",
        1200
      ) || "";

    if (!urlToken) return;
    if (autoTokenBusy) return;

    let cancelled = false;

    (async () => {
      setAutoTokenBusy(true);
      setLoginBusy(true);
      setLoginMsg("");
      setLoginError("");
      setMagicToken(urlToken);

      try {
        const result = await verifyMemberLoginToken({
          token: urlToken,
          redirectPath: "/member",
        });

        if (cancelled) return;

        setSessionToken(readCurrentSessionToken());
        setAuthStatus("ok");
        setLoginMsg(
          TT(i18n, t, "member.login.verified", {
            sv: "Inloggningen lyckades. Mitt Calestra är nu kopplat till kundsessionen.",
            en: "Login succeeded. Mitt Calestra is now connected to the customer session.",
            tr: "Giriş başarılı. Benim Calestra artık müşteri oturumuna bağlı.",
          })
        );

        scheduleSync({ force: true, delay: 60 });

        params.delete("token");
        params.delete("magicToken");
        params.delete("magic_token");
        params.delete("devToken");
        params.delete("dev_token");
        params.delete("loginToken");

        const nextSearch = params.toString();
        nav(
          {
            pathname: location.pathname,
            search: nextSearch ? `?${nextSearch}` : "",
          },
          { replace: true }
        );

        if (result?.redirectPath && result.redirectPath !== "/member") {
          nav(result.redirectPath);
        }
      } catch (err) {
        if (!cancelled) {
          setLoginError(cleanString(err?.message || "verify_login_failed", 260));
        }
      } finally {
        if (!cancelled) {
          setLoginBusy(false);
          setAutoTokenBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, nav, scheduleSync, i18n, t, autoTokenBusy]);

  function setFlash(text, ms = 2400) {
    setSaveMsg(text);
    window.setTimeout(() => setSaveMsg(""), ms);
  }

  function setCopyFlash(text, ms = 2200) {
    setCopyMsg(text);
    window.setTimeout(() => setCopyMsg(""), ms);
  }

  async function handleCopyAssociateCode() {
    if (!associateCode) return;

    try {
      await copyText(associateCode);
      setCopyFlash(
        TT(i18n, t, "member.associate.copyCodeOk", {
          sv: "Koden kopierades.",
          en: "Code copied.",
          tr: "Kod kopyalandı.",
        })
      );
    } catch {
      setCopyFlash(
        TT(i18n, t, "member.associate.copyError", {
          sv: "Kunde inte kopiera automatiskt.",
          en: "Could not copy automatically.",
          tr: "Otomatik kopyalanamadı.",
        })
      );
    }
  }

  async function handleCopyAssociateLink() {
    if (!associateShareUrl) return;

    try {
      await copyText(associateShareUrl);
      setCopyFlash(
        TT(i18n, t, "member.associate.copyLinkOk", {
          sv: "Spridningslänken kopierades.",
          en: "Share link copied.",
          tr: "Paylaşım bağlantısı kopyalandı.",
        })
      );
    } catch {
      setCopyFlash(
        TT(i18n, t, "member.associate.copyError", {
          sv: "Kunde inte kopiera automatiskt.",
          en: "Could not copy automatically.",
          tr: "Otomatik kopyalanamadı.",
        })
      );
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();

    const nextCustomer = {
      name: cleanString(name, 120),
      email: normalizeEmail(email),
      phone: cleanString(phone, 64),
    };

    writeCustomerPrefill(nextCustomer);
    mergeIdentity(nextCustomer, identityState.userId);
    mergeMemberShell(nextCustomer, effectiveLevel);
    setIdentityState(ensureIdentityShellState());

    try {
      if (identityState.memberId) {
        await patchMember(identityState.memberId, {
          name: nextCustomer.name,
          email: nextCustomer.email,
          phone: nextCustomer.phone,
        }).catch(() => null);
      } else if (nextCustomer.email) {
        const member = await registerOrLoginMember({
          email: nextCustomer.email,
          name: nextCustomer.name,
          phone: nextCustomer.phone,
          locale: getLocale(i18n),
          currency: "SEK",
        });

        if (member?.id) {
          setRemoteMember(member);
          setIdentityState(ensureIdentityShellState());
        }
      }

      setBackendStatus("ok");
      setBackendMsg("");
      scheduleSync({ force: true, delay: 120 });
    } catch (err) {
      setBackendStatus("error");
      setBackendMsg(cleanString(err?.message || "member_save_failed", 220));
    }

    setFlash(
      TT(i18n, t, "member.profile.saved", {
        sv: "Profilen sparades. Checkout blir nu smidigare och kan förifyllas bättre.",
        en: "Profile saved. Checkout is now smoother and can be prefilled better.",
        tr: "Profil kaydedildi. Checkout artık daha akıcı ve daha iyi doldurulabilir.",
      })
    );
  }

  async function handleRequestLogin(e) {
    e.preventDefault();
    setLoginBusy(true);
    setLoginMsg("");
    setLoginError("");
    setDevMagicToken("");

    try {
      const result = await requestMemberLogin({
        email: loginEmail,
        name: loginName,
        phone,
        locale: getLocale(i18n),
        currency: "SEK",
        redirectPath: "/member",
      });

      if (result?.devMagicToken) {
        setDevMagicToken(result.devMagicToken);
        setMagicToken(result.devMagicToken);
        setLoginMsg(
          TT(i18n, t, "member.login.devReady", {
            sv: "Dev-token skapad. Du kan verifiera direkt här nedanför.",
            en: "Dev token created. You can verify it directly below.",
            tr: "Dev token oluşturuldu. Aşağıdan doğrudan doğrulayabilirsin.",
          })
        );
      } else {
        setLoginMsg(
          TT(i18n, t, "member.login.sent", {
            sv: "Loginlänk skickad. När mailflödet är aktivt loggar kunden in via sin länk.",
            en: "Login link sent. When the mail flow is active, the customer logs in via the link.",
            tr: "Giriş bağlantısı gönderildi. Mail akışı aktif olduğunda müşteri bağlantıyla giriş yapar.",
          })
        );
      }

      setEmail((prev) => prev || normalizeEmail(loginEmail));
      setName((prev) => prev || cleanString(loginName, 160));
      scheduleSync({ force: true, delay: 120 });
    } catch (err) {
      setLoginError(cleanString(err?.message || "login_request_failed", 260));
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleVerifyToken(e) {
    e.preventDefault();
    setLoginBusy(true);
    setLoginMsg("");
    setLoginError("");

    try {
      const result = await verifyMemberLoginToken({
        token: magicToken,
        redirectPath: "/member",
      });

      setSessionToken(readCurrentSessionToken());
      setAuthStatus("ok");
      setLoginMsg(
        TT(i18n, t, "member.login.verified", {
          sv: "Inloggningen lyckades. Mitt Calestra är nu kopplat till kundsessionen.",
          en: "Login succeeded. Mitt Calestra is now connected to the customer session.",
          tr: "Giriş başarılı. Benim Calestra artık müşteri oturumuna bağlı.",
        })
      );

      scheduleSync({ force: true, delay: 80 });

      if (result?.redirectPath && result.redirectPath !== "/member") {
        nav(result.redirectPath);
      }
    } catch (err) {
      setLoginError(cleanString(err?.message || "verify_login_failed", 260));
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    setLoginBusy(true);
    setLoginMsg("");
    setLoginError("");

    try {
      await logoutCurrentMember();
    } catch {}

    hardLocalLogoutCleanup();

    setDevMagicToken("");
    setMagicToken("");
    setSessionToken("");
    setAuthSnapshot(null);
    setAuthStatus("missing_session");
    setAuthMsg(
      TT(i18n, t, "member.login.loggedOut", {
        sv: "Du är utloggad.",
        en: "You are logged out.",
        tr: "Çıkış yapıldı.",
      })
    );
    setRemoteMember(null);
    setMemberPackage(null);
    setMemberPresence(null);
    setIdentityState(ensureIdentityShellState());

    scheduleSync({ force: true, delay: 120 });
    setLoginBusy(false);
  }

  function handleStartQuickCheckout() {
    nav("/checkout");
  }

  function handleContinueDraft() {
    if (draftInfo?.draftId) {
      nav(`/cart?restore=${encodeURIComponent(draftInfo.draftId)}`);
      return;
    }
    nav("/checkout");
  }

  async function handleCreateMemberShell() {
    const existingMember = readJsonLS(LS_KEYS.member, {}) || {};
    const memberId = existingMember.memberId || existingMember.id || createLocalId("member");
    const tier = existingMember.memberTier || existingMember.tier || effectiveLevel || "starlight";

    const customerSnapshot = {
      name: cleanString(name || savedCustomer?.name || "", 160),
      email: normalizeEmail(email || savedCustomer?.email || ""),
      phone: cleanString(phone || savedCustomer?.phone || "", 80),
    };

    persistIdentityShell({
      userId: identityState.userId,
      memberId,
      memberTier: tier,
      name: customerSnapshot.name,
      email: customerSnapshot.email,
      phone: customerSnapshot.phone,
    });

    if (customerSnapshot.name || customerSnapshot.email || customerSnapshot.phone) {
      writeCustomerPrefill(customerSnapshot);
    }

    try {
      if (customerSnapshot.email) {
        const member = await registerOrLoginMember({
          email: customerSnapshot.email,
          name: customerSnapshot.name,
          phone: customerSnapshot.phone,
          locale: getLocale(i18n),
          currency: "SEK",
        });

        if (member?.id) {
          setRemoteMember(member);
        }
      }

      setBackendStatus("ok");
      setBackendMsg("");
    } catch (err) {
      setBackendStatus("error");
      setBackendMsg(cleanString(err?.message || "member_activate_failed", 220));
    }

    setIdentityState(ensureIdentityShellState());
    emitAuthChanged({ type: "member-shell-created" });
    scheduleSync({ force: true, delay: 120 });
  }

  function handleResetSavedProfile() {
    safeRemoveLS(LS_KEYS.savedCustomer);
    safeRemoveLS(LS_KEYS.checkoutPrefill);
    safeRemoveLS(LS_KEYS.savedShipping);
    safeRemoveLS(LS_KEYS.savedBilling);

    const identity = readJsonLS(LS_KEYS.identity, {}) || {};
    const nextIdentity = {
      ...identity,
      name: "",
      fullName: "",
      email: "",
      phone: "",
      updatedAt: nowIso(),
    };
    safeSetLS(LS_KEYS.identity, JSON.stringify(nextIdentity));

    const member = readJsonLS(LS_KEYS.member, null);
    if (member && typeof member === "object") {
      safeSetLS(
        LS_KEYS.member,
        JSON.stringify({
          ...member,
          name: "",
          email: "",
          phone: "",
          updatedAt: nowIso(),
        })
      );
    }

    setName("");
    setEmail("");
    setPhone("");
    setLoginName("");
    setLoginEmail("");
    setIdentityState(ensureIdentityShellState());

    setFlash(
      TT(i18n, t, "member.profile.reset", {
        sv: "Sparade uppgifter rensades.",
        en: "Saved details were cleared.",
        tr: "Kayıtlı bilgiler temizlendi.",
      }),
      2200
    );

    scheduleSync({ force: true, delay: 120 });
  }

  return (
    <div className="member-page">
      <div className="member-shell">
        <div className="member-hero">
          <div className="member-kicker">
            <span className="member-kicker-dot" />
            {control.label || "Mitt Calestra"}
          </div>

          <div className="member-hero-grid">
            <div>
              <h1 className="member-title">{memberModeTitle}</h1>
              <p className="member-lead">
                {TT(i18n, t, "member.lead", {
                  sv: "Här möts sparade uppgifter, DreamPoints och framtida medlemsvärde i ett lugnt privat rum. Kundsessionen hålls nu tydligt separerad från sparad profil, så inloggat läge blir stabilare.",
                  en: "This is where saved details, DreamPoints and future member value meet in a calm private room. The customer session is now kept clearly separate from the saved profile, making login state more stable.",
                  tr: "Burada kayıtlı bilgiler, DreamPoints ve gelecekteki üyelik değeri sakin bir özel alanda buluşur. Müşteri oturumu artık kayıtlı profilden net biçimde ayrılır, böylece giriş durumu daha stabil olur.",
                })}
              </p>

              <div className="member-hero-actions">
                <button className="member-btn primary" type="button" onClick={handleStartQuickCheckout}>
                  {TT(i18n, t, "member.cta.quick", {
                    sv: "Till snabbkassa",
                    en: "Go to fast checkout",
                    tr: "Hızlı checkout’a git",
                  })}
                </button>

                <Link className="member-btn ghost" to="/shop">
                  {TT(i18n, t, "member.cta.shop", {
                    sv: "Till butiken",
                    en: "Go to shop",
                    tr: "Mağazaya git",
                  })}
                </Link>

                {draftInfo?.draftId ? (
                  <button className="member-btn soft" type="button" onClick={handleContinueDraft}>
                    {TT(i18n, t, "member.cta.resume", {
                      sv: "Fortsätt där du slutade",
                      en: "Continue where you left off",
                      tr: "Kaldığın yerden devam et",
                    })}
                  </button>
                ) : null}
              </div>

              {authStatus === "missing_session" ? (
                <div className="member-inline-note warn" style={{ marginTop: 12 }}>
                  {authMsg}
                </div>
              ) : null}

              {authStatus === "error" && authMsg ? (
                <div className="member-inline-note warn" style={{ marginTop: 12 }}>
                  {ui.identityAuth}: {authMsg}
                </div>
              ) : null}

              {backendStatus === "error" && backendMsg ? (
                <div className="member-inline-note warn" style={{ marginTop: 12 }}>
                  Backend-sync: {backendMsg}
                </div>
              ) : null}
            </div>

            <div className="member-hero-panel">
              <div className="member-hero-panel-top">
                <div>
                  <div className="member-hero-panel-title">{control.label || "Mitt Calestra"}</div>
                  <div className="member-hero-panel-sub">
                    {isLoggedIn
                      ? TT(i18n, t, "member.state.loggedIn", {
                          sv: "Inloggad kundsession",
                          en: "Logged-in customer session",
                          tr: "Giriş yapılmış müşteri oturumu",
                        })
                      : hasMemberAccount
                        ? TT(i18n, t, "member.state.member", {
                            sv: "Aktivt medlemsläge",
                            en: "Active member mode",
                            tr: "Aktif üyelik modu",
                          })
                        : TT(i18n, t, "member.state.private", {
                            sv: "Privat rum med snabbkassefördelar",
                            en: "Private room with fast checkout benefits",
                            tr: "Hızlı checkout avantajlarıyla özel alan",
                          })}
                  </div>
                </div>

                <MiniPill tone={isLoggedIn ? "success" : hasMemberAccount ? "primary" : "default"}>
                  {isLoggedIn
                    ? TT(i18n, t, "member.badge.loggedIn", {
                        sv: "Inloggad",
                        en: "Logged in",
                        tr: "Giriş yapıldı",
                      })
                    : hasMemberAccount
                      ? TT(i18n, t, "member.badge.member", {
                          sv: "Medlem",
                          en: "Member",
                          tr: "Üye",
                        })
                      : TT(i18n, t, "member.badge.private", {
                          sv: "Privat rum",
                          en: "Private room",
                          tr: "Özel alan",
                        })}
                </MiniPill>
              </div>

              <div className="member-mini-grid">
                <div className="member-mini-box">
                  <div className="member-mini-label">DreamPoints</div>
                  <div className="member-mini-value">{Number(points || 0)}</div>
                </div>

                <div className="member-mini-box">
                  <div className="member-mini-label">
                    {TT(i18n, t, "member.level.label", {
                      sv: "Nivå",
                      en: "Level",
                      tr: "Seviye",
                    })}
                  </div>
                  <div className="member-mini-value small">{levelLabel(effectiveLevel, i18n, t)}</div>
                </div>

                <div className="member-mini-box">
                  <div className="member-mini-label">
                    {TT(i18n, t, "member.saved.label", {
                      sv: "Sparad profil",
                      en: "Saved profile",
                      tr: "Kayıtlı profil",
                    })}
                  </div>
                  <div className="member-mini-value small">
                    {hasSavedCheckout
                      ? ui.yes
                      : TT(i18n, t, "member.saved.no", {
                          sv: "Inte ännu",
                          en: "Not yet",
                          tr: "Henüz değil",
                        })}
                  </div>
                </div>

                <div className="member-mini-box">
                  <div className="member-mini-label">
                    {TT(i18n, t, "member.orders.label", {
                      sv: "Senaste orders",
                      en: "Recent orders",
                      tr: "Son siparişler",
                    })}
                  </div>
                  <div className="member-mini-value">{recentOrders.length}</div>
                </div>
              </div>

              <div className="member-mini-grid" style={{ marginTop: 10 }}>
                <div className="member-mini-box">
                  <div className="member-mini-label">{ui.sessionToken}</div>
                  <div className="member-mini-value small">
                    {hasSessionToken ? ui.exists : ui.missing}
                  </div>
                </div>

                <div className="member-mini-box">
                  <div className="member-mini-label">{ui.identityAuth}</div>
                  <div className="member-mini-value small">
                    {authStatus === "ok"
                      ? ui.synced
                      : authStatus === "missing_session"
                        ? ui.noSession
                        : authStatus === "error"
                          ? ui.error
                          : ui.idle}
                  </div>
                </div>
              </div>

              {!hasMemberAccount ? (
                <button className="member-btn ghost wide" type="button" onClick={handleCreateMemberShell}>
                  {TT(i18n, t, "member.cta.activate", {
                    sv: "Aktivera medlemsläge",
                    en: "Activate member mode",
                    tr: "Üyelik modunu etkinleştir",
                  })}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="member-stats">
          <MemberStat
            label={TT(i18n, t, "member.stats.quick", {
              sv: "Snabbkassa",
              en: "Fast checkout",
              tr: "Hızlı checkout",
            })}
            value={hasSavedCheckout ? ui.ready : ui.start}
            sub={
              hasSavedCheckout
                ? TT(i18n, t, "member.stats.quick.ready", {
                    sv: "uppgifter finns sparade",
                    en: "details are saved",
                    tr: "bilgiler kayıtlı",
                  })
                : TT(i18n, t, "member.stats.quick.empty", {
                    sv: "spara profil för smidigare köp",
                    en: "save your profile for smoother checkout",
                    tr: "daha akıcı checkout için profil kaydet",
                  })
            }
          />

          <MemberStat
            label="DreamPoints™"
            value={Number(points || 0)}
            sub={levelLabel(effectiveLevel, i18n, t)}
          />

          <MemberStat
            label={TT(i18n, t, "member.stats.draft", {
              sv: "Påbörjad kassa",
              en: "Started checkout",
              tr: "Başlatılmış checkout",
            })}
            value={draftInfo?.draftId ? ui.yes : ui.no}
            sub={draftInfo?.updatedAt ? formatShort(draftInfo.updatedAt, i18n) : "—"}
          />

          <MemberStat
            label={TT(i18n, t, "member.stats.orders", {
              sv: "Orders",
              en: "Orders",
              tr: "Siparişler",
            })}
            value={recentOrders.length}
            sub={recentOrders[0]?.createdAt ? formatShort(recentOrders[0].createdAt, i18n) : "—"}
          />
        </div>

        <div className="member-layout">
          <div className="member-main">
            <SectionCard
              title={TT(i18n, t, "member.login.title", {
                sv: "Logga in med e-post",
                en: "Log in with email",
                tr: "E-postayla giriş yap",
              })}
              lead={TT(i18n, t, "member.login.lead", {
                sv: "Det här är kundens riktiga loginflöde. I dev får du token direkt. Du kan också öppna /member med token i URL och låta sidan verifiera automatiskt.",
                en: "This is the customer's real login flow. In dev you get the token directly. You can also open /member with a token in the URL and let the page verify automatically.",
                tr: "Bu müşterinin gerçek giriş akışıdır. Dev ortamında token doğrudan gelir. Ayrıca URL’de token ile /member açabilir ve sayfanın otomatik doğrulamasına izin verebilirsin.",
              })}
              aside={
                isLoggedIn ? (
                  <MiniPill tone="success">
                    {TT(i18n, t, "member.login.live", {
                      sv: "Aktiv session",
                      en: "Active session",
                      tr: "Aktif oturum",
                    })}
                  </MiniPill>
                ) : (
                  <MiniPill tone="warning">
                    {TT(i18n, t, "member.login.pending", {
                      sv: "Inte inloggad",
                      en: "Not logged in",
                      tr: "Giriş yapılmadı",
                    })}
                  </MiniPill>
                )
              }
            >
              <form className="member-form" onSubmit={handleRequestLogin}>
                <label className="member-label">
                  <span>
                    {TT(i18n, t, "form.name", {
                      sv: "Namn",
                      en: "Name",
                      tr: "Ad",
                    })}
                  </span>
                  <input
                    className="member-input"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder={TT(i18n, t, "member.placeholder.name", {
                      sv: "Ditt namn",
                      en: "Your name",
                      tr: "Adın",
                    })}
                  />
                </label>

                <label className="member-label">
                  <span>
                    {TT(i18n, t, "form.email", {
                      sv: "E-post",
                      en: "Email",
                      tr: "E-posta",
                    })}
                  </span>
                  <input
                    className="member-input"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@email.com"
                  />
                </label>

                <div className="member-form-actions">
                  <button className="member-btn primary" type="submit" disabled={loginBusy}>
                    {loginBusy
                      ? TT(i18n, t, "member.login.busy", {
                          sv: "Arbetar…",
                          en: "Working…",
                          tr: "İşleniyor…",
                        })
                      : TT(i18n, t, "member.login.request", {
                          sv: "Skicka loginlänk",
                          en: "Send login link",
                          tr: "Giriş bağlantısı gönder",
                        })}
                  </button>

                  {isLoggedIn ? (
                    <button className="member-btn ghost" type="button" onClick={handleLogout} disabled={loginBusy}>
                      {TT(i18n, t, "member.login.logout", {
                        sv: "Logga ut",
                        en: "Log out",
                        tr: "Çıkış yap",
                      })}
                    </button>
                  ) : null}
                </div>
              </form>

              <form className="member-form" onSubmit={handleVerifyToken} style={{ marginTop: 14 }}>
                <label className="member-label">
                  <span>
                    {TT(i18n, t, "member.login.token", {
                      sv: "Magic token / dev-token",
                      en: "Magic token / dev token",
                      tr: "Magic token / dev token",
                    })}
                  </span>
                  <input
                    className="member-input"
                    value={magicToken}
                    onChange={(e) => setMagicToken(e.target.value)}
                    placeholder={ui.pasteToken}
                  />
                </label>

                {devMagicToken ? (
                  <div className="member-inline-note">
                    <strong>{ui.devToken}:</strong> {devMagicToken}
                  </div>
                ) : null}

                <div className="member-form-actions">
                  <button className="member-btn soft" type="submit" disabled={loginBusy || !cleanString(magicToken, 800)}>
                    {TT(i18n, t, "member.login.verify", {
                      sv: "Verifiera och logga in",
                      en: "Verify and log in",
                      tr: "Doğrula ve giriş yap",
                    })}
                  </button>
                </div>

                {loginMsg ? <div className="member-inline-note">{loginMsg}</div> : null}
                {loginError ? <div className="member-inline-note warn">{loginError}</div> : null}
              </form>
            </SectionCard>

            <SectionCard
              title={TT(i18n, t, "member.associate.title", {
                sv: "Ambassadör & spridningskod",
                en: "Ambassador & share code",
                tr: "Elçi & paylaşım kodu",
              })}
              lead={TT(i18n, t, "member.associate.lead", {
                sv: "Här ska influencern eller ambassadören kunna se sin personliga kod, kopiera sin länk och förstå hur kunder kopplas tillbaka till rätt person.",
                en: "Here an influencer or ambassador can see their personal code, copy their link and understand how customers are connected back to the right person.",
                tr: "Burada influencer veya elçi kişisel kodunu görebilir, bağlantısını kopyalayabilir ve müşterilerin doğru kişiye nasıl bağlandığını anlayabilir.",
              })}
              aside={
                associateCode ? (
                  <MiniPill tone="success">
                    {TT(i18n, t, "member.associate.active", {
                      sv: "Kod aktiv",
                      en: "Code active",
                      tr: "Kod aktif",
                    })}
                  </MiniPill>
                ) : (
                  <MiniPill tone="warning">
                    {TT(i18n, t, "member.associate.pending", {
                      sv: "Kod saknas",
                      en: "Code missing",
                      tr: "Kod yok",
                    })}
                  </MiniPill>
                )
              }
            >
              {associateCode ? (
                <>
                  <div className="member-associate-hero">
                    <div>
                      <div className="member-associate-label">
                        {TT(i18n, t, "member.associate.codeLabel", {
                          sv: "Din kod",
                          en: "Your code",
                          tr: "Kodun",
                        })}
                      </div>
                      <div className="member-associate-code">{associateCode}</div>
                    </div>

                    <div className="member-associate-actions">
                      <button className="member-btn soft" type="button" onClick={handleCopyAssociateCode}>
                        {TT(i18n, t, "member.associate.copyCode", {
                          sv: "Kopiera kod",
                          en: "Copy code",
                          tr: "Kodu kopyala",
                        })}
                      </button>

                      <button className="member-btn primary" type="button" onClick={handleCopyAssociateLink}>
                        {TT(i18n, t, "member.associate.copyLink", {
                          sv: "Kopiera länk",
                          en: "Copy link",
                          tr: "Bağlantıyı kopyala",
                        })}
                      </button>
                    </div>
                  </div>

                  <div className="member-associate-link">{associateShareUrl}</div>

                  <div className="member-associate-steps">
                    <div className="member-associate-step">
                      <strong>1</strong>
                      <span>
                        {TT(i18n, t, "member.associate.step1", {
                          sv: "Ambassadören delar länken eller skriver sin kod i inlägg, bio, video eller kampanj.",
                          en: "The ambassador shares the link or writes their code in posts, bio, video or campaign material.",
                          tr: "Elçi bağlantıyı paylaşır veya kodunu gönderilerde, biyografide, videoda ya da kampanyada yazar.",
                        })}
                      </span>
                    </div>

                    <div className="member-associate-step">
                      <strong>2</strong>
                      <span>
                        {TT(i18n, t, "member.associate.step2", {
                          sv: "Kunden kommer in via länken eller anger koden i flödet. Koden sparas i orderns metadata.",
                          en: "The customer enters through the link or uses the code in the flow. The code is saved in the order metadata.",
                          tr: "Müşteri bağlantıdan gelir veya kodu akışta kullanır. Kod sipariş metadata’sına kaydedilir.",
                        })}
                      </span>
                    </div>

                    <div className="member-associate-step">
                      <strong>3</strong>
                      <span>
                        {TT(i18n, t, "member.associate.step3", {
                          sv: "Admin kan sedan se vilken kod som drog in kunden och räkna provision, belöning eller rabatt enligt reglerna.",
                          en: "Admin can then see which code brought in the customer and calculate commission, reward or discount according to the rules.",
                          tr: "Admin hangi kodun müşteriyi getirdiğini görür ve kurallara göre komisyon, ödül veya indirim hesaplar.",
                        })}
                      </span>
                    </div>
                  </div>

                  {copyMsg ? <div className="member-inline-note">{copyMsg}</div> : null}
                </>
              ) : (
                <div className="member-empty">
                  {TT(i18n, t, "member.associate.empty", {
                    sv: "Ingen ambassadörskod är kopplad till denna medlem ännu. När admin tilldelar en associate-, creator- eller affiliate-kod kan den visas här automatiskt.",
                    en: "No ambassador code is connected to this member yet. When admin assigns an associate, creator or affiliate code, it can appear here automatically.",
                    tr: "Bu üyeye henüz elçi kodu bağlı değil. Admin associate, creator veya affiliate kodu verdiğinde burada otomatik görünebilir.",
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title={TT(i18n, t, "member.profile.title", {
                sv: "Profil för smidigare köp",
                en: "Profile for smoother checkout",
                tr: "Daha akıcı checkout için profil",
              })}
              lead={TT(i18n, t, "member.profile.lead", {
                sv: "Det här är grunden till snabbare och mjukare checkout. Kunden ska känna att allt bara flyter.",
                en: "This is the foundation for faster and smoother checkout. It should simply flow.",
                tr: "Bu daha hızlı ve daha akıcı checkout’un temelidir. Her şey doğal akmalı.",
              })}
              aside={
                <MiniPill tone="primary">
                  {TT(i18n, t, "member.profile.badge", {
                    sv: "Snabbkassefördel",
                    en: "Fast checkout benefit",
                    tr: "Hızlı checkout avantajı",
                  })}
                </MiniPill>
              }
            >
              <form className="member-form" onSubmit={handleSaveProfile}>
                <label className="member-label">
                  <span>
                    {TT(i18n, t, "form.name", {
                      sv: "Namn",
                      en: "Name",
                      tr: "Ad",
                    })}
                  </span>
                  <input
                    className="member-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={TT(i18n, t, "member.placeholder.name", {
                      sv: "Ditt namn",
                      en: "Your name",
                      tr: "Adın",
                    })}
                  />
                </label>

                <label className="member-label">
                  <span>
                    {TT(i18n, t, "form.email", {
                      sv: "E-post",
                      en: "Email",
                      tr: "E-posta",
                    })}
                  </span>
                  <input
                    className="member-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                  />
                </label>

                <label className="member-label">
                  <span>
                    {TT(i18n, t, "form.phone", {
                      sv: "Telefon",
                      en: "Phone",
                      tr: "Telefon",
                    })}
                  </span>
                  <input
                    className="member-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={TT(i18n, t, "member.placeholder.phone", {
                      sv: "Telefonnummer",
                      en: "Phone number",
                      tr: "Telefon numarası",
                    })}
                  />
                </label>

                <div className="member-form-actions">
                  <button className="member-btn primary" type="submit">
                    {TT(i18n, t, "member.profile.save", {
                      sv: "Spara för smidigare checkout",
                      en: "Save for smoother checkout",
                      tr: "Daha akıcı checkout için kaydet",
                    })}
                  </button>

                  <button className="member-btn ghost" type="button" onClick={handleResetSavedProfile}>
                    {TT(i18n, t, "member.profile.clear", {
                      sv: "Rensa sparat",
                      en: "Clear saved details",
                      tr: "Kayıtlı bilgileri temizle",
                    })}
                  </button>
                </div>

                {saveMsg ? <div className="member-inline-note">{saveMsg}</div> : null}
              </form>
            </SectionCard>

            <SectionCard
              title={TT(i18n, t, "member.checkout.title", {
                sv: "Checkout-status",
                en: "Checkout status",
                tr: "Checkout durumu",
              })}
              lead={TT(i18n, t, "member.checkout.lead", {
                sv: "Här ser du om det finns en påbörjad checkout eller sparad checkout-kontext.",
                en: "Here you can see whether there is a started checkout or saved checkout context.",
                tr: "Burada başlatılmış checkout veya kayıtlı checkout bağlamı olup olmadığını görürsün.",
              })}
              aside={draftInfo?.draftId ? <MiniPill tone="warning">{ui.checkoutActive}</MiniPill> : null}
            >
              <div className="member-grid two">
                <Field
                  label={TT(i18n, t, "member.checkout.draftId", {
                    sv: "Draft ID",
                    en: "Draft ID",
                    tr: "Draft ID",
                  })}
                  value={draftInfo?.draftId || ui.noDraft}
                />
                <Field
                  label={TT(i18n, t, "member.checkout.updated", {
                    sv: "Senast uppdaterad",
                    en: "Last updated",
                    tr: "Son güncelleme",
                  })}
                  value={draftInfo?.updatedAt ? formatDate(draftInfo.updatedAt, i18n) : "—"}
                />
                <Field
                  label={TT(i18n, t, "member.checkout.email", {
                    sv: "Checkout-e-post",
                    en: "Checkout email",
                    tr: "Checkout e-postası",
                  })}
                  value={draftInfo?.email || email || "—"}
                />
                <Field
                  label={TT(i18n, t, "member.checkout.step", {
                    sv: "Senaste steg",
                    en: "Last step",
                    tr: "Son adım",
                  })}
                  value={draftInfo?.lastStep || "—"}
                />
              </div>

              <div className="member-form-actions">
                <button className="member-btn soft" type="button" onClick={handleContinueDraft}>
                  {draftInfo?.draftId
                    ? TT(i18n, t, "member.checkout.resume", {
                        sv: "Återuppta checkout",
                        en: "Resume checkout",
                        tr: "Checkout’a devam et",
                      })
                    : TT(i18n, t, "member.checkout.start", {
                        sv: "Starta checkout",
                        en: "Start checkout",
                        tr: "Checkout’u başlat",
                      })}
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title={TT(i18n, t, "member.orders.title", {
                sv: "Senaste orders",
                en: "Recent orders",
                tr: "Son siparişler",
              })}
              lead={TT(i18n, t, "member.orders.lead", {
                sv: "Orderhistoriken visar nu testorder, förbeställningar, blandade orders, kvitton och DreamPoints tydligare.",
                en: "Order history now shows test orders, pre-orders, mixed orders, receipts and DreamPoints more clearly.",
                tr: "Sipariş geçmişi artık test siparişlerini, ön siparişleri, karma siparişleri, fişleri ve DreamPoints’i daha net gösterir.",
              })}
              aside={
                recentOrders.length ? (
                  <MiniPill tone="primary">
                    {recentOrders.length}{" "}
                    {TT(i18n, t, "member.orders.count", {
                      sv: "senaste",
                      en: "recent",
                      tr: "son",
                    })}
                  </MiniPill>
                ) : null
              }
            >
              {!recentOrders.length ? (
                <div className="member-empty">
                  {TT(i18n, t, "member.orders.empty", {
                    sv: "Inga orders ännu. När första ordern är klar blir det här kundens naturliga privata översikt.",
                    en: "No orders yet. Once the first order is complete, this becomes the customer's natural private overview.",
                    tr: "Henüz sipariş yok. İlk sipariş tamamlandığında burası müşterinin doğal özel alanı olur.",
                  })}
                </div>
              ) : (
                <div className="member-order-list">
                  {recentOrders.map((order, idx) => {
                    const oid = normalizeOrderId(order, idx);
                    const flow = getOrderFlow(order);
                    const mode = getOrderMode(order);
                    const tone = getOrderTone(order);
                    const reservationCode = getReservationCode(order);
                    const earned = getOrderDreamEarned(order);
                    const thanksUrl = `/thanks/${encodeURIComponent(oid)}${
                      flow === "preorder" || flow === "mixed"
                        ? `?flow=${flow}${reservationCode ? `&reservation=${encodeURIComponent(reservationCode)}` : ""}`
                        : ""
                    }`;
                    const receiptUrl = `/receipt/${encodeURIComponent(oid)}${
                      flow === "preorder" || flow === "mixed" ? `?flow=${flow}` : ""
                    }`;

                    return (
                      <div key={`${oid}__${idx}`} className="member-order-row enhanced">
                        <div className="member-order-main">
                          <div className="member-order-topline">
                            <div className="member-order-title">{oid}</div>
                            <MiniPill tone={tone}>{getOrderStatusLabel(order, i18n, t)}</MiniPill>
                          </div>

                          <div className="member-order-sub">
                            {formatDate(order?.createdAt || order?.created_at, i18n)}
                          </div>

                          <div className="member-order-meta">
                            <span>{mode === "live" ? ui.live : ui.preview}</span>
                            <span>{getOrderTotal(order)}</span>
                            {earned > 0 ? <span>+{earned} DreamPoints</span> : null}
                            {reservationCode ? <span>{ui.reservation}: {reservationCode}</span> : null}
                          </div>
                        </div>

                        <div className="member-order-right">
                          <Link className="member-order-link primary" to={receiptUrl}>
                            {TT(i18n, t, "member.orders.receipt", {
                              sv: "Kvitto",
                              en: "Receipt",
                              tr: "Fiş",
                            })}
                          </Link>

                          <Link className="member-order-link" to={thanksUrl}>
                            {TT(i18n, t, "member.orders.thanks", {
                              sv: "Tack-sida",
                              en: "Thanks page",
                              tr: "Teşekkür sayfası",
                            })}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          <aside className="member-side">
            <SectionCard
              title={TT(i18n, t, "member.private.title", {
                sv: "Privat utrymme",
                en: "Private space",
                tr: "Özel alan",
              })}
              lead={TT(i18n, t, "member.private.lead", {
                sv: "Det här ska kännas som kundens plats — inte som ett tungt konto eller ett adminläge.",
                en: "This should feel like the customer's place — not like a heavy account or admin mode.",
                tr: "Burası ağır bir hesap ya da admin modu değil, müşterinin alanı gibi hissettirmeli.",
              })}
            >
              <div className="member-grid one">
                <Field label={ui.userId} value={identityState.userId || "—"} />
                <Field label={ui.memberId} value={identityState.memberId || ui.notActivated} />
                <Field
                  label={TT(i18n, t, "member.private.tier", {
                    sv: "Medlemsnivå",
                    en: "Member tier",
                    tr: "Üyelik seviyesi",
                  })}
                  value={levelLabel(identityState.memberTier || effectiveLevel, i18n, t)}
                />
                <Field
                  label={ui.sessionToken}
                  value={hasSessionToken ? ui.tokenInStorage : ui.missing}
                />
                <Field
                  label={ui.authSync}
                  value={
                    authStatus === "ok"
                      ? ui.identitySynced
                      : authStatus === "missing_session"
                        ? ui.noSession
                        : authStatus === "error"
                          ? authMsg || ui.error
                          : ui.idle
                  }
                />
              </div>

              {authSnapshot?.user ? (
                <div className="member-side-note" style={{ marginTop: 12 }}>
                  <strong>{ui.authUser}:</strong> {authSnapshot.user.email || "—"}
                  <br />
                  <strong>{ui.verified}:</strong> {authSnapshot.user.emailVerified ? ui.yes : ui.no}
                </div>
              ) : null}

              {remoteMember ? (
                <div className="member-side-note" style={{ marginTop: 12 }}>
                  <strong>Identity-service:</strong> {ui.synced}
                  <br />
                  {remoteMember.email || "—"}
                </div>
              ) : null}

              {!hasMemberAccount ? (
                <div className="member-side-note">
                  {TT(i18n, t, "member.private.note", {
                    sv: "Just nu använder du Mitt Calestra som ett privat rum med sparade uppgifter, checkout-flyt och DreamPoints. Kundlogin ovanför är nu ett separat lager som kan loggas in och loggas ut tydligare.",
                    en: "Right now, you use Mitt Calestra as a private room with saved details, checkout flow and DreamPoints. Customer login above is now a separate layer that can be logged in and out more clearly.",
                    tr: "Şu anda Benim Calestra’yı kayıtlı bilgiler, checkout akışı ve DreamPoints içeren özel bir alan olarak kullanıyorsun. Yukarıdaki müşteri girişi artık daha net giriş/çıkış yapılabilen ayrı bir katman.",
                  })}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              title="DreamPoints™"
              lead={TT(i18n, t, "member.dp.lead", {
                sv: "Poängen ska kännas som en varm medlemsförmån — inte som ett kallt tekniskt system.",
                en: "Points should feel like a warm member benefit — not like a cold technical system.",
                tr: "Puanlar soğuk teknik bir sistem gibi değil, sıcak bir üyelik avantajı gibi hissettirmeli.",
              })}
              aside={<MiniPill tone="success">{levelLabel(effectiveLevel, i18n, t)}</MiniPill>}
            >
              <div className="member-dp-score">{Number(points || 0)}</div>
              <div className="member-dp-copy">
                {TT(i18n, t, "member.dp.copy", {
                  sv: "När kunden handlar, återkommer och stannar kvar ska detta rum bli mer personligt, snabbare och mer värdefullt.",
                  en: "As the customer shops, returns and stays, this room should become more personal, faster and more valuable.",
                  tr: "Müşteri alışveriş yaptıkça, geri döndükçe ve kaldıkça bu alan daha kişisel, hızlı ve değerli olmalı.",
                })}
              </div>
            </SectionCard>

            <SectionCard
              title={TT(i18n, t, "member.saved.title", {
                sv: "Sparade uppgifter",
                en: "Saved details",
                tr: "Kayıtlı bilgiler",
              })}
              lead={TT(i18n, t, "member.saved.lead", {
                sv: "På sikt ska detta bli kundens säkra standardläge för smidigare orderflöden.",
                en: "Over time, this should become the customer's secure default mode for smoother ordering.",
                tr: "Zamanla bu, müşterinin daha akıcı sipariş için güvenli varsayılan modu olmalı.",
              })}
            >
              <div className="member-grid one">
                <Field
                  label={TT(i18n, t, "form.name", {
                    sv: "Namn",
                    en: "Name",
                    tr: "Ad",
                  })}
                  value={savedCustomer?.name || name}
                />
                <Field
                  label={TT(i18n, t, "form.email", {
                    sv: "E-post",
                    en: "Email",
                    tr: "E-posta",
                  })}
                  value={savedCustomer?.email || email}
                />
                <Field
                  label={TT(i18n, t, "form.phone", {
                    sv: "Telefon",
                    en: "Phone",
                    tr: "Telefon",
                  })}
                  value={savedCustomer?.phone || phone}
                />
                <Field
                  label={TT(i18n, t, "member.saved.shipping", {
                    sv: "Leverans",
                    en: "Shipping",
                    tr: "Teslimat",
                  })}
                  value={
                    savedShipping?.address1
                      ? `${savedShipping.address1}, ${savedShipping.zip || ""} ${savedShipping.city || ""}`
                      : ui.notSaved
                  }
                />
                <Field
                  label={TT(i18n, t, "member.saved.billing", {
                    sv: "Faktura",
                    en: "Billing",
                    tr: "Fatura",
                  })}
                  value={
                    savedBilling?.address1
                      ? `${savedBilling.address1}, ${savedBilling.zip || ""} ${savedBilling.city || ""}`
                      : ui.notSaved
                  }
                />
              </div>
            </SectionCard>

            {memberPackage || memberPresence ? (
              <SectionCard title={ui.identitySnapshotTitle} lead={ui.identitySnapshotLead}>
                <div className="member-grid one">
                  <Field
                    label={ui.dining}
                    value={
                      memberPackage
                        ? `${ui.meals}: ${Number(memberPackage?.dining?.mealsLeft || 0)} · ${ui.snacks}: ${Number(memberPackage?.dining?.snacksLeft || 0)}`
                        : "—"
                    }
                  />
                  <Field
                    label={ui.credit}
                    value={
                      memberPackage
                        ? `${Number(memberPackage?.credit?.creditsUsed || 0)} / ${Number(memberPackage?.credit?.creditsLimit || 0)}`
                        : "—"
                    }
                  />
                  <Field
                    label={ui.presence}
                    value={
                      memberPresence
                        ? memberPresence.isInPark
                          ? `${memberPresence.currentPark || ui.park} · ${memberPresence.currentZone || ui.zone}`
                          : ui.notInPark
                        : "—"
                    }
                  />
                </div>
              </SectionCard>
            ) : null}
          </aside>
        </div>
      </div>

      <style>{`
        .member-page{
          min-height:100%;
          background:
            radial-gradient(circle at top right, rgba(75,107,250,.10), transparent 30%),
            radial-gradient(circle at top left, rgba(250,204,21,.10), transparent 28%);
        }

        .member-shell{
          max-width:1240px;
          margin:0 auto;
          padding:20px 16px 40px;
        }

        .member-hero{
          margin-bottom:18px;
        }

        .member-kicker{
          display:inline-flex;
          align-items:center;
          gap:8px;
          min-height:32px;
          padding:0 12px;
          border-radius:999px;
          border:1px solid rgba(15,23,42,.08);
          background:rgba(255,255,255,.78);
          color:#334155;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.12em;
          text-transform:uppercase;
        }

        .theme-dark .member-kicker{
          background:rgba(15,23,42,.72);
          border-color:rgba(255,255,255,.10);
          color:#cbd5e1;
        }

        .member-kicker-dot{
          width:8px;
          height:8px;
          border-radius:999px;
          background:#4B6BFA;
          box-shadow:0 0 0 0 rgba(75,107,250,.35);
          animation: memberPulse 1.8s infinite;
        }

        @keyframes memberPulse{
          0%{ box-shadow:0 0 0 0 rgba(75,107,250,.35); }
          70%{ box-shadow:0 0 0 8px rgba(75,107,250,0); }
          100%{ box-shadow:0 0 0 0 rgba(75,107,250,0); }
        }

        .member-hero-grid{
          margin-top:14px;
          display:grid;
          grid-template-columns:minmax(0,1.35fr) minmax(320px,.85fr);
          gap:16px;
          align-items:stretch;
        }

        .member-title{
          margin:0 0 10px;
          font-size:clamp(32px,4.8vw,58px);
          line-height:1.01;
          letter-spacing:-.05em;
          color:#0f172a;
          font-weight:1000;
          max-width:16ch;
        }

        .theme-dark .member-title{ color:#f8fafc; }

        .member-lead{
          margin:0;
          max-width:72ch;
          color:#475569;
          font-size:15px;
          line-height:1.7;
          font-weight:700;
        }

        .theme-dark .member-lead{ color:#94a3b8; }

        .member-hero-actions{
          margin-top:18px;
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        }

        .member-btn{
          min-height:44px;
          padding:0 16px;
          border-radius:999px;
          border:1px solid rgba(15,23,42,.08);
          background:#fff;
          color:#0f172a;
          font-weight:900;
          text-decoration:none;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
        }

        .member-btn.primary{
          border-color:transparent;
          background:linear-gradient(135deg,#4B6BFA,#3558ff);
          color:#fff;
          box-shadow:0 16px 30px rgba(75,107,250,.18);
        }

        .member-btn.ghost{
          background:rgba(255,255,255,.86);
        }

        .member-btn.soft{
          background:rgba(15,23,42,.05);
        }

        .member-btn.wide{
          width:100%;
          margin-top:14px;
        }

        .theme-dark .member-btn{
          background:rgba(15,23,42,.78);
          border-color:rgba(255,255,255,.10);
          color:#f8fafc;
        }

        .theme-dark .member-btn.soft{
          background:rgba(255,255,255,.06);
        }

        .member-hero-panel{
          border-radius:24px;
          border:1px solid rgba(15,23,42,.08);
          background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.98));
          box-shadow:0 20px 46px rgba(15,23,42,.08);
          padding:18px;
        }

        .theme-dark .member-hero-panel{
          background:linear-gradient(180deg, rgba(2,6,23,.96), rgba(15,23,42,.96));
          border-color:rgba(255,255,255,.08);
          box-shadow:0 18px 40px rgba(0,0,0,.35);
        }

        .member-hero-panel-top{
          display:flex;
          justify-content:space-between;
          gap:10px;
          align-items:flex-start;
        }

        .member-hero-panel-title{
          font-size:22px;
          line-height:1.05;
          font-weight:1000;
          letter-spacing:-.03em;
          color:#0f172a;
        }

        .theme-dark .member-hero-panel-title{ color:#f8fafc; }

        .member-hero-panel-sub{
          margin-top:6px;
          color:#64748b;
          font-size:13px;
          font-weight:800;
        }

        .theme-dark .member-hero-panel-sub{ color:#cbd5e1; }

        .member-mini-grid{
          margin-top:16px;
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:10px;
        }

        .member-mini-box{
          border-radius:16px;
          padding:12px;
          background:rgba(15,23,42,.03);
          border:1px solid rgba(15,23,42,.06);
        }

        .theme-dark .member-mini-box{
          background:rgba(255,255,255,.04);
          border-color:rgba(255,255,255,.08);
        }

        .member-mini-label{
          color:#64748b;
          font-size:11px;
          font-weight:1000;
          letter-spacing:.06em;
          text-transform:uppercase;
        }

        .theme-dark .member-mini-label{ color:#cbd5e1; }

        .member-mini-value{
          margin-top:6px;
          font-size:24px;
          line-height:1.05;
          font-weight:1000;
          letter-spacing:-.03em;
          color:#0f172a;
        }

        .theme-dark .member-mini-value{ color:#f8fafc; }

        .member-mini-value.small{
          font-size:15px;
        }

        .member-stats{
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:12px;
          margin-bottom:16px;
        }

        .member-stat{
          border-radius:20px;
          padding:16px;
          background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.98));
          border:1px solid rgba(15,23,42,.06);
          box-shadow:0 14px 28px rgba(15,23,42,.05);
        }

        .theme-dark .member-stat{
          background:linear-gradient(180deg, rgba(2,6,23,.96), rgba(15,23,42,.96));
          border-color:rgba(255,255,255,.06);
          box-shadow:0 14px 32px rgba(0,0,0,.28);
        }

        .member-stat-value{
          font-size:30px;
          line-height:1;
          letter-spacing:-.04em;
          font-weight:1000;
          color:#0f172a;
        }

        .theme-dark .member-stat-value{ color:#f8fafc; }

        .member-stat-label{
          margin-top:8px;
          color:#64748b;
          font-size:12px;
          font-weight:1000;
          text-transform:uppercase;
          letter-spacing:.06em;
        }

        .theme-dark .member-stat-label{ color:#cbd5e1; }

        .member-stat-sub{
          margin-top:6px;
          color:#475569;
          font-size:13px;
          font-weight:800;
        }

        .theme-dark .member-stat-sub{ color:#94a3b8; }

        .member-layout{
          display:grid;
          grid-template-columns:minmax(0,1.25fr) minmax(320px,.8fr);
          gap:16px;
          align-items:start;
        }

        .member-main,
        .member-side{
          display:grid;
          gap:16px;
        }

        .member-card{
          border-radius:24px;
          border:1px solid rgba(15,23,42,.06);
          background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.98));
          box-shadow:0 18px 42px rgba(15,23,42,.06);
          padding:18px;
        }

        .theme-dark .member-card{
          background:linear-gradient(180deg, rgba(2,6,23,.96), rgba(15,23,42,.96));
          border-color:rgba(255,255,255,.06);
          box-shadow:0 18px 40px rgba(0,0,0,.3);
        }

        .member-card-head{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:12px;
          margin-bottom:14px;
        }

        .member-card-title{
          font-size:22px;
          line-height:1.08;
          letter-spacing:-.03em;
          font-weight:1000;
          color:#0f172a;
        }

        .theme-dark .member-card-title{ color:#f8fafc; }

        .member-card-lead{
          margin-top:6px;
          color:#64748b;
          font-size:13px;
          line-height:1.55;
          font-weight:700;
          max-width:64ch;
        }

        .theme-dark .member-card-lead{ color:#94a3b8; }

        .member-form{
          display:grid;
          gap:12px;
        }

        .member-label{
          display:grid;
          gap:6px;
        }

        .member-label span{
          color:#334155;
          font-size:13px;
          font-weight:900;
        }

        .theme-dark .member-label span{ color:#e2e8f0; }

        .member-input{
          width:100%;
          min-height:46px;
          border-radius:14px;
          border:1px solid rgba(15,23,42,.10);
          background:#fff;
          color:#0f172a;
          padding:0 12px;
          font-weight:800;
          outline:none;
        }

        .member-input:focus{
          border-color:#4B6BFA;
          box-shadow:0 0 0 4px rgba(75,107,250,.10);
        }

        .theme-dark .member-input{
          background:#0f1622;
          border-color:#243041;
          color:#f8fafc;
        }

        .member-form-actions{
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        }

        .member-inline-note{
          border-radius:14px;
          padding:10px 12px;
          background:rgba(34,197,94,.10);
          border:1px solid rgba(34,197,94,.20);
          color:#166534;
          font-size:13px;
          font-weight:800;
          word-break:break-word;
        }

        .member-inline-note.warn{
          background:rgba(245,158,11,.10);
          border-color:rgba(245,158,11,.22);
          color:#92400e;
        }

        .theme-dark .member-inline-note{
          color:#bbf7d0;
          background:rgba(34,197,94,.12);
          border-color:rgba(34,197,94,.22);
        }

        .theme-dark .member-inline-note.warn{
          color:#fde68a;
          background:rgba(245,158,11,.10);
          border-color:rgba(245,158,11,.22);
        }

        .member-grid{
          display:grid;
          gap:10px;
        }

        .member-grid.one{
          grid-template-columns:1fr;
        }

        .member-grid.two{
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        .member-field{
          border-radius:14px;
          padding:12px;
          background:rgba(15,23,42,.03);
          border:1px solid rgba(15,23,42,.06);
        }

        .theme-dark .member-field{
          background:rgba(255,255,255,.04);
          border-color:rgba(255,255,255,.06);
        }

        .member-field-label{
          color:#64748b;
          font-size:11px;
          font-weight:1000;
          text-transform:uppercase;
          letter-spacing:.08em;
          margin-bottom:6px;
        }

        .theme-dark .member-field-label{ color:#cbd5e1; }

        .member-field-value{
          color:#0f172a;
          font-size:14px;
          line-height:1.5;
          font-weight:800;
          word-break:break-word;
        }

        .theme-dark .member-field-value{ color:#f8fafc; }

        .member-pill{
          display:inline-flex;
          align-items:center;
          min-height:28px;
          padding:0 10px;
          border-radius:999px;
          font-size:11px;
          font-weight:1000;
          text-transform:uppercase;
          letter-spacing:.04em;
          border:1px solid rgba(15,23,42,.08);
          color:#334155;
          background:#fff;
          white-space:nowrap;
        }

        .member-pill.primary{
          color:#1d4ed8;
          border-color:rgba(75,107,250,.20);
          background:rgba(75,107,250,.10);
        }

        .member-pill.success{
          color:#166534;
          border-color:rgba(34,197,94,.20);
          background:rgba(34,197,94,.10);
        }

        .member-pill.warning{
          color:#92400e;
          border-color:rgba(245,158,11,.20);
          background:rgba(245,158,11,.10);
        }

        .theme-dark .member-pill{
          background:rgba(255,255,255,.05);
          border-color:rgba(255,255,255,.10);
          color:#cbd5e1;
        }

        .theme-dark .member-pill.primary{
          color:#bfdbfe;
          border-color:rgba(96,165,250,.22);
          background:rgba(59,130,246,.12);
        }

        .theme-dark .member-pill.success{
          color:#bbf7d0;
          border-color:rgba(34,197,94,.22);
          background:rgba(34,197,94,.12);
        }

        .theme-dark .member-pill.warning{
          color:#fde68a;
          border-color:rgba(245,158,11,.22);
          background:rgba(245,158,11,.10);
        }

        .member-empty{
          padding:14px;
          border-radius:16px;
          background:rgba(15,23,42,.03);
          border:1px dashed rgba(15,23,42,.12);
          color:#475569;
          line-height:1.6;
          font-weight:700;
        }

        .theme-dark .member-empty{
          background:rgba(255,255,255,.03);
          border-color:rgba(255,255,255,.12);
          color:#cbd5e1;
        }

        .member-associate-hero{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:14px;
          padding:14px;
          border-radius:18px;
          background:
            radial-gradient(circle at 100% 0%, rgba(250,204,21,.16), transparent 34%),
            rgba(15,23,42,.03);
          border:1px solid rgba(15,23,42,.07);
        }

        .theme-dark .member-associate-hero{
          background:
            radial-gradient(circle at 100% 0%, rgba(250,204,21,.10), transparent 34%),
            rgba(255,255,255,.04);
          border-color:rgba(255,255,255,.08);
        }

        .member-associate-label{
          color:#64748b;
          font-size:11px;
          font-weight:1000;
          text-transform:uppercase;
          letter-spacing:.08em;
        }

        .theme-dark .member-associate-label{ color:#cbd5e1; }

        .member-associate-code{
          margin-top:6px;
          font-size:clamp(24px,4vw,38px);
          line-height:1;
          font-weight:1000;
          letter-spacing:-.04em;
          color:#0f172a;
          word-break:break-word;
        }

        .theme-dark .member-associate-code{ color:#f8fafc; }

        .member-associate-actions{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          justify-content:flex-end;
        }

        .member-associate-link{
          margin-top:10px;
          padding:10px 12px;
          border-radius:14px;
          background:rgba(75,107,250,.08);
          border:1px solid rgba(75,107,250,.16);
          color:#1d4ed8;
          font-size:13px;
          line-height:1.5;
          font-weight:900;
          word-break:break-all;
        }

        .theme-dark .member-associate-link{
          background:rgba(59,130,246,.12);
          border-color:rgba(96,165,250,.18);
          color:#bfdbfe;
        }

        .member-associate-steps{
          margin-top:12px;
          display:grid;
          gap:10px;
        }

        .member-associate-step{
          display:grid;
          grid-template-columns:32px 1fr;
          gap:10px;
          align-items:start;
          padding:10px;
          border-radius:14px;
          background:rgba(15,23,42,.03);
          border:1px solid rgba(15,23,42,.06);
          color:#475569;
          font-size:13px;
          line-height:1.55;
          font-weight:800;
        }

        .theme-dark .member-associate-step{
          background:rgba(255,255,255,.04);
          border-color:rgba(255,255,255,.07);
          color:#cbd5e1;
        }

        .member-associate-step strong{
          width:32px;
          height:32px;
          border-radius:999px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          background:#0f172a;
          color:#fff;
          font-size:13px;
          font-weight:1000;
        }

        .theme-dark .member-associate-step strong{
          background:#f8fafc;
          color:#020617;
        }

        .member-order-list{
          display:grid;
          gap:10px;
        }

        .member-order-row{
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:center;
          border-radius:16px;
          padding:12px;
          background:rgba(15,23,42,.03);
          border:1px solid rgba(15,23,42,.06);
        }

        .member-order-row.enhanced{
          align-items:flex-start;
          background:
            radial-gradient(circle at 100% 0%, rgba(75,107,250,.08), transparent 34%),
            rgba(15,23,42,.03);
        }

        .theme-dark .member-order-row{
          background:rgba(255,255,255,.04);
          border-color:rgba(255,255,255,.06);
        }

        .theme-dark .member-order-row.enhanced{
          background:
            radial-gradient(circle at 100% 0%, rgba(75,107,250,.12), transparent 34%),
            rgba(255,255,255,.04);
        }

        .member-order-main{
          min-width:0;
          flex:1;
        }

        .member-order-topline{
          display:flex;
          align-items:center;
          gap:8px;
          flex-wrap:wrap;
        }

        .member-order-title{
          color:#0f172a;
          font-weight:1000;
          word-break:break-word;
        }

        .theme-dark .member-order-title{ color:#f8fafc; }

        .member-order-sub{
          margin-top:4px;
          color:#64748b;
          font-size:12px;
          font-weight:700;
        }

        .theme-dark .member-order-sub{ color:#cbd5e1; }

        .member-order-meta{
          margin-top:8px;
          display:flex;
          flex-wrap:wrap;
          gap:6px;
        }

        .member-order-meta span{
          display:inline-flex;
          align-items:center;
          min-height:24px;
          padding:0 8px;
          border-radius:999px;
          background:rgba(255,255,255,.72);
          border:1px solid rgba(15,23,42,.07);
          color:#475569;
          font-size:11px;
          font-weight:900;
        }

        .theme-dark .member-order-meta span{
          background:rgba(255,255,255,.05);
          border-color:rgba(255,255,255,.08);
          color:#cbd5e1;
        }

        .member-order-right{
          display:flex;
          align-items:center;
          gap:8px;
          flex-wrap:wrap;
          justify-content:flex-end;
          flex:0 0 auto;
        }

        .member-order-link{
          text-decoration:none;
          color:#3558ff;
          font-size:13px;
          font-weight:900;
          white-space:nowrap;
        }

        .member-order-link.primary{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-height:32px;
          padding:0 11px;
          border-radius:999px;
          background:#0f172a;
          color:#fff;
        }

        .theme-dark .member-order-link{
          color:#bfdbfe;
        }

        .theme-dark .member-order-link.primary{
          background:#f8fafc;
          color:#020617;
        }

        .member-side-note{
          margin-top:12px;
          padding:12px;
          border-radius:14px;
          background:rgba(15,23,42,.04);
          border:1px dashed rgba(15,23,42,.12);
          color:#475569;
          font-size:13px;
          line-height:1.6;
          font-weight:700;
        }

        .theme-dark .member-side-note{
          background:rgba(255,255,255,.03);
          border-color:rgba(255,255,255,.12);
          color:#cbd5e1;
        }

        .member-dp-score{
          font-size:42px;
          line-height:1;
          letter-spacing:-.05em;
          font-weight:1000;
          color:#0f172a;
        }

        .theme-dark .member-dp-score{ color:#f8fafc; }

        .member-dp-copy{
          margin-top:10px;
          color:#475569;
          font-size:14px;
          line-height:1.7;
          font-weight:700;
        }

        .theme-dark .member-dp-copy{ color:#cbd5e1; }

        @media (max-width:1120px){
          .member-hero-grid,
          .member-layout{
            grid-template-columns:1fr;
          }
        }

        @media (max-width:860px){
          .member-stats{
            grid-template-columns:repeat(2,minmax(0,1fr));
          }

          .member-grid.two{
            grid-template-columns:1fr;
          }
        }

        @media (max-width:560px){
          .member-shell{
            padding:14px 12px 28px;
          }

          .member-stats{
            grid-template-columns:1fr;
          }

          .member-mini-grid{
            grid-template-columns:1fr;
          }

          .member-title{
            max-width:none;
          }

          .member-card-head,
          .member-order-row,
          .member-associate-hero{
            flex-direction:column;
            align-items:stretch;
          }

          .member-order-right,
          .member-associate-actions{
            justify-content:flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce){
          .member-kicker-dot{
            animation:none;
          }
        }
      `}</style>
    </div>
  );
}