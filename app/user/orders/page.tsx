"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { normalizeOrderStatus } from "@/lib/orderTracking";
import {
  normalizeReturnStatus,
  RETURN_STATUS_LABEL,
  returnStatusBadgeClass,
} from "@/lib/returns";
import LoadingWrapper from "@/components/ui/LoadingWrapper";
import OrdersListSkeleton from "@/components/ui/OrdersListSkeleton";

type UserOrder = {
  id: string;
  displayId: string;
  total: number;
  status: string;
  source: string;
  date: string;
  createdAtMs: number;
  items: string;
  returnStatus: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

export default function UserOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [returnFilter, setReturnFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirect = encodeURIComponent("/user/orders");
      router.replace(`/user/login?redirect=${redirect}`);
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
        setPageLoading(false);
        return;
      }

      const rows = Array.isArray(body?.orders) ? body.orders : [];
      setOrders(
        rows.map(
          (order: {
            id: string;
            total_amount: number;
            status: string;
            source: string;
            created_at: string;
            return_status?: string;
            items: Array<{ product_name: string }>;
          }) => {
            const createdAtMs = new Date(order.created_at).getTime();
            return {
              id: order.id,
              displayId: `#${order.id.slice(0, 6).toUpperCase()}`,
              total: Number(order.total_amount ?? 0),
              status: normalizeOrderStatus(order.status),
              source: order.source,
              date: new Date(createdAtMs).toLocaleDateString("en-PK"),
              createdAtMs,
              items: (order.items ?? []).map((item) => item.product_name).join(", ") || "Order",
              returnStatus: normalizeReturnStatus(order.return_status),
            };
          }
        )
      );
      setPageLoading(false);
    };

    void loadOrders();
    return () => {
      active = false;
    };
  }, [user, loading, router]);

  const filteredOrders = useMemo(() => {
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toMs = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;

    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (typeFilter !== "all" && order.source !== typeFilter) return false;
      if (returnFilter !== "all" && order.returnStatus !== returnFilter) return false;
      if (fromMs !== null && order.createdAtMs < fromMs) return false;
      if (toMs !== null && order.createdAtMs > toMs) return false;
      if (min !== null && Number.isFinite(min) && order.total < min) return false;
      if (max !== null && Number.isFinite(max) && order.total > max) return false;
      return true;
    });
  }, [orders, statusFilter, typeFilter, returnFilter, dateFrom, dateTo, minPrice, maxPrice]);
  
    // Render full page and use LoadingWrapper for the orders list area
  

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold text-ink-dark">My Orders</h1>
          <p className="text-sm text-ink-light/60 font-sans">Track status, delivery progress, cancellations, and details.</p>
        </div>

        <div className="glass rounded-3xl border border-caramel/15 p-4 mb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-caramel/20 bg-white/80 text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-caramel/20 bg-white/80 text-sm">
            <option value="all">All Types</option>
            <option value="website">Regular Orders</option>
            <option value="custom">Custom Orders</option>
            <option value="whatsapp">WhatsApp Orders</option>
          </select>
          <select value={returnFilter} onChange={(e) => setReturnFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-caramel/20 bg-white/80 text-sm">
            <option value="all">All returns</option>
            <option value="none">No return</option>
            <option value="pending">Return pending</option>
            <option value="confirmed">Return confirmed</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-caramel/20 bg-white/80 text-sm" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl border border-caramel/20 bg-white/80 text-sm" />
          <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min PKR" className="px-3 py-2 rounded-xl border border-caramel/20 bg-white/80 text-sm" />
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max PKR" className="px-3 py-2 rounded-xl border border-caramel/20 bg-white/80 text-sm" />
        </div>

        <div className="glass rounded-3xl border border-caramel/15 overflow-hidden">
          <LoadingWrapper loading={loading || pageLoading} skeleton={<OrdersListSkeleton rows={5} />}>
            {filteredOrders.map((order) => (
              <Link key={order.id} href={`/user/orders/${order.id}`} className="flex items-center gap-3 px-5 py-4 border-b border-caramel/10 last:border-0 hover:bg-caramel/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-caramel">{order.displayId}</span>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize", STATUS_COLORS[order.status] ?? "bg-cream-100 text-ink-light/60 border-caramel/20")}>
                      {order.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-caramel/20 text-ink-light/60 capitalize">
                      {order.source}
                    </span>
                    {order.returnStatus !== "none" && (
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", returnStatusBadgeClass(order.returnStatus as "pending" | "confirmed"))}>
                        {RETURN_STATUS_LABEL[order.returnStatus as keyof typeof RETURN_STATUS_LABEL]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-dark truncate">{order.items}</p>
                  <p className="text-[10px] text-ink-light/45">{order.date}</p>
                </div>
                <div className="text-sm font-bold text-ink-dark">PKR {order.total.toLocaleString()}</div>
              </Link>
            ))}

            {filteredOrders.length === 0 && (
              <div className="py-16 text-center text-sm text-ink-light/60">
                No orders found for the selected filters.
              </div>
            )}
          </LoadingWrapper>
        </div>
      </main>
      <Footer />
    </div>
  );
}

