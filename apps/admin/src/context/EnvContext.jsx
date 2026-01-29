// D:\WebProjects\Calestra\apps\admin\src\context\EnvContext.jsx
import React from "react";

/**
 * EnvContext (Admin)
 * - Stabil bas för GREEN/BLUE/CUSTOM i Admin
 * - Lagrar i localStorage: "cw.env.active"
 * - Ger dig origins för web/store/admin som du kan använda i UI
 *
 * Obs: QAPanel.jsx kan fungera utan detta, men detta gör admin robust för framtiden.
 */

const ENV_KEY = "cw.env.active";

const DEFAULTS = {
  GREEN: { web: "http://localhost:5288", store: "http://localhost:5175", admin: "http://localhost:5179" },
  BLUE: { web: "http://localhost:5289", store: "http://localhost:5176", admin: "http://localhost:5180" },
};

function safeGetLS(key, fallback = null) {
  try {
    const v = window.localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

function safeSetLS(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function detectEnvByPort(portStr) {
  const p = Number(portStr || 0);
  if ([5288, 5175, 5179].includes(p)) return "GREEN";
  if ([5289, 5176, 5180].includes(p)) return "BLUE";
  return "CUSTOM";
}

const EnvContext = React.createContext(null);

export function EnvProvider({ children }) {
  const port = (typeof window !== "undefined" ? window.location.port : "") || "";
  const autoEnv = detectEnvByPort(port);

  const [activeEnv, setActiveEnv] = React.useState(() => {
    const saved = safeGetLS(ENV_KEY, "");
    return saved || autoEnv;
  });

  React.useEffect(() => {
    safeSetLS(ENV_KEY, activeEnv);
  }, [activeEnv]);

  const value = React.useMemo(() => {
    const env = String(activeEnv || autoEnv).toUpperCase();

    const origins =
      env === "GREEN"
        ? DEFAULTS.GREEN
        : env === "BLUE"
          ? DEFAULTS.BLUE
          : {
              web: DEFAULTS.GREEN.web,
              store: DEFAULTS.GREEN.store,
              admin: DEFAULTS.GREEN.admin,
            };

    return {
      activeEnv: env,
      setActiveEnv: (v) => setActiveEnv(String(v || "CUSTOM").toUpperCase()),
      autoEnv,
      origins,
      DEFAULTS,
      key: ENV_KEY,
    };
  }, [activeEnv, autoEnv]);

  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>;
}

export function useEnv() {
  const ctx = React.useContext(EnvContext);
  if (!ctx) throw new Error("useEnv must be used within <EnvProvider>");
  return ctx;
}
