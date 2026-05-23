"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import {
  ShoppingBag, Package, Users, Star, TrendingUp,
  Tag, Plus, ArrowRight, Clock, Check, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabase";

function useAdminAuth() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in")) {
      router.replace("/admin/login");
    }
  }, [router]);
}

/* ── Animated counter ── */
const AnimCount = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const dur = 1200;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.floor(e * value));
      if (p < 1) requestAnimationFrame(tick); else setV(value);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);
  return <span ref={ref}>{prefix}{v.toLocaleString()}{suffix}</span>;
};

/* ── Stat card ── */
const StatCard = ({ icon, label, value, prefix = "", suffix = "", change, positive, bg, delay }:{
  icon: React.ReactNode; label: string; value: number;
  prefix?: string; suffix?: string; change?: string;
  positive?: boolean; bg: string; delay: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className={cn("rounded-3xl border p-5 hover:shadow-card transition-all duration-300 hover:-translate-y-1 group glass", bg)}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-2xl bg-white/60 flex items-center justify-center">{icon}</div>
        {change && (
          <span className={cn("flex items-center gap-1 text-[11px] font-sans font-bold px-2 py-1 rounded-xl",
            positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400")}>
            <TrendingUp className="w-3 h-3" /> {change}
          </span>
        )}
      </div>
      <p className="font-display text-2xl font-semibold text-ink-dark">
        <AnimCount value={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="text-xs text-ink-light/55 font-sans mt-0.5">{label}</p>
    </motion.div>
  );
};

const ORDER_STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   color: "bg-amber-50 text-amber-600 border-amber-200",  icon: <Clock className="w-3 h-3" /> },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-600 border-blue-200",    icon: <Check className="w-3 h-3" /> },
  shipped:   { label: "Shipped",   color: "bg-purple-50 text-purple-600 border-purple-200", icon: <Truck className="w-3 h-3" /> },
  delivered: { label: "Delivered", color: "bg-green-50 text-green-600 border-green-200", icon: <Check className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-400 border-red-200",        icon: <></> },
};

/* ── Dashboard page ── */
export default function AdminDashboardPage() {
  useAdminAuth();

  const [stats, setStats] = useState({
    orders: 0, products: 0, users: 0, revenue: 0,
    avgRating: 0, activeDiscounts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<{
    id: string; customer_name: string; total_amount: number;
    status: string; created_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [socialCounts, setSocialCounts] = useState({ instagram: 0, facebook: 0, tiktok: 0, whatsapp: 0 });

  const [adminName, setAdminName] = useState("Admin");
  useEffect(() => {
    setAdminName(localStorage.getItem("cm_admin_name") ?? "Admin");
  }, []);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      // Parallel fetches
      const [
        { count: orderCount },
        { count: productCount },
        { count: userCount },
        { data: revenueData },
        { data: ratingData },
        { count: discountCount },
        { data: ordersData },
        { data: settingsData },
      ] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }).neq("status", "cancelled"),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_amount").eq("status", "delivered"),
        supabase.from("reviews").select("rating"),
        supabase.from("discounts").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("orders").select("id, customer_name, total_amount, status, created_at")
          .order("created_at", { ascending: false }).limit(6),
        supabase.from("site_settings").select("key, value")
          .in("key", ["instagram_count_manual","facebook_count_manual","tiktok_count_manual","whatsapp_count_manual"]),
      ]);

      const totalRevenue = (revenueData ?? []).reduce((s: number, r: { total_amount: number }) => s + r.total_amount, 0);
      const avgRating = ratingData?.length
        ? (ratingData as { rating: number }[]).reduce((s, r) => s + r.rating, 0) / ratingData.length
        : 0;

      setStats({
        orders: orderCount ?? 0,
        products: productCount ?? 0,
        users: userCount ?? 0,
        revenue: totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10,
        activeDiscounts: discountCount ?? 0,
      });

      setRecentOrders((ordersData ?? []) as typeof recentOrders);

      if (settingsData) {
        const m = Object.fromEntries(settingsData.map((s: {key:string;value:string}) => [s.key.replace("_count_manual",""), Number(s.value)]));
        setSocialCounts({ instagram: m.instagram ?? 0, facebook: m.facebook ?? 0, tiktok: m.tiktok ?? 0, whatsapp: m.whatsapp ?? 0 });
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const totalCommunity = Object.values(socialCounts).reduce((a, b) => a + b, 0) + stats.users;

  const highlightChips = [
    { label: "Orders", value: stats.orders.toLocaleString(), tone: "bg-white/80 border-caramel/20 text-ink" },
    { label: "Revenue", value: `PKR ${stats.revenue.toLocaleString()}`, tone: "bg-green-50/80 border-green-200/60 text-green-700" },
    { label: "Live Discounts", value: stats.activeDiscounts.toLocaleString(), tone: "bg-blush/20 border-blush/30 text-caramel" },
  ];

  const quickActions = [
    { href: "/admin/products",   icon: <Package className="w-4 h-4" />,     label: "Manage Products", desc: "Stock, images, featured" },
    { href: "/admin/orders",     icon: <ShoppingBag className="w-4 h-4" />, label: "View Orders", desc: "Update status fast" },
    { href: "/admin/discounts",  icon: <Tag className="w-4 h-4" />,         label: "Create Discount", desc: "Promo or cart offers" },
    { href: "/admin/analytics",  icon: <TrendingUp className="w-4 h-4" />,  label: "View Analytics", desc: "Revenue + trends" },
  ];

  const statCards = [
    { icon: <ShoppingBag className="w-5 h-5 text-caramel" />,   label: "Total Orders",     value: stats.orders,          bg: "admin-card-caramel", delay: 0 },
    { icon: <Package className="w-5 h-5 text-caramel/70" />,    label: "Active Products",  value: stats.products,        bg: "admin-card-blush",   delay: 0.07 },
    { icon: <Users className="w-5 h-5 text-mauve" />,           label: "Registered Users", value: stats.users,           bg: "admin-card-mauve",   delay: 0.14 },
    { icon: <Star className="w-5 h-5 text-amber-500" />,        label: "Avg Rating",       value: stats.avgRating * 10, suffix: "/50", bg: "admin-card-rose", delay: 0.21 },
    { icon: <TrendingUp className="w-5 h-5 text-green-500" />,  label: "Total Revenue",    value: stats.revenue, prefix: "PKR ", bg: "bg-green-50/80 border border-green-200/60", delay: 0.28 },
    { icon: <Tag className="w-5 h-5 text-caramel" />,           label: "Active Discounts", value: stats.activeDiscounts, bg: "admin-card-blush",   delay: 0.35 },
  ];

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-caramel/15 bg-linear-to-br from-cream-50 via-blush/10 to-mauve/10 p-6">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-caramel/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-mauve/10 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <p className="text-[11px] font-sans font-semibold text-ink-light/60 uppercase tracking-widest mb-2">
                Admin Overview
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink-dark">
                Welcome back, {adminName.split(" ")[0]}
              </h1>
              <p className="text-sm text-ink-light/60 font-sans mt-1">
                {loading ? "Loading your dashboard…" : "Track orders, revenue, and what to focus on next."}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {highlightChips.map((chip) => (
                  <div key={chip.label} className={cn("px-3 py-1.5 rounded-full border text-xs font-sans font-semibold", chip.tone)}>
                    {chip.label}: {chip.value}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/products"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-linear-to-r from-caramel to-rose text-white text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble">
                <Plus className="w-4 h-4" /> Add Product
              </Link>
              <Link href="/admin/discounts"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-caramel/20 bg-white/80 text-caramel text-sm font-sans font-bold hover:bg-caramel/10 transition-all btn-bubble">
                <Tag className="w-4 h-4" /> New Discount
              </Link>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Community reach */}
        <div className="glass rounded-3xl border border-caramel/15 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-ink-dark">Community Reach</h2>
            <span className="font-display text-xl font-semibold text-caramel">{totalCommunity.toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-sans text-ink-light/60">
            {[
              ["Instagram", socialCounts.instagram],
              ["Facebook",  socialCounts.facebook],
              ["TikTok",    socialCounts.tiktok],
              ["WhatsApp",  socialCounts.whatsapp],
              ["Site Users",stats.users],
            ].map(([label, count]) => (
              <span key={label as string} className="flex items-center gap-1.5">
                <span className="font-bold text-ink-dark">{(count as number).toLocaleString()}</span> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Quick actions + Recent orders */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="glass rounded-3xl border border-caramel/15 p-5">
            <h2 className="font-display text-base font-semibold text-ink-dark mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <Link key={a.href} href={a.href}
                  className="group rounded-2xl border border-caramel/15 bg-white/70 p-3 hover:bg-caramel/10 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-caramel/10 text-caramel flex items-center justify-center group-hover:bg-caramel/20 transition-colors">
                      {a.icon}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-light/30 ml-auto group-hover:text-caramel group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm font-sans font-semibold text-ink-dark mt-2">{a.label}</p>
                  <p className="text-[10px] text-ink-light/50 font-sans">{a.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="lg:col-span-2 glass rounded-3xl border border-caramel/15 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-caramel/10">
              <h2 className="font-display text-base font-semibold text-ink-dark">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs text-caramel font-sans font-semibold hover:text-ink transition-colors">
                View all →
              </Link>
            </div>
            {loading ? (
              <div className="p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-caramel/6 last:border-0">
                    <Skeleton className="w-8 h-8 rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-2/3 mb-1" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <ShoppingBag className="w-8 h-8 text-caramel/25" />
                <p className="text-sm font-sans text-ink-light/50">No orders yet</p>
                <p className="text-xs text-ink-light/35 font-sans">Orders placed via the site will appear here</p>
              </div>
            ) : (
              <div>
                {recentOrders.map((order) => {
                  const sc = ORDER_STATUS_CFG[order.status] ?? ORDER_STATUS_CFG.pending;
                  return (
                    <div key={order.id}
                      className="flex items-center gap-4 px-5 py-3.5 border-b border-caramel/6 last:border-0 hover:bg-caramel/4 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blush/30 to-mauve/20 flex items-center justify-center shrink-0">
                        <span className="font-display text-sm font-semibold text-caramel/80">
                          {order.customer_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans font-semibold text-ink-dark truncate">{order.customer_name}</p>
                        <p className="text-[11px] text-ink-light/45 font-sans">
                          {new Date(order.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border flex items-center gap-1", sc.color)}>
                          {sc.icon} {sc.label}
                        </span>
                        <span className="text-sm font-bold font-sans text-ink-dark">
                          PKR {order.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
