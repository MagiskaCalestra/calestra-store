// D:\WebProjects\Calestra\apps\admin\src\core\identity\tokenModel.js
const KEY_TOKEN = "cw.admin.token";
const KEY_USER = "cw.admin.user";

export function getToken() {
  try {
    return localStorage.getItem(KEY_TOKEN) || "";
  } catch {
    return "";
  }
}

export function setToken(token) {
  try {
    if (!token) localStorage.removeItem(KEY_TOKEN);
    else localStorage.setItem(KEY_TOKEN, String(token));
  } catch {
    // ignore
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY_TOKEN);
  } catch {
    // ignore
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (!user) localStorage.removeItem(KEY_USER);
    else localStorage.setItem(KEY_USER, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearStoredUser() {
  try {
    localStorage.removeItem(KEY_USER);
  } catch {
    // ignore
  }
}
