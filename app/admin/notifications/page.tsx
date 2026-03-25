"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, ShoppingBag, CheckCheck, ArrowRight, Trash2 } from "lucide-react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { cn } from "@/lib/utils";

type AdminNotif = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  href: string;
  createdAtMs: number;
};

const formatOrderId = (id: string) => `#${id.slice(0, 6).toUpperCase()}`;
const ADMIN_NOTIF_READ_KEY = "cm_admin_notifications_read";
const ADMIN_NOTIF_CLEARED_AT_KEY = "cm_admin_notifications_cleared_at";

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<AdminNotif[]>([]);
  const [loading, setLoading] = useState(true);

  const setReadInStorage = (ids: string[]) => {
    if (typeof window === "undefined" || !ids.length) return;
    const current = JSON.parse(localStorage.getItem(ADMIN_NOTIF_READ_KEY) || "{}") as Record<string, boolean>;
    ids.forEach((id) => {
      current[id] = true;
    });
    localStorage.setItem(ADMIN_NOTIF_READ_KEY, JSON.stringify(current));
  };

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setReadInStorage([id]);
  };

  const markAllRead = () => {
    const ids = items.map((n) => n.id);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setReadInStorage(ids);
  };

  const clearAll = () => {
    const now = Date.now();
    setItems([]);
    if (typeof window !== "undefined") {
      localStorage.setItem(ADMIN_NOTIF_CLEARED_AT_KEY, String(now));
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in")) {
      window.location.href = "/admin/login";
      return;
    }

    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/orders?limit=100", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));

      if (res.ok && Array.isArray(body?.orders)) {
        const readMap = typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem(ADMIN_NOTIF_READ_KEY) || "{}") as Record<string, boolean>
          : {};
        const clearedAt = typeof window !== "undefined"
          ? Number(localStorage.getItem(ADMIN_NOTIF_CLEARED_AT_KEY) || "0") || 0
          : 0;

        setItems((body.orders as {
          id: string;
          customer_name: string;
          status: string;
          source: string;
          created_at: string;
        }[])
          .map((o) => {
            const createdAtMs = new Date(o.created_at).getTime();
            return {
              id: o.id,
              title: `Order ${formatOrderId(o.id)}`,
              message: `${o.customer_name} placed/updated an order (${o.source}) with status ${o.status}.`,
              time: new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
              read: Boolean(readMap[o.id]),
              href: "/admin/orders",
              createdAtMs,
            };
          })
          .filter((item) => item.createdAtMs > clearedAt));
      }
      setLoading(false);
    };

    load();
  }, []);

  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-caramel/12 flex items-center justify-center">
              <Bell className="w-5 h-5 text-caramel" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink-dark">Admin Notifications</h1>
              <p className="text-xs text-ink-light/55 font-sans">{unread} unread · {items.length} total</p>
            </div>
          </div>
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-caramel/20 text-caramel text-xs font-sans font-semibold hover:bg-caramel/8 transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-caramel/20 text-ink-light/60 text-xs font-sans font-semibold hover:text-rose hover:border-rose/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>

        <div className="glass rounded-3xl border border-caramel/15 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-ink-light/60 font-sans">Loading notifications...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-7 h-7 text-caramel/30 mx-auto mb-2" />
              <p className="font-display text-base text-ink-dark">No notifications yet</p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex items-start justify-between gap-4 px-5 py-4 border-b border-caramel/10 last:border-0 transition-colors",
                  n.read ? "bg-white/50 hover:bg-caramel/4" : "bg-cream-50 hover:bg-caramel/5"
                )}
              >
                <div>
                  <p className="text-sm font-sans font-semibold text-ink-dark">{n.title}</p>
                  <p className="text-xs text-ink-light/65 font-sans mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-ink-light/40 font-sans mt-1.5">{n.time}</p>
                </div>
                <Link href={n.href} className="text-caramel/60 hover:text-caramel transition-colors">
                  <ArrowRight className="w-4 h-4 flex-shrink-0 mt-1" />
                </Link>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
