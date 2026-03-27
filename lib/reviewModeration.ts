import { supabase } from "@/lib/supabase";

export const HIDDEN_REVIEW_MARKER = "[HIDDEN_BY_ADMIN]";
const HIDDEN_REVIEW_IDS_KEY = "hidden_review_ids";

export async function getHiddenReviewIdSet(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", HIDDEN_REVIEW_IDS_KEY)
    .maybeSingle();

  if (error) return new Set<string>();

  try {
    const parsed = JSON.parse((data as { value?: string } | null)?.value ?? "[]");
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0));
  } catch {
    return new Set<string>();
  }
}

export function isReviewHiddenByModeration(
  reviewId: string,
  adminReply?: string | null,
  hiddenReviewIds?: Set<string>
): boolean {
  if ((adminReply ?? "") === HIDDEN_REVIEW_MARKER) return true;
  if (!reviewId) return false;
  return hiddenReviewIds?.has(reviewId) ?? false;
}
