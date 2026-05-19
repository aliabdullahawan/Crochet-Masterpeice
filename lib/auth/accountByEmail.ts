import type { SupabaseClient } from "@supabase/supabase-js";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

/** Returns true if this email already has a row in public.users or Supabase Auth. */
export async function accountExistsForEmail(
  service: SupabaseClient,
  email: string
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  const { data: row } = await service.from("users").select("id").eq("email", normalized).maybeSingle();
  if (row) return true;

  try {
    const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return false;
    return (data.users ?? []).some((u) => u.email?.toLowerCase() === normalized);
  } catch {
    return false;
  }
}

/** Magic link for existing accounts (included in order confirmation email). */
export async function createMagicLoginLink(
  service: SupabaseClient,
  email: string,
  redirectPath = "/user/orders"
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const redirectTo = `${siteUrl()}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`;

  const { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: normalized,
    options: { redirectTo },
  });

  if (error) {
    console.error("[createMagicLoginLink]", error.message);
    return null;
  }

  return data.properties?.action_link ?? null;
}

/** Sends Supabase OTP / magic link email (uses Supabase mailer, not Brevo). */
export async function sendSupabaseMagicOtp(service: SupabaseClient, email: string, redirectPath = "/user/home") {
  const redirectTo = `${siteUrl()}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`;
  return service.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: redirectTo },
  });
}
