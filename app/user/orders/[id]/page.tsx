"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { canCustomerCancel, normalizeOrderStatus, ORDER_FLOW, ORDER_STATUS_LABEL } from "@/lib/orderTracking";
import {
  normalizeReturnStatus,
  RETURN_STATUS_LABEL,
  returnStatusBadgeClass,
} from "@/lib/returns";
import { cn } from "@/lib/utils";

type OrderItem = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
};

type OrderDetail = {
  id: string;
  displayId: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  note: string;
  address: string;
  items: OrderItem[];
  history: Array<{ to_status: string; changed_at: string | null }>;
  return_status?: string;
};

const fmtPk = (value: string | null | undefined) => {
  if (!value) return "--";
  return new Date(value).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Karachi",
  });
};

export default function UserOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirect = encodeURIComponent(`/user/orders/${params.id}`);
      router.replace(`/user/login?redirect=${redirect}`);
      return;
    }
    let active = true;
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        if (active) setPageLoading(false);
        return;
      }
      const res = await fetch(`/api/user/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!active) return;
      if (!res.ok) {
        setError(typeof body?.error === "string" ? body.error : "Could not load order.");
        setPageLoading(false);
        return;
      }
      setOrder(body.order as OrderDetail);
      setPageLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [user, loading, params.id, router]);

  const timeline = useMemo(() => {
    const map = new Map<string, string>();
    if (!order) return map;
    order.history.forEach((entry) => {
      const key = normalizeOrderStatus(entry.to_status);
      if (!map.has(key) && entry.changed_at) map.set(key, entry.changed_at);
    });
    if (!map.has("pending")) map.set("pending", order.created_at);
    return map;
  }, [order]);

  const normalizedStatus = normalizeOrderStatus(order?.status);
  const activeIndex = normalizedStatus === "cancelled" ? -1 : ORDER_FLOW.indexOf(normalizedStatus);

  const cancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    setError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch(`/api/user/orders/${order.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token ?? ""}`,
      },
      body: JSON.stringify({ action: "cancel", reason: cancelReason.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof body?.error === "string" ? body.error : "Could not cancel order.");
      setCancelling(false);
      return;
    }
    setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    setCancelling(false);
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-3">
          <div className="h-20 rounded-2xl bg-gradient-to-r from-blush/10 to-caramel/5 animate-pulse" />
          <div className="h-56 rounded-2xl bg-gradient-to-r from-blush/10 to-caramel/5 animate-pulse" />
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
          <div className="glass rounded-3xl border border-caramel/20 p-6 text-red-500">{error || "Order not found."}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold text-ink-dark">Order {order.displayId}</h1>
          <p className="text-sm text-ink-light/60 font-sans">Track your live status and timeline.</p>
          {normalizeReturnStatus(order.return_status) !== "none" && (
            <span
              className={cn(
                "inline-flex mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border",
                returnStatusBadgeClass(normalizeReturnStatus(order.return_status))
              )}
            >
              {RETURN_STATUS_LABEL[normalizeReturnStatus(order.return_status)]}
            </span>
          )}
        </div>

        <div className="glass rounded-3xl border border-caramel/20 p-5 mb-4">
          {normalizedStatus === "cancelled" ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-600 px-4 py-3 text-sm font-semibold">
              Order Cancelled
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
            {ORDER_FLOW.map((step, idx) => {
              const isDone = normalizedStatus !== "cancelled" && idx < activeIndex;
              const isActive = normalizedStatus !== "cancelled" && idx === activeIndex;
              const cancelled = normalizedStatus === "cancelled";
              const stepTimestamp = timeline.get(step);
              const timeLabel = cancelled
                ? "Cancelled"
                : stepTimestamp
                  ? fmtPk(stepTimestamp)
                  : isActive
                    ? "In Progress"
                    : "--";
              return (
                <div key={step} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                      cancelled
                        ? "border-red-500 bg-red-500 text-white"
                        : isDone
                          ? "border-green-600 bg-green-600 text-white"
                          : isActive
                            ? "border-amber-400 bg-amber-400 text-white animate-pulse"
                            : "border-slate-300 bg-slate-200 text-slate-500"
                    )}
                  >
                    {cancelled ? "✕" : isDone ? "✓" : idx + 1}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-ink-dark">{ORDER_STATUS_LABEL[step]}</p>
                  <p className="text-[11px] text-ink-light/50">
                    {timeLabel}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-3xl border border-caramel/20 p-5 mb-4">
          <h2 className="font-semibold text-ink-dark mb-3">Order Information</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <p><span className="text-ink-light/60">Name:</span> {order.customer_name}</p>
            <p><span className="text-ink-light/60">Phone:</span> {order.customer_phone}</p>
            <p><span className="text-ink-light/60">Email:</span> {order.customer_email || "-"}</p>
            <p><span className="text-ink-light/60">Date:</span> {fmtPk(order.created_at)}</p>
            <p className="sm:col-span-2"><span className="text-ink-light/60">Address:</span> {order.address || "-"}</p>
            <p><span className="text-ink-light/60">Type:</span> <span className="capitalize">{order.source}</span></p>
            <p><span className="text-ink-light/60">Total:</span> PKR {order.total_amount.toLocaleString()}</p>
          </div>
          {order.note ? <p className="mt-3 text-xs text-ink-light/60 whitespace-pre-wrap">{order.note}</p> : null}
        </div>

        <div className="glass rounded-3xl border border-caramel/20 p-5 mb-4">
          <h2 className="font-semibold text-ink-dark mb-3">Items</h2>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={`${item.product_id ?? item.product_name}-${index}`} className="flex items-center justify-between text-sm">
                <span>{item.product_name} x{item.quantity}</span>
                <span className="font-semibold">PKR {(item.unit_price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {canCustomerCancel(order.status) && (
          <div className="glass rounded-3xl border border-red-200 p-5">
            <p className="font-semibold text-red-600 mb-2">Cancel this order</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Cancellation reason (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-red-200 bg-white/80 outline-none focus:border-red-400 resize-none text-sm"
            />
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            <button
              onClick={cancelOrder}
              disabled={cancelling}
              className="mt-3 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

