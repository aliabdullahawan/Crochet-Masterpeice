import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/siteUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/user/home`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/user/shop`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${siteUrl}/user/custom-order`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteUrl}/user/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/user/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/user/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("products")
      .select("id, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(500);

    productPages = (data ?? []).map((row: { id: string; updated_at?: string }) => ({
      url: `${siteUrl}/user/shop/${row.id}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Sitemap still works with static routes if DB is unavailable at build time.
  }

  return [...staticPages, ...productPages];
}
