import { netOrderRevenue } from "@/lib/returns";

export type OrderAnalyticsRow = {
  id: string;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  status: string;
  user_id?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  return_status?: string | null;
};

export function isCountableSale(status: string) {
  return String(status).toLowerCase() !== "cancelled";
}

export function aggregateDailyFromOrders(orders: OrderAnalyticsRow[]) {
  const byDate = new Map<string, { revenue: number; orders: number }>();

  orders.forEach((o) => {
    if (!isCountableSale(o.status)) return;
    const dateKey = o.created_at.slice(0, 10);
    const cur = byDate.get(dateKey) ?? { revenue: 0, orders: 0 };
    cur.revenue += netOrderRevenue(o.total_amount, o.return_status);
    cur.orders += 1;
    byDate.set(dateKey, cur);
  });

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      day: new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
      date,
      revenue: v.revenue,
      orders: v.orders,
    }));
}

export function aggregateMonthlyFromOrders(orders: OrderAnalyticsRow[]) {
  const monthMap: Record<
    string,
    { sortKey: string; label: string; revenue: number; orders: number; customers: Set<string> }
  > = {};
  const customerOrders = new Map<string, number>();
  const fulfillmentDays: number[] = [];

  orders.forEach((o) => {
    if (!isCountableSale(o.status)) return;
    const d = new Date(o.created_at);
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-PK", { month: "short", year: "2-digit" });
    if (!monthMap[sortKey]) {
      monthMap[sortKey] = { sortKey, label, revenue: 0, orders: 0, customers: new Set() };
    }
    monthMap[sortKey].revenue += netOrderRevenue(o.total_amount, o.return_status);
    monthMap[sortKey].orders += 1;

    const customerKey = (o.user_id || o.customer_email || o.customer_phone || "").trim().toLowerCase();
    if (customerKey) {
      monthMap[sortKey].customers.add(customerKey);
      customerOrders.set(customerKey, (customerOrders.get(customerKey) ?? 0) + 1);
    }

    const createdAt = new Date(o.created_at).getTime();
    const updatedAt = new Date(o.updated_at ?? o.created_at).getTime();
    if (Number.isFinite(createdAt) && Number.isFinite(updatedAt) && updatedAt >= createdAt) {
      fulfillmentDays.push((updatedAt - createdAt) / (1000 * 60 * 60 * 24));
    }
  });

  const unique = customerOrders.size;
  const repeat = Array.from(customerOrders.values()).filter((count) => count >= 2).length;

  const monthly = Object.values(monthMap)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-6)
    .map((v) => ({
      month: v.label,
      revenue: v.revenue,
      orders: v.orders,
      customers: v.customers.size,
    }));

  return {
    monthly,
    uniqueCustomers: unique,
    repeatRate: unique > 0 ? Math.round((repeat / unique) * 100) : 0,
    avgFulfillmentDays: fulfillmentDays.length
      ? Math.round(fulfillmentDays.reduce((sum, days) => sum + days, 0) / fulfillmentDays.length)
      : 0,
  };
}

export function computeSummaryFromOrders(orders: OrderAnalyticsRow[]) {
  const countable = orders.filter((o) => isCountableSale(o.status));
  const totalRevenue = countable.reduce(
    (sum, o) => sum + netOrderRevenue(o.total_amount, o.return_status),
    0,
  );
  const totalOrders = countable.length;
  const agg = aggregateMonthlyFromOrders(orders);
  const totalCustomers = agg.monthly.reduce((sum, m) => sum + m.customers, 0);
  const curMonthRevenue = agg.monthly[agg.monthly.length - 1]?.revenue ?? 0;
  const prevMonthRevenue = agg.monthly[agg.monthly.length - 2]?.revenue ?? 0;
  const revenueGrowth =
    prevMonthRevenue > 0
      ? Math.round(((curMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : 0;

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    revenueGrowth,
    uniqueCustomers: agg.uniqueCustomers,
    repeatRate: agg.repeatRate,
    avgFulfillmentDays: agg.avgFulfillmentDays,
    monthly: agg.monthly,
  };
}

export function aggregateTopProducts(
  items: { product_name: string; quantity: number; unit_price: number }[],
) {
  const productMap: Record<string, { revenue: number; orders: number }> = {};
  items.forEach((i) => {
    if (!productMap[i.product_name]) productMap[i.product_name] = { revenue: 0, orders: 0 };
    productMap[i.product_name].revenue += i.quantity * i.unit_price;
    productMap[i.product_name].orders += i.quantity;
  });
  const sorted = Object.entries(productMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxRev = sorted[0]?.[1]?.revenue || 1;
  return sorted.map(([name, v]) => ({
    name,
    revenue: v.revenue,
    orders: v.orders,
    pct: Math.round((v.revenue / maxRev) * 100),
  }));
}

export function aggregateCategorySales(
  items: { product_id: string | null; quantity: number; unit_price: number }[],
  productCategories: Map<string, string>,
) {
  const catRevenue: Record<string, number> = {};
  items.forEach((i) => {
    const cat = (i.product_id && productCategories.get(i.product_id)) || "Uncategorised";
    catRevenue[cat] = (catRevenue[cat] || 0) + i.quantity * i.unit_price;
  });
  const total = Object.values(catRevenue).reduce((a, b) => a + b, 0);
  if (total <= 0) return [];
  const fills = ["#C8956C", "#F4B8C1", "#C9A0DC", "#E8A0A8", "#D4A890"];
  return Object.entries(catRevenue)
    .sort(([, a], [, b]) => b - a)
    .map(([name, revenue], i) => ({
      name,
      value: Math.round((revenue / total) * 100),
      fill: fills[i % fills.length],
    }));
}

export function aggregateOrderSources(orders: { source?: string | null }[]) {
  const srcCount: Record<string, number> = {};
  orders.forEach((o) => {
    const source = (o.source || "website").toLowerCase();
    srcCount[source] = (srcCount[source] || 0) + 1;
  });
  const srcFills: Record<string, string> = {
    website: "#C8956C",
    whatsapp: "#25D366",
    custom: "#C9A0DC",
  };
  return Object.entries(srcCount).map(([source, count]) => ({
    source,
    count,
    fill: srcFills[source] || "#C8956C",
  }));
}
