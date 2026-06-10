// apps/store-classic/src/utils/urls.js
export const STORE_URL =
  (import.meta.env.VITE_BASE_URL_STORE || '').trim() || 'http://localhost:5175/';

export const PORTAL_URL =
  (import.meta.env.VITE_BASE_URL_PORTAL || '').trim() || 'http://localhost:5288/';

// Säkerställ snedstreck i slutet (bra vid "href" sammansättning)
function withTrailingSlash(u) {
  try {
    if (!u) return '/';
    return u.endsWith('/') ? u : `${u}/`;
  } catch {
    return '/';
  }
}

export const STORE_ORIGIN = withTrailingSlash(STORE_URL);
export const PORTAL_ORIGIN = withTrailingSlash(PORTAL_URL);
