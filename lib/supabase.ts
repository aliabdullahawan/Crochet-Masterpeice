import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── Supabase singleton client ─────────────────────────────────
// Singleton prevents multiple instances from fighting over Web Locks (AbortError)
// persistSession=true means session survives browser close (60 day refresh token)
let _supabase: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (_supabase) return _supabase;
  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "cm-auth",
    },
  });
  return _supabase;
})();

// ── Server-side client (API routes only) ──────────────────────
export function createServiceClient() {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

const SITE_URL = () =>
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ── Sign in with email + password ────────────────────────────
// Session persists in localStorage regardless of rememberMe
// rememberMe just controls whether we show a welcome back message
export async function signInWithEmail(email: string, password: string, rememberMe = false) {
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (!result.error && typeof window !== "undefined") {
    localStorage.setItem("cm_remember_me", rememberMe ? "true" : "false");
  }
  return result;
}

// ── Sign up ───────────────────────────────────────────────────
export async function signUpWithEmail(email: string, password: string, name: string, phone?: string) {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone: phone ?? null },
      emailRedirectTo: `${SITE_URL()}/user/home`,
    },
  });
  if (!result.error && result.data.user) {
    // The trigger handle_new_user() in DATABASE_CLEAN.sql creates the user row automatically.
    // This upsert is a fallback in case the trigger isn't set up yet.
    try {
      await supabase.from("users").upsert({
        id: result.data.user.id,
        email: result.data.user.email!,
        name,
        phone: phone ?? "",
        address: "",
      } as unknown as never, { onConflict: "id" });
    } catch {
      // Trigger handles it — this is just a safety net
    }
  }
  return result;
}

// ── Google OAuth ──────────────────────────────────────────────
export async function signInWithGoogle(redirectTo = "/user/home") {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${SITE_URL()}${redirectTo}`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
}

// ── Password reset ────────────────────────────────────────────
export async function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL()}/user/forgot-password?step=3`,
  });
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

// ── Sign out ──────────────────────────────────────────────────
export async function signOut() {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") {
    ["cm_user_logged_in","cm_user_name","cm_user_email",
     "cm_user_id","cm_remember_me","cm_user_avatar"].forEach(k => localStorage.removeItem(k));
  }
}
