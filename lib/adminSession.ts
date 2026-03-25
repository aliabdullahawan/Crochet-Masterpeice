const ADMIN_LOGIN_KEY = "cm_admin_logged_in";
const ADMIN_NAME_KEY = "cm_admin_name";
const ADMIN_EMAIL_KEY = "cm_admin_email";
const ADMIN_LOGIN_AT_KEY = "cm_admin_login_at";

// 24 hours hard session duration for admin panel.
const ADMIN_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function startAdminSession(name: string, email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_LOGIN_KEY, "true");
  localStorage.setItem(ADMIN_NAME_KEY, name);
  localStorage.setItem(ADMIN_EMAIL_KEY, email);
  localStorage.setItem(ADMIN_LOGIN_AT_KEY, String(Date.now()));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_LOGIN_KEY);
  localStorage.removeItem(ADMIN_NAME_KEY);
  localStorage.removeItem(ADMIN_EMAIL_KEY);
  localStorage.removeItem(ADMIN_LOGIN_AT_KEY);
}

export function isAdminSessionValid() {
  if (typeof window === "undefined") return false;

  const isLoggedIn = localStorage.getItem(ADMIN_LOGIN_KEY) === "true";
  if (!isLoggedIn) return false;

  const rawLoginAt = localStorage.getItem(ADMIN_LOGIN_AT_KEY);
  if (!rawLoginAt) {
    // Backfill old sessions created before timestamp support.
    localStorage.setItem(ADMIN_LOGIN_AT_KEY, String(Date.now()));
    return true;
  }

  const loginAt = Number(rawLoginAt);
  if (!Number.isFinite(loginAt) || loginAt <= 0) return false;

  return Date.now() - loginAt <= ADMIN_SESSION_MAX_AGE_MS;
}
