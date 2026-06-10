// D:\WebProjects\Calestra\apps\store-classic\vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function noSlash(v) {
  return String(v || "").replace(/\/$/, "");
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const CELESTE_URL = noSlash(env.VITE_CELESTE_URL || "http://localhost:14100");
  const MEANING_URL = noSlash(env.VITE_MEANING_URL || "http://localhost:14120");
  const ANALYTICS_URL = noSlash(env.VITE_ANALYTICS_URL || "http://localhost:14090");
  const ORDERS_URL = noSlash(env.VITE_ORDERS_URL || "http://127.0.0.1:14202");
  const IDENTITY_URL = noSlash(env.VITE_IDENTITY_URL || "http://127.0.0.1:14070");

  const PUBLIC_API_BASE = noSlash(
    env.VITE_PUBLIC_API_BASE || "https://magiskacalestra.se"
  );

  return {
    plugins: [react()],
    server: {
      port: 5175,
      strictPort: true,

      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "magiskacalestra.se",
        ".magiskacalestra.se",
        "store.magiskacalestra.se",
        "admin.magiskacalestra.se",
        "admin.calestra.internal",
        "admin.magiskacalestra.internal",
      ],

      proxy: {
        "/svc/orders": {
          target: ORDERS_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/orders/, ""),
        },

        "/svc/identity": {
          target: IDENTITY_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/identity/, ""),
        },

        "/api/analytics": {
          target: ANALYTICS_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/analytics/, ""),
        },

        "/svc/analytics": {
          target: ANALYTICS_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/analytics/, ""),
        },

        "/api/celeste/health": {
          target: CELESTE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/celeste\/health/, "/health"),
        },

        "/api/celeste": {
          target: CELESTE_URL,
          changeOrigin: true,
          secure: false,
        },

        "/api/ask": {
          target: CELESTE_URL,
          changeOrigin: true,
          secure: false,
        },

        "/api/tools": {
          target: CELESTE_URL,
          changeOrigin: true,
          secure: false,
        },

        "/svc/celeste": {
          target: CELESTE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/celeste/, ""),
        },

        "/api/meaning": {
          target: MEANING_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/meaning/, "/api"),
        },

        "/svc/meaning": {
          target: MEANING_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/svc\/meaning/, "/api"),
        },

        "/api/progress": {
          target: PUBLIC_API_BASE,
          changeOrigin: true,
          secure: false,
        },

        "/api/status": {
          target: PUBLIC_API_BASE,
          changeOrigin: true,
          secure: false,
        },

        "/api/subscribe": {
          target: PUBLIC_API_BASE,
          changeOrigin: true,
          secure: false,
        },

        "/api/confirm": {
          target: PUBLIC_API_BASE,
          changeOrigin: true,
          secure: false,
        },

        "/api/unsubscribe": {
          target: PUBLIC_API_BASE,
          changeOrigin: true,
          secure: false,
        },

        "/api/associate": {
          target: PUBLIC_API_BASE,
          changeOrigin: true,
          secure: false,
        },

        "/api/checkout-draft": {
          target: PUBLIC_API_BASE,
          changeOrigin: true,
          secure: false,
        },

        "/api/checkout-restore": {
          target: PUBLIC_API_BASE,
          changeOrigin: true,
          secure: false,
        },

        "/api/orders/register": {
          target: PUBLIC_API_BASE,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});