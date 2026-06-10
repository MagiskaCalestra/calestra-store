// D:\WebProjects\Calestra\apps\store-classic\src\components\MetaIndexing.jsx

import React from "react";

export default function MetaIndexing() {
  const env = import.meta.env.MODE; // development / production
  const explicit = import.meta.env.VITE_PUBLIC_INDEXING;

  // 🔒 Regel:
  // - Dev = alltid noindex
  // - Production = index om inte explicit false

  const disable =
    env !== "production" || String(explicit).toLowerCase() === "false";

  if (!disable) return null;

  return (
    <>
      <meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />
      <meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet" />
    </>
  );
}