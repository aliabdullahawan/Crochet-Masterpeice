"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, ShoppingBag, MessageCircle, Mail,
  Star, ChevronRight, ArrowLeft, Package, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

interface Customer {
  id: string; name: string; email: string; phone?: string;
  joined: string; total_orders: number; total_spent: number;
  avg_rating_given?: number; last_order?: string; is_active: boolean;
}

const MOCK_CUSTOMERS: Customer[] = []; // Replace: await supabase.from("users").select("*").order("created_at", { ascending: false }) = []

function useAdminAuth() {
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in"))
      window.location.href = "/admin/login";
  }, []);
}

/* =============================================
   CUSTOMER DETAIL PANEL
   ============================================= */
const CustomerDetailPanel = ({
  c,
  onClose,
  onSendNotification,
  onDeleteCustomer,
}: {
  c: Customer;
  onClose: () => void;
  onSendNotification: (userId: string, message: string) => Promise<void>;
  onDeleteCustomer: (customer: Customer) => Promise<void>;
}) => {
  const [adminMsg, setAdminMsg] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center gap-3 px-6 py-5 border-b border-caramel/12 flex-shrink-0">
      <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-caramel/10 text-ink-light btn-bubble">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-dark">{c.name}</h2>
        <p className="text-xs text-ink-light/55 font-sans">Customer Profile</p>
      </div>
      <span className={cn("ml-auto text-[10px] font-sans font-bold px-2.5 py-1 rounded-full border",
        c.is_active ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-400 border-red-200")}>
        {c.is_active ? "Active" : "Inactive"}
      </span>
    </div>

    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {/* Avatar + basic info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blush/35 to-mauve/25 flex items-center justify-center flex-shrink-0 shadow-soft">
          <span className="font-display text-2xl font-semibold text-caramel/80">{c.name.charAt(0)}</span>
        </div>
        <div>
          <p className="font-display text-base font-semibold text-ink-dark">{c.name}</p>
          <p className="text-xs text-ink-light/60 font-sans">{c.email}</p>
          {c.phone && <p className="text-xs text-ink-light/60 font-sans">{c.phone}</p>}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Orders", value: c.total_orders, icon: <Package className="w-4 h-4 text-caramel" /> },
          { label: "Total Spent",  value: `PKR ${c.total_spent.toLocaleString()}`, icon: <ShoppingBag className="w-4 h-4 text-caramel" /> },
          { label: "Avg Rating",   value: c.avg_rating_given ? `${c.avg_rating_given} / 5` : "No ratings", icon: <Star className="w-4 h-4 text-caramel" /> },
          { label: "Last Order",   value: c.last_order ?? "—", icon: <Calendar className="w-4 h-4 text-caramel" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-caramel/15 bg-cream-50/60 p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-caramel/10 flex items-center justify-center">{s.icon}</div>
              <p className="text-[10px] font-sans font-semibold text-ink-light/55 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className="font-display text-sm font-semibold text-ink-dark">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Timeline info */}
      <div className="rounded-2xl border border-caramel/15 bg-cream-50/60 p-4">
        <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest mb-3">Account Info</p>
        <div className="space-y-2 text-xs font-sans">
          <div className="flex justify-between">
            <span className="text-ink-light/60">Member since</span>
            <span className="font-semibold text-ink-dark">{c.joined}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-light/60">Last order</span>
            <span className="font-semibold text-ink-dark">{c.last_order ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-light/60">Order frequency</span>
            <span className="font-semibold text-ink-dark">
              {c.total_orders > 3 ? "Regular" : c.total_orders > 1 ? "Occasional" : "New"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-light/60">Avg order value</span>
            <span className="font-semibold text-ink-dark">
              {c.total_orders > 0 ? `PKR ${Math.round(c.total_spent / c.total_orders).toLocaleString()}` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest">Contact</p>
        {c.phone && (
          <a href={`https://wa.me/${c.phone.replace(/^0/, "92")}?text=${encodeURIComponent(`Hi ${c.name.split(" ")[0]}! This is Crochet Masterpiece. `)}`}
            target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] text-white text-sm font-sans font-bold hover:brightness-110 transition-all btn-bubble shadow-button">
            <MessageCircle className="w-4 h-4" /> Message on WhatsApp
          </a>
        )}
        <a href={`mailto:${c.email}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-caramel/25 text-ink text-sm font-sans font-semibold hover:bg-caramel/8 transition-all btn-bubble">
          <Mail className="w-4 h-4 text-caramel" /> Send Email
        </a>
        <textarea
          value={adminMsg}
          onChange={(e) => setAdminMsg(e.target.value)}
          placeholder="Send an in-site notification to this customer..."
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-caramel/20 bg-white/80 text-xs font-sans text-ink placeholder:text-ink-light/35 outline-none focus:border-caramel transition-all resize-none"
        />
        <button
          onClick={async () => {
            if (!adminMsg.trim()) return;
            setMsgSending(true);
            try {
              await onSendNotification(c.id, adminMsg.trim());
              setAdminMsg("");
            } finally {
              setMsgSending(false);
            }
          }}
          disabled={!adminMsg.trim() || msgSending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-caramel/25 bg-caramel/10 text-caramel text-xs font-sans font-bold hover:bg-caramel/15 transition-all btn-bubble disabled:opacity-60"
        >
          <Mail className="w-3.5 h-3.5" /> {msgSending ? "Sending..." : "Send In-Site Notification"}
        </button>
        <button
          onClick={async () => {
            const ok = confirm(`Delete user ${c.name} from database? This cannot be undone.`);
            if (!ok) return;
            setDeleting(true);
            try {
              await onDeleteCustomer(c);
            } finally {
              setDeleting(false);
            }
          }}
          disabled={deleting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-200 bg-red-50 text-red-500 text-xs font-sans font-bold hover:bg-red-100 transition-all btn-bubble disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete User Account"}
        </button>
      </div>
    </div>
  </div>
  );
};

/* =============================================
   CUSTOMERS PAGE
   ============================================= */
export default function AdminCustomersPage() {
  useAdminAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("id, email, name, phone, created_at, is_active")
          .order("created_at", { ascending: false });
        if (data) {
          setCustomers(data.map((u:{id:string;email:string;name:string;phone:string|null;created_at:string;is_active:boolean}, idx:number) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone ?? undefined,
            joined: new Date(u.created_at).toISOString().split("T")[0],
            total_orders: 0,
            total_spent: 0,
            is_active: u.is_active,
          })));
        }
      } catch(e) { console.error(e); }
      finally { setDbLoading(false); }
    };
    load();
  }, []);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 1024);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const sendCustomerNotification = async (userId: string, message: string) => {
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        type: "admin_message",
        title: "Message from admin",
        message,
        link: "/user/notifications",
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      alert("Could not send notification: " + (body?.error || "Unknown error"));
      return;
    }
    alert("In-site notification sent.");
  };

  const deleteCustomer = async (customer: Customer) => {
    const { error } = await supabase.from("users").delete().eq("id", customer.id);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    setSelected((prev) => (prev?.id === customer.id ? null : prev));
    alert("User removed from users table.");
  };

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />

      <div className="flex h-[calc(100vh-57px)] overflow-hidden flex-col lg:flex-row">
        {/* LEFT: customer list */}
        <motion.div
          className="flex flex-col overflow-hidden"
          animate={{ width: selected ? (isMobile ? "0%" : "55%") : "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 35 }}
        >
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink-dark">Customers</h1>
                <p className="text-sm text-ink-light/55 font-sans mt-0.5">
                  {customers.length} registered · PKR {customers.reduce((s, c) => s + c.total_spent, 0).toLocaleString()} total revenue
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-caramel/50" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-caramel/20 bg-white/80 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none focus:border-caramel transition-all" />
            </div>

            {/* Customer list */}
            <div className="glass rounded-3xl border border-caramel/15 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {filtered.map((c, i) => {
                  const isSelected = selected?.id === c.id;
                  return (
                    <motion.div key={c.id} layout
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => setSelected(isSelected ? null : c)}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 border-b border-caramel/8 last:border-0 cursor-pointer transition-all group",
                        isSelected ? "bg-caramel/8 border-l-2 border-l-caramel" : "hover:bg-caramel/4"
                      )}>
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blush/30 to-mauve/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-display text-base font-semibold text-caramel/80">{c.name.charAt(0)}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-sans text-sm font-semibold text-ink-dark">{c.name}</p>
                          <span className={cn("text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0",
                            c.is_active ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-400 border-red-200")}>
                            {c.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-xs text-ink-light/55 font-sans truncate">{c.email}</p>
                      </div>
                      {/* Stats */}
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="text-sm font-bold font-sans text-ink-dark">PKR {c.total_spent.toLocaleString()}</p>
                        <p className="text-[10px] text-ink-light/45 font-sans">{c.total_orders} order{c.total_orders !== 1 ? "s" : ""}</p>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-ink-light/25 transition-all flex-shrink-0", isSelected ? "text-caramel rotate-90" : "group-hover:text-caramel")} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Users className="w-8 h-8 text-caramel/30" />
                  <p className="font-display text-base text-ink-dark">No customers found</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* RIGHT: detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="customer-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? "100%" : "45%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
              className="flex-shrink-0 border-l border-caramel/15 bg-cream-50/95 backdrop-blur-sm overflow-hidden"
            >
              <div className="w-full h-full overflow-y-auto">
                <CustomerDetailPanel
                  c={selected}
                  onClose={() => setSelected(null)}
                  onSendNotification={sendCustomerNotification}
                  onDeleteCustomer={deleteCustomer}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
