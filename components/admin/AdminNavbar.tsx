"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, Grid3X3, BarChart3,
  ShoppingBag, Users, Tag, Bell, User, LogOut, Star, Scissors,
  ChevronDown, Menu, X, ExternalLink, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAdminSession } from "@/lib/adminSession";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
  type: "order" | "user" | "system" | "inventory";
}

const MOCK_ADMIN_NOTIFS: AdminNotification[] = [];
const PK_TIMEZONE = "Asia/Karachi";
const LOW_STOCK_CHECK_PREFIX = "cm_low_stock_check_";

const getPkClock = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const map = new Map(parts.map((p) => [p.type, p.value]));
  const year = map.get("year") ?? "0000";
  const month = map.get("month") ?? "00";
  const day = map.get("day") ?? "00";
  const hour = Number(map.get("hour") ?? "0");
  return {
    dateKey: `${year}-${month}-${day}`,
    hour: Number.isFinite(hour) ? hour : 0,
  };
};

const navLinks = [
  { href: "/admin/dashboard",  label: "Dashboard",  icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/admin/products",   label: "Products",   icon: <Package className="w-4 h-4" /> },
  { href: "/admin/categories", label: "Categories", icon: <Grid3X3 className="w-4 h-4" /> },
  { href: "/admin/orders",     label: "Orders",     icon: <ShoppingBag className="w-4 h-4" /> },
  { href: "/admin/custom-orders", label: "Custom pricing", icon: <Scissors className="w-4 h-4" /> },
  { href: "/admin/discounts",  label: "Discounts",  icon: <Tag className="w-4 h-4" /> },
  { href: "/admin/analytics",  label: "Analytics",  icon: <BarChart3 className="w-4 h-4" /> },
  { href: "/admin/reviews",    label: "Reviews",    icon: <Star className="w-4 h-4" /> },
  { href: "/admin/customers",  label: "Customers",  icon: <Users className="w-4 h-4" /> },
];

/* =============================================
   ANIMATED NAV LINK
   ============================================= */
const AdminNavLink = ({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) => (
  <Link href={href}
    className={cn(
      "relative group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-sans font-semibold transition-all duration-200",
      active
        ? "bg-caramel/15 text-caramel"
        : "text-ink-light hover:text-ink hover:bg-caramel/8"
    )}>
    <span className={cn("transition-colors duration-200", active ? "text-caramel" : "text-ink-light/60 group-hover:text-caramel")}>{icon}</span>
    <span className="hidden xl:block relative overflow-hidden h-[1.2em]">
      <span className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
        <span>{label}</span>
        <span className="text-caramel">{label}</span>
      </span>
    </span>
    {active && <span className="absolute bottom-0 left-3 right-3 h-px bg-caramel/40 rounded-full" />}
  </Link>
);

/* =============================================
   NOTIFICATION DROPDOWN
   ============================================= */
const rowTypeIcon = (t: AdminNotification["type"]) => {
  if (t === "inventory") return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden />;
  if (t === "order") return <ShoppingBag className="w-3.5 h-3.5 text-caramel shrink-0 mt-0.5" aria-hidden />;
  if (t === "user") return <User className="w-3.5 h-3.5 text-ink-light shrink-0 mt-0.5" aria-hidden />;
  return <Bell className="w-3.5 h-3.5 text-caramel/70 shrink-0 mt-0.5" aria-hidden />;
};

const AdminNotifDropdown = ({
  notifs,
  setupHint,
  onClose,
  onMarkAll,
  onMarkRead,
}: {
  notifs: AdminNotification[];
  setupHint: string | null;
  onClose: () => void;
  onMarkAll: () => void;
  onMarkRead: (id: string) => void;
}) => (
  <div className="absolute right-0 top-full mt-3 w-80 glass rounded-2xl shadow-card border border-caramel/20 overflow-hidden z-50 animate-slide-down">
    <div className="flex items-center justify-between px-4 py-3 border-b border-caramel/10">
      <span className="font-display text-sm font-semibold text-ink-dark">Notifications</span>
      <button type="button" onClick={onMarkAll} className="text-[10px] text-caramel hover:text-ink font-sans font-semibold transition-colors btn-bubble">Mark all read</button>
    </div>
    <div className="max-h-64 overflow-y-auto divide-y divide-caramel/8">
      {notifs.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2 px-3">
          <Bell className="w-6 h-6 text-caramel/30" />
          <p className="text-xs text-ink-light/50 font-sans text-center">No notifications</p>
          {setupHint && (
            <p className="text-[10px] text-amber-900/90 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-2 font-sans leading-snug text-left w-full">
              {setupHint}
            </p>
          )}
        </div>
      ) : (
        notifs.map((n) => (
          <Link
            key={n.id}
            href="/admin/notifications"
            title={`${n.title}: ${n.message}`}
            onClick={() => {
              onMarkRead(n.id);
              onClose();
            }}
            className={cn("block px-4 py-3 hover:bg-caramel/5 transition-colors cursor-pointer", !n.read && "bg-cream-50")}
          >
            <div className="flex items-start gap-2.5">
              {rowTypeIcon(n.type)}
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0", n.read ? "bg-transparent" : "bg-caramel")} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-sans font-semibold text-ink-dark leading-snug line-clamp-2">{n.title}</p>
                    <p className="text-xs font-sans text-ink/70 leading-snug line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-ink-light/40 mt-0.5">{n.time}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
    {setupHint && notifs.length > 0 && (
      <div className="px-3 py-2 border-t border-amber-200/60 bg-amber-50/90">
        <p className="text-[10px] text-amber-900/90 font-sans leading-snug">{setupHint}</p>
      </div>
    )}
    <div className="border-t border-caramel/10 px-4 py-2.5">
      <Link href="/admin/notifications" onClick={onClose}
        className="text-[11px] text-caramel hover:text-ink font-sans font-semibold transition-colors block text-center">
        Open notification center →
      </Link>
    </div>
  </div>
);

/* =============================================
   MAIN ADMIN NAVBAR
   ============================================= */
export const AdminNavbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [adminName, setAdminName] = React.useState("Admin");
  const [loggingOut, setLoggingOut] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("cm_admin_name");
      if (name) setAdminName(name.split(" ")[0]); // first word
    }
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data, mutate } = useSWR("/api/admin/admin-notifications?limit=8", fetcher, {
    revalidateOnFocus: false,
  });

  const mapType = (raw: string): AdminNotification["type"] => {
    const t = String(raw ?? "").toLowerCase();
    if (t === "low_stock" || t === "out_of_stock") return "inventory";
    if (t.includes("order")) return "order";
    if (t.includes("user")) return "user";
    return "system";
  };

  const notifs: AdminNotification[] = Array.isArray(data?.notifications)
    ? data.notifications.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: new Date(n.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
        read: n.is_read,
        link: n.link ?? undefined,
        type: mapType(n.type),
      }))
    : [];

  const unread = notifs.filter((n) => !n.read).length;

  const adminNotifSetupHint = typeof data?.setup_hint === "string" && data.setup_hint.trim() ? data.setup_hint.trim() : null;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldRunLowStock = () => {
      const { dateKey, hour } = getPkClock();
      if (hour < 6) return false;
      const key = `${LOW_STOCK_CHECK_PREFIX}${dateKey}`;
      if (localStorage.getItem(key)) return false;
      localStorage.setItem(key, String(Date.now()));
      return true;
    };

    const runLowStockCheck = async () => {
      if (!shouldRunLowStock()) return;
      await fetch("/api/admin/low-stock", { method: "POST" });
    };

    runLowStockCheck();
    const timer = setInterval(runLowStockCheck, 10 * 60 * 1000);
    const onFocus = () => runLowStockCheck();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className={cn(
        "sticky top-0 z-100 w-full transition-all duration-500",
        scrolled ? "glass-navbar shadow-navbar py-2" : "bg-cream-100/95 py-3 border-b border-caramel/10"
      )}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/admin/dashboard" className="flex items-center gap-2.5 shrink-0 group">
              <div
                className="w-10 h-10 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105"
                style={{ boxShadow: "0 2px 10px rgba(200,149,108,0.25), 0 1px 4px rgba(244,184,193,0.3)" }}
              >
                <img src="/images/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <p className="font-display text-sm font-semibold text-ink-dark leading-none">Crochet</p>
                <p className="font-script text-caramel text-xs leading-none">Masterpiece</p>
              </div>
              <span className="hidden sm:block ml-1 text-[9px] font-sans font-bold text-white bg-caramel/80 px-1.5 py-0.5 rounded-md tracking-wider uppercase">Admin</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <AdminNavLink key={link.href} {...link} active={isActive(link.href)} />
              ))}
            </nav>

            {/* Right: notifications + profile */}
            <div className="flex items-center gap-2">
              {/* View user site */}
              <Link href="/user/home?store=1" target="_blank" rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-sans font-semibold text-ink-light/60 hover:text-caramel hover:bg-caramel/8 transition-all btn-bubble"
                title="Open customer storefront (admin stays in this tab)">
                <ExternalLink className="w-3 h-3" /> View Site
              </Link>

              {/* Notifications */}
              <div
                ref={notifRef}
                className="relative"
                onMouseEnter={() => setNotifOpen(true)}
              >
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    setProfileOpen(false);
                    router.push("/admin/notifications");
                  }}
                  className={cn("relative p-2 rounded-xl transition-all hover:bg-caramel/10 btn-bubble",
                    notifOpen ? "text-caramel bg-caramel/10" : "text-ink-light hover:text-ink")}
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-linear-to-br from-caramel to-rose text-white text-[9px] font-bold flex items-center justify-center animate-bloom">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <AdminNotifDropdown
                    notifs={notifs}
                    setupHint={adminNotifSetupHint}
                    onClose={() => setNotifOpen(false)}
                    onMarkRead={async (id) => {
                      const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
                      mutate({ ...data, notifications: updated }, false);
                      await fetch("/api/admin/admin-notifications", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "mark_read", id }),
                      });
                      mutate();
                    }}
                    onMarkAll={async () => {
                      const updated = notifs.map((n) => ({ ...n, read: true }));
                      mutate({ ...data, notifications: updated }, false);
                      await fetch("/api/admin/admin-notifications", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "mark_all_read" }),
                      });
                      mutate();
                    }}
                  />
                )}
              </div>

              {/* Profile */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all btn-bubble",
                    profileOpen ? "bg-caramel/15 text-caramel" : "text-ink hover:bg-caramel/8"
                  )}
                >
                  <div className="w-6 h-6 rounded-lg bg-linear-to-br from-caramel to-latte flex items-center justify-center text-white text-[10px] font-bold">
                    {adminName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block">{adminName}</span>
                  <ChevronDown className={cn("w-3 h-3 text-ink-light/40 transition-transform duration-200", profileOpen && "rotate-180")} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 glass rounded-2xl shadow-card border border-caramel/20 overflow-hidden z-50 animate-slide-down">
                    <Link href="/admin/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm font-sans text-ink hover:bg-caramel/8 transition-colors border-b border-caramel/8">
                      <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-linear-to-br from-blush/30 to-caramel/20">
                        <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(adminName)}&backgroundColor=ffd5dc,ffdfbf&radius=0`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-sans font-semibold text-ink-dark leading-none">{adminName}</p>
                        <p className="text-[10px] text-ink-light/50 font-sans mt-0.5">View Profile</p>
                      </div>
                    </Link>
                    <Link href="/" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-ink hover:bg-caramel/8 transition-colors border-b border-caramel/8">
                      <ExternalLink className="w-4 h-4 text-caramel/60" /> View User Site
                    </Link>
                    <Link href="/admin/notifications" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-ink hover:bg-caramel/8 transition-colors border-b border-caramel/8">
                      <Bell className="w-4 h-4 text-caramel/60" /> Notifications
                    </Link>
                    <button
                      onClick={() => {
                        setLoggingOut(true);
                        clearAdminSession();
                        window.location.href = "/admin/login";
                      }}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-red-400 hover:bg-red-50 transition-colors">
                      {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden p-2 rounded-xl hover:bg-caramel/10 text-ink-light transition-colors">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={cn("md:hidden overflow-hidden transition-all duration-300", mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
          <div className="border-t border-caramel/10 px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans font-semibold transition-all",
                  isActive(link.href) ? "bg-caramel/12 text-caramel" : "text-ink hover:bg-caramel/8 hover:text-caramel")}>
                <span className="text-caramel/60">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </header>
    </>
  );
};

export default AdminNavbar;
