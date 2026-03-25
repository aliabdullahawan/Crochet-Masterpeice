"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Package, Tag, MessageCircle, CheckCheck, Trash2, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type NotifType = "order_update" | "review_reply" | "admin_message" | "discount" | "promo";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
  meta?: string; // e.g. product name, order id
}

const MOCK_NOTIFS: Notification[] = []; // Loaded from Supabase

const typeConfig: Record<NotifType, { icon: React.ReactNode; bg: string; color: string }> = {
  order_update: { icon: <Package className="w-4 h-4" />, bg: "bg-caramel/15", color: "text-caramel" },
  review_reply: { icon: <Star className="w-4 h-4" />, bg: "bg-mauve/15", color: "text-mauve" },
  admin_message: { icon: <MessageCircle className="w-4 h-4" />, bg: "bg-blush/20", color: "text-rose" },
  discount: { icon: <Tag className="w-4 h-4" />, bg: "bg-caramel/10", color: "text-caramel" },
  promo: { icon: <Bell className="w-4 h-4" />, bg: "bg-blush/15", color: "text-blush" },
};

const NotifCard = ({
  notif, onRead, onDelete,
}: { notif: Notification; onRead: (id: string) => void; onDelete: (id: string) => void }) => {
  const cfg = typeConfig[notif.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onRead(notif.id)}
      className={cn(
        "relative rounded-2xl border p-4 cursor-pointer group transition-all duration-200",
        notif.read
          ? "border-blush/15 bg-white/60 hover:border-blush/30"
          : "border-blush/30 bg-gradient-to-r from-blush/8 to-mauve/5 hover:border-caramel/30 shadow-soft"
      )}
    >
      {/* Unread dot */}
      {!notif.read && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-br from-caramel to-rose animate-pulse-soft" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg, cfg.color)}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={cn("text-sm font-sans font-semibold leading-snug", notif.read ? "text-ink/70" : "text-ink-dark")}>
              {notif.title}
            </p>
          </div>
          <p className="text-xs text-ink-light/65 font-sans leading-relaxed mb-2">{notif.message}</p>
          {notif.meta && (
            <span className="inline-flex text-[10px] font-sans font-semibold text-caramel bg-caramel/10 px-2 py-0.5 rounded-md border border-caramel/15 mb-2">
              {notif.meta}
            </span>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-ink-light/40 font-sans">{notif.time}</span>
            {notif.link && (
              <Link href={notif.link} onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[10px] text-caramel hover:text-ink font-sans font-semibold transition-colors group/link">
                View <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Delete on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
        className="absolute right-3 bottom-3 p-1.5 rounded-lg text-ink-light/20 hover:text-rose hover:bg-rose/10 transition-all opacity-0 group-hover:opacity-100 btn-bubble"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, message, is_read, link, meta, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!active || !data) return;
      setNotifs(data.map((n: {
        id: string; type: string; title: string; message: string;
        is_read: boolean; link: string | null; meta: string | null; created_at: string;
      }) => ({
        id: n.id,
        type: n.type as NotifType,
        title: n.title,
        message: n.message,
        time: new Date(n.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
        read: n.is_read,
        link: n.link ?? undefined,
        meta: n.meta ?? undefined,
      })));
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadNotifications();
    };
    window.addEventListener("focus", loadNotifications);
    document.addEventListener("visibilitychange", onVisible);

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", loadNotifications);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [user]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markAllRead = async () => {
    if (!user) return;
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  };
  const markRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };
  const deleteNotif = async (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };
  const clearAll = async () => {
    if (!user) return;
    setNotifs([]);
    await supabase.from("notifications").delete().eq("user_id", user.id);
  };

  const unreadCount = notifs.filter((n) => !n.read).length;
  const displayed = filter === "unread" ? notifs.filter((n) => !n.read) : notifs;

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blush/25 to-mauve/15 flex items-center justify-center">
              <Bell className="w-5 h-5 text-caramel" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink-dark">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-caramel font-sans font-semibold">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-sans font-semibold text-caramel hover:text-ink transition-colors px-3 py-1.5 rounded-xl border border-caramel/20 hover:bg-caramel/8 btn-bubble">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            {notifs.length > 0 && (
              <button onClick={clearAll}
                className="flex items-center gap-1.5 text-xs font-sans font-semibold text-ink-light/50 hover:text-rose transition-colors px-3 py-1.5 rounded-xl border border-caramel/15 hover:border-rose/30 btn-bubble">
                <Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "unread"] as const).map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all duration-200 btn-bubble",
                filter === tab
                  ? "bg-gradient-to-r from-caramel to-rose text-white shadow-button"
                  : "border border-caramel/20 text-ink-light/60 hover:border-blush/50"
              )}>
              {tab === "all" ? `All (${notifs.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        {displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="text-5xl animate-float"></div>
            <p className="font-display text-lg text-ink-dark">
              {filter === "unread" ? "You're all caught up!" : "No notifications yet"}
            </p>
            <p className="text-sm text-ink-light/55 font-sans">
              {filter === "unread" ? "Check back later for updates on your orders." : "Order something lovely and we'll keep you updated here."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {displayed.map((n) => (
                <NotifCard key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
