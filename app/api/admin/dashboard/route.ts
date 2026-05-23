import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isCountableSale } from "@/lib/analyticsFromOrders";
import { netOrderRevenue } from "@/lib/returns";

export async function GET() {
  try {
    const service = createServiceClient();

    const [
      { count: orderCount },
      { count: productCount },
      { count: userCount },
      { data: revenueData },
      { data: ratingData },
      { count: discountCount },
      { count: customOrderCount },
      { data: ordersData },
      { data: settingsData },
    ] = await Promise.all([
      service.from("orders").select("*", { count: "exact", head: true }).neq("status", "cancelled"),
      service.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
      service.from("users").select("*", { count: "exact", head: true }),
      service.from("orders").select("total_amount, return_status, status"),
      service.from("reviews").select("rating"),
      service.from("discounts").select("*", { count: "exact", head: true }).eq("active", true),
      service.from("custom_orders").select("*", { count: "exact", head: true }),
      service
        .from("orders")
        .select("id, customer_name, total_amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      service
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "instagram_count_manual",
          "facebook_count_manual",
          "tiktok_count_manual",
          "whatsapp_count_manual",
        ]),
    ]);

    const totalRevenue = (revenueData ?? []).reduce(
      (sum: number, r: { total_amount: number; return_status?: string | null; status: string }) => {
        if (!isCountableSale(r.status)) return sum;
        return sum + netOrderRevenue(r.total_amount, r.return_status);
      },
      0,
    );

    const avgRating = ratingData?.length
      ? (ratingData as { rating: number }[]).reduce((s, r) => s + r.rating, 0) / ratingData.length
      : 0;

    const socialCounts = { instagram: 0, facebook: 0, tiktok: 0, whatsapp: 0 };
    if (settingsData) {
      const m = Object.fromEntries(
        settingsData.map((s: { key: string; value: string }) => [
          s.key.replace("_count_manual", ""),
          Number(s.value),
        ]),
      );
      socialCounts.instagram = m.instagram ?? 0;
      socialCounts.facebook = m.facebook ?? 0;
      socialCounts.tiktok = m.tiktok ?? 0;
      socialCounts.whatsapp = m.whatsapp ?? 0;
    }

    return NextResponse.json({
      stats: {
        orders: orderCount ?? 0,
        products: productCount ?? 0,
        users: userCount ?? 0,
        revenue: totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10,
        activeDiscounts: discountCount ?? 0,
        customOrders: customOrderCount ?? 0,
      },
      recentOrders: ordersData ?? [],
      socialCounts,
    });
  } catch (e) {
    console.error("[admin/dashboard]", e);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
