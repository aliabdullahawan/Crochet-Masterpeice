"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Search, X, Eye, Check, Clock, Truck, Star,
  MessageCircle, ChevronRight, ArrowLeft, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
type OrderSource = "whatsapp" | "website" | "custom";

interface OrderItem { name: string; qty: number; price: number; product_id?: string | null; }
interface Order {
  user_id?: string | null;
  id: string; customer_name: string; customer_email?: string; customer_phone: string;
  items: OrderItem[]; total: number; status: OrderStatus; source: OrderSource;
  date: string; note?: string; address?: string;
}

const formatOrderId = (id: string) => `#${id.slice(0, 6).toUpperCase()}`;

const MOCK_ORDERS: Order[] = []; // Data loaded from Supabase on mount

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode; next?: OrderStatus }> = {
  pending:   { label: "Pending",   color: "bg-amber-50 text-amber-600 border-amber-200",   icon: <Clock className="w-3 h-3" />,   next: "confirmed" },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-600 border-blue-200",     icon: <Check className="w-3 h-3" />,   next: "shipped" },
  shipped:   { label: "Shipped",   color: "bg-purple-50 text-purple-600 border-purple-200", icon: <Truck className="w-3 h-3" />, next: "delivered" },
  delivered: { label: "Delivered", color: "bg-green-50 text-green-600 border-green-200",   icon: <Star className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-400 border-red-200",         icon: <X className="w-3 h-3" /> },
};

const SRC_CFG: Record<OrderSource, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "bg-[#25D366]/10 text-[#1a8f47] border-[#25D366]/25" },
  website:  { label: "Website",  color: "bg-blue-50 text-blue-600 border-blue-200" },
  custom:   { label: "Custom",   color: "bg-mauve/15 text-mauve border-mauve/25" },
};

function useAdminAuth() {
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in"))
      window.location.href = "/admin/login";
  }, []);
}

/* =============================================
   ORDER DETAIL — slide panel content
   ============================================= */
const OrderDetailPanel = ({ order, onClose, onStatusChange, onSendUserMessage, onDeleteOrder }: {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onSendUserMessage: (id: string, message: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
}) => {
  const s = STATUS_CFG[order.status];
  const [adminMsg, setAdminMsg] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const waMsg = encodeURIComponent(`Hi ${order.customer_name}! This is Crochet Masterpiece. Your order ${formatOrderId(order.id)} is now *${s.label}*. ${adminMsg}`);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-caramel/12 flex-shrink-0">
        <button onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-caramel/10 text-ink-light transition-colors btn-bubble">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-dark">Order {formatOrderId(order.id)}</h2>
          <p className="text-xs text-ink-light/55 font-sans">{order.date} · {SRC_CFG[order.source].label}</p>
        </div>
        <span className={cn("ml-auto text-[10px] font-sans font-bold px-2.5 py-1 rounded-full border flex items-center gap-1", s.color)}>
          {s.icon} {s.label}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Customer info */}
        <div className="rounded-2xl border border-caramel/15 bg-cream-50/60 p-4">
          <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest mb-2.5">Customer</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blush/35 to-mauve/25 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-base font-semibold text-caramel/80">{order.customer_name.charAt(0)}</span>
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-ink-dark">{order.customer_name}</p>
              <p className="text-xs text-ink-light/60 font-sans">{order.customer_phone}</p>
              {order.customer_email && <p className="text-xs text-ink-light/55 font-sans">{order.customer_email}</p>}
            </div>
          </div>
          {order.address && (
            <p className="text-xs text-ink-light/55 font-sans mt-2.5 pt-2.5 border-t border-caramel/10 italic">{order.address}</p>
          )}
          {order.note && (
            <p className="text-xs text-amber-700 font-sans mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">Note: {order.note}</p>
          )}
        </div>

        {/* Items */}
        <div className="rounded-2xl border border-caramel/15 bg-cream-50/60 p-4">
          <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest mb-3">Items</p>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blush/30 to-cream-100 border border-blush/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-xs font-semibold text-caramel/80">{item.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-xs font-sans font-semibold text-ink-dark">{item.name}</p>
                    <p className="text-[10px] text-ink-light/50">× {item.qty} · PKR {item.price.toLocaleString()} each</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-sans text-caramel flex-shrink-0">PKR {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-caramel/15 pt-2.5 flex justify-between">
              <span className="text-sm font-sans font-bold text-ink-dark">Total</span>
              <span className="text-sm font-bold font-sans text-caramel">PKR {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Status update */}
        <div className="rounded-2xl border border-caramel/15 bg-cream-50/60 p-4">
          <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest mb-3">Update Status</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STATUS_CFG) as OrderStatus[]).map((st) => (
              <button key={st} onClick={() => onStatusChange(order.id, st)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-sans font-semibold transition-all btn-bubble",
                  order.status === st
                    ? STATUS_CFG[st].color
                    : "border-caramel/15 text-ink-light/60 hover:border-caramel/35 hover:text-ink bg-white/60"
                )}>
                {STATUS_CFG[st].icon}
                {STATUS_CFG[st].label}
                {order.status === st && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </div>
          <button
            onClick={async () => {
              const ok = confirm(`Delete order ${formatOrderId(order.id)}? This cannot be undone.`);
              if (!ok) return;
              await onDeleteOrder(order.id);
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-500 text-xs font-sans font-bold hover:bg-red-100 transition-all btn-bubble"
          >
            <X className="w-3.5 h-3.5" /> Delete This Order
          </button>
        </div>

        {/* Message customer */}
        <div className="rounded-2xl border border-[#25D366]/20 bg-[#25D366]/4 p-4">
          <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest mb-2.5">Message Customer</p>
          <textarea value={adminMsg} onChange={(e) => setAdminMsg(e.target.value)}
            placeholder="Add a note for the customer…"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-caramel/20 bg-white/80 text-xs font-sans text-ink placeholder:text-ink-light/35 outline-none focus:border-caramel transition-all resize-none mb-2.5" />
          <a href={`https://wa.me/${order.customer_phone.replace(/^0/, "92")}?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-sans font-bold hover:brightness-110 transition-all btn-bubble">
            <MessageCircle className="w-3.5 h-3.5" /> Send on WhatsApp
          </a>
          <button
            onClick={async () => {
              if (!adminMsg.trim()) return;
              setMsgSending(true);
              try {
                await onSendUserMessage(order.id, adminMsg.trim());
                setAdminMsg("");
              } finally {
                setMsgSending(false);
              }
            }}
            disabled={msgSending || !adminMsg.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-caramel/25 bg-caramel/10 text-caramel text-xs font-sans font-bold hover:bg-caramel/15 transition-all btn-bubble disabled:opacity-60"
          >
            <Bell className="w-3.5 h-3.5" /> {msgSending ? "Sending..." : "Send In-App Notification"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =============================================
   ORDERS PAGE — list shrinks left, panel slides right
   ============================================= */
export default function AdminOrdersPage() {
  useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/orders", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof body?.error === "string" ? body.error : "Could not load orders.");
        }

        const orderRows = Array.isArray(body?.orders) ? body.orders : [];
        setOrders(orderRows.map((o: {
          id: string;
          user_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          total_amount: number;
          status: string;
          source: string;
          created_at: string;
          note: string;
          address: string;
          items: Array<{
            product_id: string | null;
            product_name: string;
            quantity: number;
            unit_price: number;
          }>;
        }) => ({
          id: o.id,
          user_id: o.user_id,
          customer_name: o.customer_name,
          customer_email: o.customer_email || undefined,
          customer_phone: o.customer_phone,
          items: (o.items ?? []).map((item) => ({
            name: item.product_name,
            qty: item.quantity,
            price: item.unit_price,
            product_id: item.product_id,
          })),
          total: o.total_amount,
          status: o.status as Order["status"],
          source: o.source as Order["source"],
          date: new Date(o.created_at).toISOString().split("T")[0],
          note: o.note || undefined,
          address: o.address || undefined,
        })));
      } catch(e) { console.error(e); }
      finally { setDbLoading(false); }
    };
    load();
  }, []);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 1024);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const decrementStockForOrder = async (orderId: string) => {
    const { data: orderItems, error } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId)
      .not("product_id", "is", null);

    if (error || !orderItems?.length) return;

    const quantityByProduct = new Map<string, number>();
    (orderItems as { product_id: string; quantity: number }[]).forEach((item) => {
      const prev = quantityByProduct.get(item.product_id) ?? 0;
      quantityByProduct.set(item.product_id, prev + item.quantity);
    });

    const productIds = Array.from(quantityByProduct.keys());
    if (!productIds.length) return;

    const { data: products } = await supabase
      .from("products")
      .select("id, stock_quantity")
      .in("id", productIds);

    const updates = (products ?? []).map((p) => {
      const orderedQty = quantityByProduct.get(p.id) ?? 0;
      const nextStock = Math.max(0, Number(p.stock_quantity ?? 0) - orderedQty);
      return supabase.from("products").update({ stock_quantity: nextStock }).eq("id", p.id);
    });

    await Promise.all(updates);
  };

  const resolveOrderUserId = async (order: Order) => {
    if (order.user_id) return order.user_id;
    if (!order.customer_email) return null;

    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("email", order.customer_email)
      .maybeSingle();

    const resolvedId = (data as { id: string } | null)?.id ?? null;
    if (resolvedId) {
      await supabase.from("orders").update({ user_id: resolvedId }).eq("id", order.id);
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, user_id: resolvedId } : o));
      setSelected((prev) => prev?.id === order.id ? { ...prev, user_id: resolvedId } : prev);
    }
    return resolvedId;
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    const current = orders.find((o) => o.id === id);
    if (!current) return;

    // Prevent backtracking from shipped/delivered to avoid accidental double stock deduction.
    if ((current.status === "shipped" || current.status === "delivered") && status !== current.status) {
      alert("This order is already shipped/delivered. Status cannot be moved backward.");
      return;
    }

    const shouldDeductStock = status === "shipped" && current.status !== "shipped" && current.status !== "delivered";

    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { alert("Status update failed: " + error.message); return; }

    const notifyUserId = await resolveOrderUserId(current);
    if (notifyUserId) {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: notifyUserId,
          type: "order_update",
          title: `Order ${STATUS_CFG[status].label}`,
          message: `Your order ${formatOrderId(id)} is now ${STATUS_CFG[status].label.toLowerCase()}.`,
          link: "/user/profile",
          meta: formatOrderId(id),
        }),
      });
    }

    if (shouldDeductStock) {
      await decrementStockForOrder(id);
    }

    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
    setSelected(s => s?.id === id ? { ...s, status } : s);
  };

  const sendUserMessage = async (id: string, message: string) => {
    const current = orders.find((o) => o.id === id);
    if (!current) return;

    const notifyUserId = await resolveOrderUserId(current);
    if (!notifyUserId) {
      alert("This order has no linked website user.");
      return;
    }

    // Support both schema variants:
    // - newer schema: orders.admin_note
    // - clean/legacy schema: orders.note
    const { error: adminNoteErr } = await supabase
      .from("orders")
      .update({ admin_note: message })
      .eq("id", id);

    if (adminNoteErr) {
      const missingAdminNoteColumn = adminNoteErr.message.toLowerCase().includes("admin_note")
        && adminNoteErr.message.toLowerCase().includes("could not find");

      if (missingAdminNoteColumn) {
        const existingNote = (current.note ?? "").trim();
        const mergedNote = existingNote
          ? `${existingNote}\n\nAdmin message: ${message}`
          : `Admin message: ${message}`;

        const { error: noteErr } = await supabase
          .from("orders")
          .update({ note: mergedNote })
          .eq("id", id);

        if (noteErr) {
          alert("Could not save admin note: " + noteErr.message);
          return;
        }

        setOrders((prev) => prev.map((o) => o.id === id ? { ...o, note: mergedNote } : o));
        setSelected((prev) => prev?.id === id ? { ...prev, note: mergedNote } : prev);
      } else {
        alert("Could not save admin note: " + adminNoteErr.message);
        return;
      }
    }

    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: notifyUserId,
        type: "admin_message",
        title: "Message from admin",
        message,
        link: "/user/profile",
        meta: formatOrderId(id),
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      alert("Could not send notification: " + (body?.error || "Unknown error"));
      return;
    }

    alert("In-app notification sent to user.");
  };

  const deleteOrder = async (id: string) => {
    const res = await fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert("Delete failed: " + (body?.error || "Unknown error"));
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setSelected((prev) => (prev?.id === id ? null : prev));
    alert("Order deleted.");
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    if (search
      && !o.customer_name.toLowerCase().includes(q)
      && !o.id.toLowerCase().includes(q)
      && !formatOrderId(o.id).toLowerCase().includes(q)) return false;
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    return true;
  });

  const counts = (Object.keys(STATUS_CFG) as OrderStatus[]).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />

      {/* Main layout — flexbox so panel pushes content left */}
      <div className="flex h-[calc(100vh-57px)] overflow-hidden flex-col lg:flex-row">

        {/* LEFT: order list — shrinks when panel open */}
        <motion.div
          className="flex flex-col overflow-hidden"
          animate={{ width: selected ? (isMobile ? "0%" : "55%") : "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 35 }}
        >
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="mb-5">
              <h1 className="font-display text-2xl font-semibold text-ink-dark">Orders</h1>
              <p className="text-sm text-ink-light/55 font-sans mt-0.5">{orders.length} total · {counts.pending ?? 0} pending</p>
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setFilterStatus("all")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-semibold border transition-all btn-bubble",
                  filterStatus === "all" ? "bg-caramel/15 border-caramel/40 text-caramel" : "border-caramel/15 text-ink-light/60 hover:border-caramel/30 bg-white/70")}>
                All <span className={cn("w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center", filterStatus === "all" ? "bg-caramel text-white" : "bg-caramel/15 text-caramel")}>{orders.length}</span>
              </button>
              {(Object.keys(STATUS_CFG) as OrderStatus[]).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-semibold border transition-all btn-bubble",
                    filterStatus === s ? "bg-caramel/15 border-caramel/40 text-caramel" : "border-caramel/15 text-ink-light/60 hover:border-caramel/30 bg-white/70")}>
                  {STATUS_CFG[s].label}
                  <span className={cn("w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center", filterStatus === s ? "bg-caramel text-white" : "bg-caramel/15 text-caramel")}>{counts[s]}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-caramel/50" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or ID…"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-caramel/20 bg-white/80 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none focus:border-caramel transition-all" />
            </div>

            {/* Orders list */}
            <div className="glass rounded-3xl border border-caramel/15 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {filtered.map((order) => {
                  const s = STATUS_CFG[order.status];
                  const src = SRC_CFG[order.source];
                  const isSelected = selected?.id === order.id;
                  return (
                    <motion.div key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setSelected(isSelected ? null : order)}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 border-b border-caramel/8 last:border-0 cursor-pointer transition-all group",
                        isSelected ? "bg-caramel/8 border-l-2 border-l-caramel" : "hover:bg-caramel/4"
                      )}>
                      {/* Initial */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blush/30 to-mauve/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-display text-sm font-semibold text-caramel/80">{order.customer_name.charAt(0)}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-sans font-bold text-caramel">{formatOrderId(order.id)}</span>
                          <span className="font-sans text-sm font-semibold text-ink-dark truncate">{order.customer_name}</span>
                        </div>
                        <p className="text-[11px] text-ink-light/55 font-sans truncate">{order.items.map(i => i.name).join(", ")}</p>
                      </div>
                      {/* Right side */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-sm font-bold font-sans text-ink-dark">PKR {order.total.toLocaleString()}</span>
                        <div className="flex gap-1.5">
                          <span className={cn("text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border flex items-center gap-0.5", s.color)}>{s.icon} {s.label}</span>
                          <span className={cn("text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border hidden lg:flex", src.color)}>{src.label}</span>
                        </div>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-ink-light/25 transition-all flex-shrink-0", isSelected ? "text-caramel rotate-90" : "group-hover:text-caramel")} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-3">
                  <ShoppingBag className="w-8 h-8 text-caramel/30" />
                  <p className="font-display text-base text-ink-dark">No orders found</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* RIGHT: detail panel — slides in */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="order-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? "100%" : "45%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
              className="flex-shrink-0 border-l border-caramel/15 bg-cream-50/95 backdrop-blur-sm overflow-hidden"
            >
              <div className="w-full h-full overflow-y-auto">
                <OrderDetailPanel
                  order={selected}
                  onClose={() => setSelected(null)}
                  onStatusChange={updateStatus}
                  onSendUserMessage={sendUserMessage}
                  onDeleteOrder={deleteOrder}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
