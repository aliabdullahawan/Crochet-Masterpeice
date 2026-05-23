"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ShoppingBag, CheckCheck, ArrowRight, Trash2 } from "lucide-react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type AdminNotif = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  href?: string;
  createdAtMs: number;
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupHint, setSetupHint] = useState<string | null>(null);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch("/api/admin/admin-notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", id }),
    });
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/admin/admin-notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
  };

  const clearAll = async () => {
    setItems([]);
    await fetch("/api/admin/admin-notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_all" }),
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in")) {
      router.replace("/admin/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/admin-notifications?limit=100", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));

      const hint = typeof body.setup_hint === "string" && body.setup_hint.trim() ? body.setup_hint.trim() : null;
      setSetupHint(res.ok ? hint : null);

      if (res.ok && Array.isArray(body?.notifications)) {
        setItems((body.notifications as {
          id: string;
          type: string;
          title: string;
          message: string;
          link: string | null;
          meta: string | null;
          is_read: boolean;
          created_at: string;
        }[]).map((n) => {
          const createdAtMs = new Date(n.created_at).getTime();
          return {
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
            read: n.is_read,
            href: n.link ?? undefined,
            createdAtMs,
          };
        }));
      } else if (res.ok) {
        setItems([]);
      }
      setLoading(false);
    };

    load();
  }, [router]);

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

        {setupHint && (
          <div className="mb-4 rounded-2xl border border-amber-200/80 bg-amber-50/95 px-4 py-3 text-xs sm:text-sm text-amber-950 font-sans leading-relaxed">
            {setupHint}
          </div>
        )}

        <div className="glass rounded-3xl border border-caramel/15 overflow-hidden">
          {loading ? (
            <div className="p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-caramel/10">
                  <Skeleton className="w-9 h-9 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
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
                <Link href={n.href ?? "/admin/notifications"} className="text-caramel/60 hover:text-caramel transition-colors">
                  <ArrowRight className="w-4 h-4 shrink-0 mt-1" />
                </Link>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
