// CommonJS helper för Express-säkerhet + CORS
const express = require("express");
const corsLib = require("cors");

function applySecurity(app, opts = {}) {
  const {
    corsOrigins = "*",
    jsonLimit = "200kb",
    rate = null, // ev. rate limiter senare
  } = opts;

  // Lätta säkerhetsheaders (kan byggas ut)
  app.use((_, res, next) => {
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // CORS
  const corsOptions = corsOrigins === "*" || (Array.isArray(corsOrigins) && corsOrigins.length === 0)
    ? { origin: true, credentials: true }
    : {
        origin(origin, cb) {
          if (!origin) return cb(null, true);
          const ok = corsOrigins.includes(origin);
          cb(ok ? null : new Error("CORS blocked"), ok);
        },
        credentials: true,
      };

  app.use(corsLib(corsOptions));
  app.use(express.json({ limit: jsonLimit }));
}

module.exports = { applySecurity };
