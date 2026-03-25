"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Package, ShoppingBag, Trash2 } from "lucide-react";

interface UserOrder {
  id: string;
  displayId: string;
  items: string;
  total: number;
  status: string;
  date: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

export default function UserOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.href = "/user/login";
      return;
    }

    let active = true;

    const loadOrders = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        if (active) setPageLoading(false);
        return;
      }

      const res = await fetch("/api/user/orders", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));

      if (!active) return;

      if (!res.ok) {
        console.error(body?.error || "Failed to load orders");
        setPageLoading(false);
        return;
      }

      const rows = Array.isArray(body?.orders) ? body.orders : [];
      setOrders(rows.map((o: {
        id: string;
        total_amount: number;
        status: string;
        created_at: string;
        items: Array<{ product_name: string }>;
      }) => ({
        id: o.id,
        displayId: `#${o.id.slice(0, 6).toUpperCase()}`,
        items: (o.items ?? []).map((i) => i.product_name).join(", ") || "Order",
        total: o.total_amount,
        status: o.status,
        date: new Date(o.created_at).toISOString().split("T")[0],
      })));
      setPageLoading(false);
    };

    loadOrders();
    const timer = setInterval(loadOrders, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadOrders();
    };
    window.addEventListener("focus", loadOrders);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", loadOrders);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, loading]);

  const deleteOrderNotification = async (orderId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    setDeletingId(orderId);
    try {
      const res = await fetch(`/api/user/orders?id=${encodeURIComponent(orderId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(body?.error || "Could not delete order notification.");
        return;
      }
      alert("Order notification deleted.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blush/35 to-mauve/25 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-ink-dark">My Orders</h1>
          <p className="text-sm text-ink-light/55 font-sans mt-0.5">
            All your orders and live status updates
          </p>
        </div>

        <div className="glass rounded-3xl border border-blush/20 overflow-hidden">
          <div className="divide-y divide-blush/10">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 px-6 py-4 hover:bg-caramel/4 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blush/30 to-mauve/20 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-caramel" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-sans font-bold text-caramel">{order.displayId}</span>
                    <span className={cn("text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border capitalize", STATUS_COLORS[order.status] ?? "bg-cream-100 text-ink-light/70 border-caramel/20")}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm font-sans font-semibold text-ink-dark truncate">{order.items}</p>
                  <p className="text-[10px] text-ink-light/45 font-sans">{order.date}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold font-sans text-ink-dark">
                    PKR {order.total.toLocaleString()}
                  </span>
                  <button
                    onClick={() => deleteOrderNotification(order.id)}
                    disabled={deletingId === order.id}
                    className="p-2 rounded-xl border border-caramel/20 text-ink-light/50 hover:text-rose hover:border-rose/35 hover:bg-rose/8 transition-all disabled:opacity-60"
                    title="Delete order notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-3 text-center">
                <Package className="w-8 h-8 text-caramel/30" />
                <p className="font-display text-base text-ink-dark">No orders yet</p>
                <Link href="/user/shop" className="text-sm text-caramel font-sans font-semibold hover:text-ink transition-colors">
                  Browse our shop →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
