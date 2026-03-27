import { NextResponse } from "next/server";

/**
 * GET /api/social-counts
 *
 * Returns follower/subscriber counts for all social platforms.
 *
 * REALITY CHECK on APIs:
 * - Instagram: Requires Graph API + Business account token (set INSTAGRAM_ACCESS_TOKEN env var)
 * - Facebook:  Requires Graph API + Page token (set FACEBOOK_PAGE_ID + FACEBOOK_ACCESS_TOKEN)
 * - TikTok:    Requires approved TikTok Developer app (set TIKTOK_CLIENT_KEY + username)
 * - WhatsApp Channel: NO PUBLIC API — must be set manually in Supabase site_settings
 * - Site Users: Counted from Supabase users table via service role key
 *
 * For any platform where the API key is not configured, falls back to
 * the value stored in Supabase site_settings table (admin-updateable).
 */

interface SocialResult {
  platform: string;
  count: number;
  source: "api" | "manual" | "cached";
  error?: string;
}

const DEFAULT_COUNTS = {
  whatsapp: 0,
  instagram_manual: 0,
  facebook_manual: 0,
  tiktok_manual: 0,
  site_users: 0,
};

// ─── Instagram via Graph API ───────────────────────────────────────────────
async function fetchInstagramFollowers(): Promise<SocialResult> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!token || !userId) {
    return { platform: "instagram", count: 0, source: "manual", error: "No API token configured" };
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/${userId}?fields=followers_count&access_token=${token}`,
      { next: { revalidate: 3600 } } // cache 1hr
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { platform: "instagram", count: data.followers_count ?? 0, source: "api" };
  } catch (e) {
    return { platform: "instagram", count: 0, source: "manual", error: String(e) };
  }
}

// ─── Facebook Page via Graph API ──────────────────────────────────────────
async function fetchFacebookFollowers(): Promise<SocialResult> {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!token || !pageId) {
    return { platform: "facebook", count: 0, source: "manual", error: "No API token configured" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${pageId}?fields=followers_count&access_token=${token}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { platform: "facebook", count: data.followers_count ?? 0, source: "api" };
  } catch (e) {
    return { platform: "facebook", count: 0, source: "manual", error: String(e) };
  }
}

// ─── TikTok via Research API ──────────────────────────────────────────────
async function fetchTikTokFollowers(): Promise<SocialResult> {
  // TikTok Research API requires approved developer account
  // https://developers.tiktok.com/products/research-api/
  const token = process.env.TIKTOK_ACCESS_TOKEN;

  if (!token) {
    return { platform: "tiktok", count: 0, source: "manual", error: "No TikTok API token configured" };
  }

  try {
    const res = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=follower_count`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { platform: "tiktok", count: data.data?.user?.follower_count ?? 0, source: "api" };
  } catch (e) {
    return { platform: "tiktok", count: 0, source: "manual", error: String(e) };
  }
}

// ─── Supabase: manual fallback values + site users count ─────────────────
async function fetchSupabaseData(): Promise<{
  whatsapp: number;
  instagram_manual: number;
  facebook_manual: number;
  tiktok_manual: number;
  site_users: number;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const readKey = serviceKey ?? anonKey;

  if (!supabaseUrl || !readKey) {
    return DEFAULT_COUNTS;
  }

  try {
    // Fetch manual counts from site_settings
    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?key=in.(whatsapp_count_manual,instagram_count_manual,facebook_count_manual,tiktok_count_manual)&select=key,value`,
      {
        headers: {
          apikey: readKey,
          Authorization: `Bearer ${readKey}`,
        },
        cache: "no-store",
      }
    );

    // Count registered users (requires elevated access in many setups).
    const usersRes = serviceKey
      ? await fetch(
          `${supabaseUrl}/rest/v1/users?select=id`,
          {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              Prefer: "count=exact",
              "Range-Unit": "items",
              Range: "0-0",
            },
            cache: "no-store",
          }
        )
      : null;

    const settings: Array<{ key: string; value: string }> = settingsRes.ok
      ? await settingsRes.json()
      : [];

    const getManual = (key: string, fallback: number) => {
      if (!settingsRes.ok || settings.length === 0) return fallback;
      const raw = settings.find((s) => s.key === key)?.value;
      const parsed = parseInt(raw ?? "", 10);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    // Get user count from Content-Range header; keep fallback if unavailable.
    const contentRange = usersRes?.ok ? usersRes.headers.get("Content-Range") : null;
    const siteUsers = contentRange
      ? parseInt(contentRange.split("/")[1] ?? "", 10)
      : DEFAULT_COUNTS.site_users;

    return {
      whatsapp: getManual("whatsapp_count_manual", DEFAULT_COUNTS.whatsapp),
      instagram_manual: getManual("instagram_count_manual", DEFAULT_COUNTS.instagram_manual),
      facebook_manual: getManual("facebook_count_manual", DEFAULT_COUNTS.facebook_manual),
      tiktok_manual: getManual("tiktok_count_manual", DEFAULT_COUNTS.tiktok_manual),
      site_users: Number.isFinite(siteUsers) ? siteUsers : DEFAULT_COUNTS.site_users,
    };
  } catch {
    return DEFAULT_COUNTS;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────
export async function GET() {
  const [igResult, fbResult, ttResult, supabase] = await Promise.all([
    fetchInstagramFollowers(),
    fetchFacebookFollowers(),
    fetchTikTokFollowers(),
    fetchSupabaseData(),
  ]);

  const counts = {
    whatsapp: {
      count: supabase.whatsapp,
      source: "manual" as const,
      note: "WhatsApp has no public API. Update via Admin → Settings.",
    },
    instagram: {
      count: igResult.source === "api" ? igResult.count : supabase.instagram_manual,
      source: igResult.source,
      note: igResult.error ?? null,
    },
    facebook: {
      count: fbResult.source === "api" ? fbResult.count : supabase.facebook_manual,
      source: fbResult.source,
      note: fbResult.error ?? null,
    },
    tiktok: {
      count: ttResult.source === "api" ? ttResult.count : supabase.tiktok_manual,
      source: ttResult.source,
      note: ttResult.error ?? null,
    },
    site_users: {
      count: supabase.site_users,
      source: "database" as const,
    },
    total_community: {
      count:
        (supabase.whatsapp || 0) +
        (igResult.source === "api" ? igResult.count : supabase.instagram_manual) +
        (fbResult.source === "api" ? fbResult.count : supabase.facebook_manual) +
        (ttResult.source === "api" ? ttResult.count : supabase.tiktok_manual) +
        supabase.site_users,
      source: "computed" as const,
    },
  };

  return NextResponse.json(counts, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
