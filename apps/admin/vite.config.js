// D:\WebProjects\Calestra\apps\admin\vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function noSlash(v) {
  return String(v || "").replace(/\/$/, "");
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const ORDERS_URL = noSlash(env.VITE_ORDERS_URL || "http://127.0.0.1:14202");
  const FINANCE_URL = noSlash(env.VITE_FINANCE_URL || "http://127.0.0.1:14010");
  const ANALYTICS_URL = noSlash(env.VITE_ANALYTICS_URL || "http://127.0.0.1:14090");
  const STATUS_URL = noSlash(env.VITE_STATUS_URL || "http://127.0.0.1:14060");
  const IDENTITY_URL = noSlash(env.VITE_IDENTITY_URL || "http://127.0.0.1:14020");
  const CELESTE_URL = noSlash(env.VITE_CELESTE_URL || "http://127.0.0.1:14100");

  // Hostnames som får nå Vite DEV-servern (tunnel/domän)
  const ALLOWED_HOSTS = [
    "admin.magiskacalestra.se",
    // om du ibland kör via tunnel-URL också (valfritt)
    // "admin.magiskacalestra.se",
  ];

  return {
    plugins: [react()],
    server: {
      // Viktigt för Cloudflare Tunnel -> localhost
      host: true, // tillåt externa host headers
      allowedHosts: ALLOWED_HOSTS,

      // (valfritt) om du vill låsa porten:
      // port: 5179,
      // strictPort: true,

      proxy: {
        // Orders-service
        "/svc/orders": {
          target: ORDERS_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/orders/, ""),
        },

        // Finance-service (riktiga backend: services/finance-service, 14010)
        // Strip prefix -> /health, /api/finance/* på finance-service
        "/svc/finance": {
          target: FINANCE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/finance/, ""),
        },

        // Analytics-service
        // Strip prefix -> /health, /api/analytics/* eller /stats/* beroende på service
        "/svc/analytics": {
          target: ANALYTICS_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/analytics/, ""),
        },

        // Status-service
        "/svc/status": {
          target: STATUS_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/status/, ""),
        },

        // Identity-service
        "/svc/identity": {
          target: IDENTITY_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/identity/, ""),
        },

        // Celeste (framtida)
        "/svc/celeste": {
          target: CELESTE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/celeste/, ""),
        },
      },
    },
  };
});
