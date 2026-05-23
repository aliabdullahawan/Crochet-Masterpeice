import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import {
  aggregateCategorySales,
  aggregateDailyFromOrders,
  aggregateOrderSources,
  aggregateTopProducts,
  computeSummaryFromOrders,
  type OrderAnalyticsRow,
} from "@/lib/analyticsFromOrders";

export async function GET(req: Request) {
  try {
    const service = createServiceClient();
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    let ordersQuery = service
      .from("orders")
      .select(
        "id, total_amount, created_at, updated_at, user_id, customer_email, customer_phone, return_status, status, source",
      )
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (start) ordersQuery = ordersQuery.gte("created_at", start);
    if (end) ordersQuery = ordersQuery.lte("created_at", end);

    const { data: ordersRaw, error: ordersError } = await ordersQuery;
    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const orders = (ordersRaw ?? []) as OrderAnalyticsRow[];
    const summary = computeSummaryFromOrders(orders);
    const daily = aggregateDailyFromOrders(orders).map((r) => ({
      day: r.day,
      revenue: r.revenue,
      orders: r.orders,
    }));

    const orderIds = orders.map((o) => o.id);
    let topProducts: ReturnType<typeof aggregateTopProducts> = [];
    let categoryPie: ReturnType<typeof aggregateCategorySales> = [];

    if (orderIds.length > 0) {
      const { data: topData } = await service
        .from("order_items")
        .select("product_id, product_name, quantity, unit_price")
        .in("order_id", orderIds);

      const items = topData ?? [];
      topProducts = aggregateTopProducts(items);

      const productIds = [
        ...new Set(items.map((i) => i.product_id).filter((id): id is string => Boolean(id))),
      ];
      const productCategories = new Map<string, string>();
      if (productIds.length > 0) {
        const { data: products } = await service
          .from("products")
          .select("id, categories(name)")
          .in("id", productIds);
        (products ?? []).forEach((row) => {
          const p = row as { id: string; categories: { name: string } | { name: string }[] | null };
          const cat = p.categories;
          const name = Array.isArray(cat) ? cat[0]?.name : cat?.name;
          productCategories.set(p.id, name ?? "Uncategorised");
        });
      }
      categoryPie = aggregateCategorySales(items, productCategories);
    }

    let reviewsQuery = service.from("reviews").select("rating, created_at");
    if (start) reviewsQuery = reviewsQuery.gte("created_at", start);
    if (end) reviewsQuery = reviewsQuery.lte("created_at", end);
    const { data: ratingsRaw } = await reviewsQuery;

    let customerSatisfaction = 0;
    if (ratingsRaw?.length) {
      const avg =
        (ratingsRaw as { rating: number }[]).reduce((sum, r) => sum + Number(r.rating || 0), 0) /
        ratingsRaw.length;
      customerSatisfaction = Math.round(avg * 10);
    }

    const orderSources = aggregateOrderSources(
      orders as Array<{ source?: string | null }>,
    );

    return NextResponse.json({
      daily,
      monthly: summary.monthly,
      summary: {
        totalRevenue: summary.totalRevenue,
        totalOrders: summary.totalOrders,
        totalCustomers: summary.totalCustomers,
        avgOrderValue: summary.avgOrderValue,
        revenueGrowth: summary.revenueGrowth,
        uniqueCustomers: summary.uniqueCustomers,
        repeatRate: summary.repeatRate,
        avgFulfillmentDays: summary.avgFulfillmentDays,
        customerSatisfaction,
        curMonthRevenue: summary.monthly[summary.monthly.length - 1]?.revenue ?? 0,
      },
      topProducts,
      categoryPie,
      orderSources,
    });
  } catch (e) {
    console.error("[admin/analytics]", e);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
