import React from "react";

const DreamPointsContext = React.createContext(null);

const PROFILE_KEY = "cw.dreampoints.profile";
const AWARDED_ORDERS_KEY = "cw.dreampoints.awarded.orders";
const DREAMPOINTS_EVENT = "cw:dreampoints-changed";

function safeJsonParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function readLocalJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return safeJsonParse(raw, fallback);
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function emitDreamPointsChanged() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(DREAMPOINTS_EVENT));
  } catch {}
}

function cleanLevel(value) {
  const v = String(value || "starlight").trim().toLowerCase();
  if (v === "aurora") return "aurora";
  if (v === "celestial") return "celestial";
  if (v === "moonlight") return "moonlight";
  return "starlight";
}

function clampNonNegativeInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

function getDefaultProfile() {
  return {
    points: 0,
    level: "starlight",
    updatedAt: "",
  };
}

function readProfile() {
  const raw = readLocalJson(PROFILE_KEY, getDefaultProfile());
  return {
    points: clampNonNegativeInt(raw?.points, 0),
    level: cleanLevel(raw?.level),
    updatedAt: String(raw?.updatedAt || ""),
  };
}

function writeProfile(profile) {
  const next = {
    points: clampNonNegativeInt(profile?.points, 0),
    level: cleanLevel(profile?.level),
    updatedAt: profile?.updatedAt || new Date().toISOString(),
  };
  writeLocalJson(PROFILE_KEY, next);
  emitDreamPointsChanged();
  return next;
}

function normalizeAwardedMap(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out = {};

  for (const [key, value] of Object.entries(input)) {
    const id = String(key || "").trim();
    if (!id) continue;

    if (value === true) {
      out[id] = {
        earned: 0,
        amountSek: 0,
        awardedAt: "",
      };
      continue;
    }

    if (value && typeof value === "object") {
      out[id] = {
        earned: clampNonNegativeInt(value.earned, 0),
        amountSek: Math.max(0, Number(value.amountSek || 0)),
        awardedAt: String(value.awardedAt || ""),
      };
    }
  }

  return out;
}

function readAwardedOrders() {
  const map = readLocalJson(AWARDED_ORDERS_KEY, {});
  return normalizeAwardedMap(map);
}

function writeAwardedOrders(map) {
  writeLocalJson(AWARDED_ORDERS_KEY, normalizeAwardedMap(map));
  emitDreamPointsChanged();
}

function levelFromPoints(points) {
  const p = clampNonNegativeInt(points, 0);
  if (p >= 1500) return "celestial";
  if (p >= 600) return "aurora";
  if (p >= 150) return "moonlight";
  return "starlight";
}

function calcEarnOnSubtotalSek(subtotalSek) {
  const sek = Math.max(0, Number(subtotalSek || 0));
  return Math.floor(sek / 10);
}

function calcMaxRedeemSek(points) {
  return Math.floor(clampNonNegativeInt(points, 0) / 10);
}

export function DreamPointsProvider({ children }) {
  const [profile, setProfile] = React.useState(() => readProfile());

  const refresh = React.useCallback(() => {
    const latest = readProfile();
    setProfile(latest);
    return latest;
  }, []);

  React.useEffect(() => {
    const sync = () => {
      setProfile(readProfile());
    };

    const onStorage = (e) => {
      if (!e || e.key === PROFILE_KEY || e.key === AWARDED_ORDERS_KEY) {
        sync();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
      window.addEventListener("focus", sync);
      window.addEventListener(DREAMPOINTS_EVENT, sync);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("focus", sync);
        window.removeEventListener(DREAMPOINTS_EVENT, sync);
      }
    };
  }, []);

  const setPoints = React.useCallback((nextPoints) => {
    const normalizedPoints = clampNonNegativeInt(nextPoints, 0);
    const next = writeProfile({
      points: normalizedPoints,
      level: levelFromPoints(normalizedPoints),
      updatedAt: new Date().toISOString(),
    });
    setProfile(next);
    return next;
  }, []);

  const setLevel = React.useCallback((nextLevel) => {
    const current = readProfile();
    const next = writeProfile({
      ...current,
      level: cleanLevel(nextLevel),
      updatedAt: new Date().toISOString(),
    });
    setProfile(next);
    return next;
  }, []);

  const addPoints = React.useCallback((amount) => {
    const current = readProfile();
    const earned = clampNonNegativeInt(amount, 0);
    const total = current.points + earned;

    const next = writeProfile({
      points: total,
      level: levelFromPoints(total),
      updatedAt: new Date().toISOString(),
    });

    setProfile(next);
    return next;
  }, []);

  const previewForCart = React.useCallback(
    (subtotalSek) => {
      const currentPoints = clampNonNegativeInt(readProfile().points, profile.points);
      const earnOnThisOrder = calcEarnOnSubtotalSek(subtotalSek);
      const nextBalance = currentPoints + earnOnThisOrder;
      const maxRedeemSek = calcMaxRedeemSek(nextBalance);

      return {
        balance: currentPoints,
        level: cleanLevel(profile.level),
        earnOnThisOrder,
        nextBalance,
        maxRedeemSek,
      };
    },
    [profile.points, profile.level]
  );

  const getSnapshot = React.useCallback(() => {
    const latest = readProfile();
    return {
      points: clampNonNegativeInt(latest.points, 0),
      level: cleanLevel(latest.level),
      maxRedeemSek: calcMaxRedeemSek(latest.points),
      updatedAt: latest.updatedAt || "",
    };
  }, []);

  const hasAwardedOrder = React.useCallback((orderId) => {
    const id = String(orderId || "").trim();
    if (!id) return false;
    const awarded = readAwardedOrders();
    return !!awarded[id];
  }, []);

  const getAwardedOrder = React.useCallback((orderId) => {
    const id = String(orderId || "").trim();
    if (!id) return null;
    const awarded = readAwardedOrders();
    return awarded[id] || null;
  }, []);

  const awardOrderPoints = React.useCallback((orderId, amountSek) => {
    const id = String(orderId || "").trim();
    if (!id) {
      return {
        ok: false,
        reason: "missing_order_id",
        alreadyAwarded: false,
        earned: 0,
        profile: readProfile(),
      };
    }

    const awarded = readAwardedOrders();
    if (awarded[id]) {
      const current = readProfile();
      return {
        ok: true,
        alreadyAwarded: true,
        earned: clampNonNegativeInt(awarded[id]?.earned, 0),
        profile: current,
      };
    }

    const earned = calcEarnOnSubtotalSek(amountSek);
    const current = readProfile();

    awarded[id] = {
      earned,
      amountSek: Math.max(0, Number(amountSek || 0)),
      awardedAt: new Date().toISOString(),
    };

    writeAwardedOrders(awarded);

    const nextPoints = current.points + earned;
    const nextProfile = writeProfile({
      points: nextPoints,
      level: levelFromPoints(nextPoints),
      updatedAt: new Date().toISOString(),
    });

    setProfile(nextProfile);

    return {
      ok: true,
      alreadyAwarded: false,
      earned,
      profile: nextProfile,
    };
  }, []);

  const resetAll = React.useCallback(() => {
    const next = writeProfile(getDefaultProfile());
    writeAwardedOrders({});
    setProfile(next);
    return next;
  }, []);

  const value = React.useMemo(
    () => ({
      points: clampNonNegativeInt(profile.points, 0),
      level: cleanLevel(profile.level),
      refresh,
      setPoints,
      setLevel,
      addPoints,
      previewForCart,
      getSnapshot,
      hasAwardedOrder,
      getAwardedOrder,
      awardOrderPoints,
      resetAll,
    }),
    [
      profile.points,
      profile.level,
      refresh,
      setPoints,
      setLevel,
      addPoints,
      previewForCart,
      getSnapshot,
      hasAwardedOrder,
      getAwardedOrder,
      awardOrderPoints,
      resetAll,
    ]
  );

  return (
    <DreamPointsContext.Provider value={value}>
      {children}
    </DreamPointsContext.Provider>
  );
}

export function useDreamPoints() {
  const ctx = React.useContext(DreamPointsContext);
  if (!ctx) {
    throw new Error("useDreamPoints must be used inside DreamPointsProvider");
  }
  return ctx;
}

export default DreamPointsContext;