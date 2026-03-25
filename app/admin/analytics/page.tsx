"use client";

import { supabase } from "@/lib/supabase";
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  TrendingUp, TrendingDown, ShoppingBag, Users, Star,
  Package, Target, Repeat, Clock, Award,
} from "lucide-react";
import {
  ComposedChart, Line, Area, AreaChart, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, PieChart, Pie, Cell, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

function useAdminAuth() {
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in"))
      window.location.href = "/admin/login";
  }, []);
}

/* =============================================
   DATA
   ============================================= */
// Data loaded from Supabase analytics_daily view + aggregations
// These will be populated by loadAnalyticsData() below
const EMPTY_MONTHLY: {month:string;revenue:number;orders:number;customers:number}[] = [];
const EMPTY_DAILY:   {day:string;revenue:number;orders:number}[] = [];
const EMPTY_TOP:     {name:string;revenue:number;orders:number;pct:number}[] = [];
const EMPTY_CAT_PIE: {name:string;value:number;fill:string}[] = [];
const EMPTY_SOURCES: {source:string;count:number;fill:string}[] = [];

/* =============================================
   CUSTOM TOOLTIP
   ============================================= */
const RevenueTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-caramel/20 rounded-2xl px-3 py-2 shadow-card text-xs font-sans">
      <p className="text-ink-light/60 mb-1">Day {label}</p>
      <p className="font-bold text-caramel">PKR {payload[0].value.toLocaleString()}</p>
      {payload[1] && <p className="text-ink/60">{payload[1].value} orders</p>}
    </div>
  );
};

const MonthTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-caramel/20 rounded-2xl px-3 py-2 shadow-card text-xs font-sans min-w-[140px]">
      <p className="text-ink-light/60 font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex justify-between gap-4">
          <span className="text-ink/60 capitalize">{p.name}</span>
          <span className="font-bold text-ink-dark">{p.name === "revenue" ? `PKR ${p.value.toLocaleString()}` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* =============================================
   ANIMATED COUNTER
   ============================================= */
const AnimCount = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const dur = 1400;
    const start = Date.now();
    const step = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.floor(e * value));
      if (p < 1) requestAnimationFrame(step);
      else setV(value);
    };
    requestAnimationFrame(step);
  }, [inView, value]);
  return <span ref={ref}>{prefix}{v.toLocaleString()}{suffix}</span>;
};

/* =============================================
   STAT CARD
   ============================================= */
const Stat = ({ icon, label, value, prefix, suffix, change, positive, sub, delay }: {
  icon: React.ReactNode; label: string; value: number;
  prefix?: string; suffix?: string; change?: string; positive?: boolean; sub?: string; delay: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }}
      className="glass rounded-3xl border border-caramel/15 p-5 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-2xl bg-caramel/12 flex items-center justify-center text-caramel">{icon}</div>
        {change && (
          <span className={cn("flex items-center gap-1 text-[11px] font-sans font-bold px-2 py-1 rounded-xl",
            positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400")}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {change}
          </span>
        )}
      </div>
      <p className="font-display text-2xl font-semibold text-ink-dark">
        <AnimCount value={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="text-xs text-ink-light/55 font-sans mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-ink-light/40 font-sans mt-1">{sub}</p>}
    </motion.div>
  );
};

/* =============================================
   ANALYTICS PAGE
   ============================================= */
/* ── Top Product Row (extracted to avoid hooks-in-map error) ── */
const TopProductRow = ({ product, index }: {
  product: { name: string; revenue: number; orders: number; pct: number };
  index: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref}>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-lg bg-caramel/15 flex items-center justify-center text-[10px] font-sans font-bold text-caramel flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-xs font-sans font-semibold text-ink-dark truncate">{product.name}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs font-bold font-sans text-caramel">PKR {(product.revenue / 1000).toFixed(0)}K</span>
          <span className="text-[10px] text-ink-light/40 font-sans ml-1.5">({product.orders})</span>
        </div>
      </div>
      <div className="h-1.5 bg-blush/15 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-caramel to-blush"
          initial={{ width: 0 }}
          animate={inView ? { width: `${product.pct}%` } : {}}
          transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
};

export default function AdminAnalyticsPage() {
  useAdminAuth();
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState(EMPTY_MONTHLY);
  const [daily, setDaily] = useState(EMPTY_DAILY);
  const [topProducts, setTopProducts] = useState(EMPTY_TOP);
  const [categoryPie, setCategoryPie] = useState(EMPTY_CAT_PIE);
  const [orderSources, setOrderSources] = useState(EMPTY_SOURCES);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);
  const [repeatRate, setRepeatRate] = useState(0);
  const [avgFulfillmentDays, setAvgFulfillmentDays] = useState(0);
  const [customerSatisfaction, setCustomerSatisfaction] = useState(0);

  useEffect(() => { loadAnalyticsData(); }, []);

  const loadAnalyticsData = async () => {
    try {
      // Fetch daily analytics from view
      const { data: dailyRaw } = await supabase
        .from("analytics_daily")
        .select("date, order_count, revenue")
        .order("date", { ascending: true })
        .limit(30);

      if (dailyRaw?.length) {
        setDaily(dailyRaw.map((r:{date:string;order_count:number;revenue:number}, i:number) => ({
          day: String(i + 1),
          revenue: Number(r.revenue) || 0,
          orders: r.order_count || 0,
        })));
      }

      // Aggregate monthly from orders
      const { data: ordersRaw } = await supabase
        .from("orders")
        .select("total_amount, created_at, updated_at, user_id, customer_email, customer_phone")
        .eq("status", "delivered")
        .gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

      if (ordersRaw?.length) {
        const monthMap: Record<string, {revenue:number;orders:number;customers:Set<string>}> = {};
        const customerOrders = new Map<string, number>();
        const fulfillmentDays: number[] = [];
        const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        ordersRaw.forEach((o:{total_amount:number;created_at:string;updated_at:string;user_id:string|null;customer_email:string|null;customer_phone:string|null}) => {
          const d = new Date(o.created_at);
          const key = MONTHS[d.getMonth()];
          if (!monthMap[key]) monthMap[key] = { revenue: 0, orders: 0, customers: new Set() };
          monthMap[key].revenue += o.total_amount;
          monthMap[key].orders += 1;

          const customerKey = (o.user_id || o.customer_email || o.customer_phone || "").trim().toLowerCase();
          if (customerKey) {
            monthMap[key].customers.add(customerKey);
            customerOrders.set(customerKey, (customerOrders.get(customerKey) ?? 0) + 1);
          }

          const createdAt = new Date(o.created_at).getTime();
          const updatedAt = new Date(o.updated_at).getTime();
          if (Number.isFinite(createdAt) && Number.isFinite(updatedAt) && updatedAt >= createdAt) {
            fulfillmentDays.push((updatedAt - createdAt) / (1000 * 60 * 60 * 24));
          }
        });

        const unique = customerOrders.size;
        const repeat = Array.from(customerOrders.values()).filter((count) => count >= 2).length;
        setUniqueCustomers(unique);
        setRepeatRate(unique > 0 ? Math.round((repeat / unique) * 100) : 0);

        const fulfillmentAvg = fulfillmentDays.length
          ? Math.round(fulfillmentDays.reduce((sum, days) => sum + days, 0) / fulfillmentDays.length)
          : 0;
        setAvgFulfillmentDays(fulfillmentAvg);

        setMonthly(Object.entries(monthMap).slice(-6).map(([month, v]) => ({
          month, revenue: v.revenue, orders: v.orders, customers: v.customers.size,
        })));
      } else {
        setUniqueCustomers(0);
        setRepeatRate(0);
        setAvgFulfillmentDays(0);
      }

      const { data: ratingsRaw } = await supabase
        .from("reviews")
        .select("rating");
      if (ratingsRaw?.length) {
        const avg = (ratingsRaw as { rating: number }[]).reduce((sum, r) => sum + Number(r.rating || 0), 0) / ratingsRaw.length;
        setCustomerSatisfaction(Math.round(avg * 10));
      } else {
        setCustomerSatisfaction(0);
      }

      // Top products by revenue
      const { data: topRaw } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price, order:orders!inner(status)")
        .eq("orders.status", "delivered");
      if (topRaw?.length) {
        const productMap: Record<string, {revenue:number;orders:number}> = {};
        topRaw.forEach((i:{product_name:string;quantity:number;unit_price:number}) => {
          if (!productMap[i.product_name]) productMap[i.product_name] = { revenue: 0, orders: 0 };
          productMap[i.product_name].revenue += i.quantity * i.unit_price;
          productMap[i.product_name].orders += i.quantity;
        });
        const sorted = Object.entries(productMap).sort(([,a],[,b]) => b.revenue - a.revenue).slice(0,5);
        const maxRev = sorted[0]?.[1]?.revenue || 1;
        setTopProducts(sorted.map(([name, v]) => ({ name, revenue: v.revenue, orders: v.orders, pct: Math.round((v.revenue/maxRev)*100) })));
      }

      // Category split
      const { data: catRaw } = await supabase
        .from("products")
        .select("category_id, categories(name)");
      if (catRaw?.length) {
        const catCount: Record<string, number> = {};
        catRaw.forEach((p:{categories:{name:string}|null}) => {
          const name = p.categories?.name ?? "Uncategorised";
          catCount[name] = (catCount[name] || 0) + 1;
        });
        const fills = ["#C8956C","#F4B8C1","#C9A0DC","#E8A0A8","#D4A890"];
        const total = Object.values(catCount).reduce((a,b) => a+b, 0);
        setCategoryPie(Object.entries(catCount).map(([name, count], i) => ({
          name, value: Math.round((count/total)*100), fill: fills[i % fills.length],
        })));
      }

      // Order sources
      const { data: srcRaw } = await supabase
        .from("orders")
        .select("source");
      if (srcRaw?.length) {
        const srcCount: Record<string, number> = {};
        srcRaw.forEach((o:{source:string}) => { srcCount[o.source] = (srcCount[o.source]||0)+1; });
        const srcFills: Record<string,string> = { website:"#C8956C", whatsapp:"#25D366", custom:"#C9A0DC" };
        setOrderSources(Object.entries(srcCount).map(([source, count]) => ({ source, count, fill: srcFills[source]||"#C8956C" })));
      }

    } catch(e) { console.error("Analytics load error:", e); }
    finally { setLoading(false); }
  };

  // Key metrics derived from loaded data
  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = monthly.reduce((s, m) => s + m.orders, 0);
  const totalCustomers = monthly.reduce((s, m) => s + m.customers, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const curMonthRevenue = monthly[monthly.length - 1]?.revenue ?? 0;
  const prevMonthRevenue = monthly[monthly.length - 2]?.revenue ?? 0;
  const revenueGrowth = prevMonthRevenue > 0 ? Math.round(((curMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : 0;

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-dark">Analytics</h1>
            <p className="text-sm text-ink-light/55 font-sans mt-0.5">Last 6 months · Live from Supabase (delivered orders)</p>
          </div>
          <div className="flex items-center border border-caramel/20 rounded-2xl overflow-hidden bg-white/80">
            {(["daily", "monthly"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn("px-4 py-2 text-xs font-sans font-semibold capitalize transition-all",
                  period === p ? "bg-caramel/15 text-caramel" : "text-ink-light/60 hover:bg-caramel/8")}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={<ShoppingBag className="w-5 h-5" />} label="Total Revenue" value={totalRevenue} prefix="PKR " change={`${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth}%`} positive={revenueGrowth >= 0} delay={0} sub="vs previous month" />
          <Stat icon={<Package className="w-5 h-5" />}    label="Total Orders"   value={totalOrders}   delay={0.07} sub="6-month total" />
          <Stat icon={<Users className="w-5 h-5" />}      label="New Customers"  value={uniqueCustomers} delay={0.14} sub="Unique buyers" />
          <Stat icon={<Target className="w-5 h-5" />}     label="Avg Order Value" value={avgOrderValue} prefix="PKR " delay={0.21} sub="Per transaction" />
        </div>

        {/* Growth KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={<TrendingUp className="w-5 h-5" />}  label="Month-over-Month Growth" value={revenueGrowth}  suffix="%" positive={revenueGrowth >= 0} delay={0} sub="Revenue growth" />
          <Stat icon={<Repeat className="w-5 h-5" />}      label="Repeat Customer Rate"    value={repeatRate}  suffix="%" positive delay={0.07} sub="Ordered 2+ times" />
          <Stat icon={<Clock className="w-5 h-5" />}       label="Avg Fulfilment Days"      value={avgFulfillmentDays}   delay={0.14} sub="Order to delivery" />
          <Stat icon={<Award className="w-5 h-5" />}       label="Customer Satisfaction"   value={customerSatisfaction}  suffix="/50" positive delay={0.21} sub="Average rating ×10" />
        </div>

        {/* Revenue line chart (Recharts) */}
        <div className="glass rounded-3xl border border-caramel/15 p-6">
          <div className="flex items-end justify-between mb-2 flex-wrap gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-dark">Revenue Trend</h2>
              <p className="text-xs text-ink-light/50 font-sans">
                {period === "daily" ? "Daily revenue — last 30 days" : "Monthly revenue — last 6 months"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-semibold text-caramel">PKR {curMonthRevenue.toLocaleString()}</p>
              <p className="text-[11px] text-green-600 font-sans font-semibold flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" />+{revenueGrowth}% this month
              </p>
            </div>
          </div>
          {/* Stats bar */}
          <div className="flex flex-wrap gap-6 text-xs font-sans text-ink-light/60 mb-5 border-b border-caramel/10 pb-4">
            <span>High: <span className="text-caramel font-bold">PKR {(Math.max(...((period === "daily" ? daily : monthly).map(d => d.revenue).concat([0]))) || 0).toLocaleString()}</span></span>
            <span>Low: <span className="text-rose font-bold">PKR {(Math.min(...((period === "daily" ? daily : monthly).map(d => d.revenue).concat([0]))) || 0).toLocaleString()}</span></span>
            <span>Avg: <span className="text-ink font-bold">PKR {(period === "daily" ? daily : monthly).length > 0 ? Math.round((period === "daily" ? daily : monthly).reduce((s, d) => s + d.revenue, 0) / (period === "daily" ? daily : monthly).length).toLocaleString() : "0"}</span></span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={period === "daily" ? daily : monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C8956C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C8956C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 8" stroke="rgba(200,149,108,0.1)" vertical={false} />
              <XAxis dataKey={period === "daily" ? "day" : "month"}
                axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: "#9B8B8B" }}
                tickMargin={10}
                interval={period === "daily" ? 4 : 0}
              />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: "#9B8B8B" }}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                tickMargin={10}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "rgba(200,149,108,0.2)", strokeWidth: 1 }} />
              {period === "daily" && <ReferenceLine x="9" stroke="#C8956C" strokeDasharray="4 4" strokeOpacity={0.5} />}
              <Area type="monotone" dataKey="revenue" stroke="none" fill="url(#revenueGrad)" />
              <Line type="monotone" dataKey="revenue" stroke="#C8956C" strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#C8956C", stroke: "white", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly overview + Pie */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly bar chart */}
          <div className="glass rounded-3xl border border-caramel/15 p-6">
            <h2 className="font-display text-base font-semibold text-ink-dark mb-1">Monthly Overview</h2>
            <p className="text-xs text-ink-light/50 font-sans mb-5">Revenue + orders + new customers</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} barGap={4}>
                <CartesianGrid strokeDasharray="4 8" stroke="rgba(200,149,108,0.1)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9B8B8B" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9B8B8B" }}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip content={<MonthTooltip />} cursor={{ fill: "rgba(200,149,108,0.06)" }} />
                <Bar dataKey="revenue" fill="#C8956C" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="orders"  fill="#F4B8C1" radius={[6, 6, 0, 0]} maxBarSize={20} />
                <Bar dataKey="customers" fill="#C9A0DC" radius={[6, 6, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-5 mt-3 text-[11px] font-sans">
              {[["#C8956C","Revenue"],["#F4B8C1","Orders"],["#C9A0DC","Customers"]].map(([c,l]) => (
                <span key={l} className="flex items-center gap-1.5 text-ink-light/60">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: c}} />{l}
                </span>
              ))}
            </div>
          </div>

          {/* Category + Order source pie */}
          <div className="glass rounded-3xl border border-caramel/15 p-6">
            <h2 className="font-display text-base font-semibold text-ink-dark mb-1">Sales by Category</h2>
            <p className="text-xs text-ink-light/50 font-sans mb-4">Revenue distribution</p>
            <div className="flex items-center justify-between gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={categoryPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    paddingAngle={3} dataKey="value">
                    {categoryPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`, "Share"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryPie.map((seg) => (
                  <div key={seg.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.fill }} />
                    <span className="text-[11px] font-sans text-ink/70 flex-1 truncate">{seg.name}</span>
                    <span className="text-[11px] font-sans font-bold text-ink-dark">{seg.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order sources + Top products */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order sources bar */}
          <div className="glass rounded-3xl border border-caramel/15 p-6">
            <h2 className="font-display text-base font-semibold text-ink-dark mb-1">Order Sources</h2>
            <p className="text-xs text-ink-light/50 font-sans mb-5">Where orders come from</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={orderSources} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9B8B8B" }} />
                <YAxis type="category" dataKey="source" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B5B5B" }} width={70} />
                <Tooltip cursor={{ fill: "rgba(200,149,108,0.06)" }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={28}>
                  {orderSources.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top products */}
          <div className="glass rounded-3xl border border-caramel/15 p-6">
            <h2 className="font-display text-base font-semibold text-ink-dark mb-5">Top Products</h2>
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <TopProductRow key={p.name} product={p} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Area chart for customers */}
        <div className="glass rounded-3xl border border-caramel/15 p-6">
          <h2 className="font-display text-base font-semibold text-ink-dark mb-1">Customer Acquisition</h2>
          <p className="text-xs text-ink-light/50 font-sans mb-5">New customers per month vs retention</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C9A0DC" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#C9A0DC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 8" stroke="rgba(200,149,108,0.1)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9B8B8B" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9B8B8B" }} />
              <Tooltip formatter={(v: number, n: string) => [v, n === "customers" ? "New Customers" : n]} cursor={{ stroke: "rgba(200,149,108,0.2)" }} />
              <Area type="monotone" dataKey="customers" stroke="#C9A0DC" strokeWidth={2} fill="url(#custGrad)"
                activeDot={{ r: 5, fill: "#C9A0DC", stroke: "white", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </main>
    </div>
  );
}
