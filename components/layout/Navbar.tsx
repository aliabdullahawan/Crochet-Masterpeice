"use client";

import React, { useState, useEffect, useRef } from "react";
import { useShop } from "@/lib/ShopContext";
import { useAuth, getAvatarUrl } from "@/lib/AuthContext";
import { signOut, supabase } from "@/lib/supabase";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { WishlistDrawer } from "@/components/ui/WishlistDrawer";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart, ShoppingBag, Bell, User, LogOut, Settings,
  ChevronDown, Menu, X, ShoppingCart, Home, Package,
  Scissors, Phone, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CrochetLogo } from "@/components/ui/CrochetLogo";

/* =============================================
   TYPES
   ============================================= */
interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: "order" | "promo" | "system";
}

const DISCOUNT_CACHE_KEY = "cm_nav_discounts";
const DISCOUNT_CACHE_TTL_MS = 60_000;
const NOTIF_CACHE_PREFIX = "cm_nav_notifs_";
const NOTIF_CACHE_TTL_MS = 20_000;

/* =============================================
   ANIMATED NAV LINK (hover = slide up reveal)
   ============================================= */
const AnimatedNavLink = ({
  href,
  label,
  icon,
  active,
  onClick,
}: NavLink & { active?: boolean; onClick?: () => void }) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "relative group flex items-center gap-1.5 px-1 py-1",
      "text-sm font-sans font-semibold transition-colors duration-300",
      active ? "text-caramel-400" : "text-ink-light hover:text-ink"
    )}
  >
    {/* Dual-line scroll reveal */}
    <span className="relative inline-block overflow-hidden h-[1.2em]">
      <span className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
        <span className={cn("block", active ? "text-caramel-400" : "")}>{label}</span>
        <span className="block text-caramel">{label}</span>
      </span>
    </span>
    {/* Active dot */}
    {active && (
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-caramel animate-pulse-soft" />
    )}
    {/* Hover underline */}
    <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-caramel/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
  </Link>
);

/* =============================================
   ICON BUTTON (cart, wishlist, bell)
   ============================================= */
const IconBtn = ({
  children,
  count,
  onClick,
  "aria-label": ariaLabel,
  active,
}: {
  children: React.ReactNode;
  count?: number;
  onClick?: () => void;
  "aria-label": string;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={cn(
      "relative p-2 rounded-xl transition-all duration-200",
      "hover:bg-blush/20 active:scale-95",
      active ? "text-caramel bg-blush/15" : "text-ink-light hover:text-ink"
    )}
  >
    {children}
    {count !== undefined && count > 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gradient-to-br from-blush to-caramel text-white text-[10px] font-bold px-1 shadow-button animate-bloom">
        {count > 99 ? "99+" : count}
      </span>
    )}
  </button>
);

/* =============================================
   NOTIFICATION DROPDOWN
   ============================================= */
const NotificationDropdown = ({
  notifications,
  onClose,
  onMarkAllRead,
}: {
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
}) => {
  const typeIcon = (type: Notification["type"]) => {
    if (type === "order") return <Package className="w-3.5 h-3.5 text-caramel" />;
    if (type === "promo") return <Tag className="w-3.5 h-3.5 text-mauve" />;
    return <Bell className="w-3.5 h-3.5 text-blush" />;
  };

  return (
    <div className="absolute right-0 top-full mt-3 w-80 glass rounded-2xl shadow-card border border-blush/30 overflow-hidden z-50 animate-slide-down">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blush/20">
        <span className="font-display text-sm font-semibold text-ink-dark">Notifications</span>
        <button
          onClick={onMarkAllRead}
          className="text-xs text-caramel hover:text-ink font-sans font-semibold transition-colors"
        >
          Mark all read
        </button>
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Bell className="w-8 h-8 text-blush/40" />
            <p className="text-xs text-ink-light/50 font-sans">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n, index) => (
            <Link
              key={n.id || `${n.type}-${n.time}-${index}`}
              href="/user/notifications"
              onClick={onClose}
              className={cn(
                "flex gap-3 px-4 py-3 hover:bg-blush/10 transition-colors duration-200",
                "border-b border-blush/10 last:border-0",
                !n.read && "bg-cream-50"
              )}
            >
              <div className="w-7 h-7 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-sans leading-relaxed text-ink truncate", !n.read && "font-semibold")}>
                  {n.message}
                </p>
                <p className="text-[10px] text-ink-light/50 mt-0.5">{n.time}</p>
              </div>
              {!n.read && (
                <div className="w-1.5 h-1.5 rounded-full bg-blush mt-1.5 flex-shrink-0" />
              )}
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-blush/20">
          <Link
            href="/user/notifications"
            onClick={onClose}
            className="text-xs text-caramel hover:text-ink font-sans font-semibold block text-center transition-colors"
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
};

/* =============================================
   GET STARTED / PROFILE DROPDOWN
   ============================================= */
const ProfileDropdown = ({
  isLoggedIn,
  userName,
  avatarEmoji,
  onClose,
  onLogout,
}: {
  isLoggedIn: boolean;
  userName?: string;
  avatarEmoji?: string;
  onClose: () => void;
  onLogout?: () => void;
}) => (
  <div className="absolute right-0 top-full mt-3 w-56 glass rounded-2xl shadow-card border border-blush/30 overflow-hidden z-50 animate-slide-down">
    {isLoggedIn ? (
      <>
        {/* User info */}
        <div className="px-4 py-3 border-b border-blush/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-blush to-mauve flex items-center justify-center flex-shrink-0">
            {avatarEmoji && avatarEmoji.startsWith("http") ? (
              <img src={avatarEmoji} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">{avatarEmoji ?? "🌸"}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-dark font-sans">{userName ?? "My Account"}</p>
            <p className="text-[10px] text-ink-light/60 font-sans">Logged in</p>
          </div>
        </div>
        <Link href="/user/profile" onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-ink hover:bg-blush/10 transition-colors">
          <Settings className="w-4 h-4 text-ink-light/60" /> My Profile
        </Link>
        <Link href="/user/orders" onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-ink hover:bg-blush/10 transition-colors border-b border-blush/10">
          <Package className="w-4 h-4 text-ink-light/60" /> My Orders
        </Link>
        <button onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-red-400 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </>
    ) : (
      <>
        <div className="px-4 py-3 border-b border-blush/20">
          <p className="text-xs text-ink-light/60 font-sans">Welcome to Crochet Masterpiece</p>
        </div>
        <Link href="/user/login" onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-ink hover:bg-blush/10 transition-colors">
          <User className="w-4 h-4 text-ink-light/60" /> Sign In
        </Link>
        <Link href="/user/signup" onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-ink hover:bg-blush/10 transition-colors">
          <Heart className="w-4 h-4 text-blush" /> Create Account
        </Link>
      </>
    )}
  </div>
);

/* =============================================
   DISCOUNT TICKER BANNER
   ============================================= */
const DiscountBanner = ({
  discounts,
}: {
  discounts: Array<{ code: string; label: string; percent: number; endsAt?: string }>;
}) => {
  if (!discounts.length) return null;
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-caramel/90 via-blush/90 to-mauve/90 text-white py-1.5 text-xs font-sans font-semibold tracking-wide">
      <div
        className="flex gap-16 whitespace-nowrap"
        style={{ animation: "marquee 28s linear infinite" }}
      >
        {[...discounts, ...discounts].map((d, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 inline" />
            <span className="font-script text-sm">{d.code}</span>
            <span>— {d.percent}% off {d.label}</span>
            {d.endsAt && <span className="opacity-70">· ends {d.endsAt}</span>}
            <span className="opacity-40 mx-4">✦</span>
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

/* =============================================
   MAIN NAVBAR
   ============================================= */
export const Navbar = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { user, isLoggedIn, displayName, avatarUrl } = useAuth();
  const { cartCount, wishlistCount } = useShop();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = async (userId: string) => {
    if (typeof window !== "undefined") {
      const cachedRaw = sessionStorage.getItem(`${NOTIF_CACHE_PREFIX}${userId}`);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as { ts: number; items: Notification[] };
          if (Array.isArray(cached.items) && Date.now() - cached.ts <= NOTIF_CACHE_TTL_MS) {
            setNotifications(cached.items);
            return;
          }
          if (Array.isArray(cached.items)) {
            setNotifications(cached.items);
          }
        } catch {
          // ignore cache parse errors
        }
      }
    }

    const { data } = await supabase
      .from("notifications")
      .select("id, type, message, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8);

    if (!data) return;
    const mapped: Notification[] = (data as {
      id: string;
      type: string;
      message: string;
      is_read: boolean;
      created_at: string;
    }[]).map((n) => ({
      id: n.id,
      message: n.message,
      time: new Date(n.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
      read: n.is_read,
      type: n.type === "promo" || n.type === "discount" ? "promo" : n.type === "order_update" ? "order" : "system",
    }));

    setNotifications(mapped);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`${NOTIF_CACHE_PREFIX}${userId}`, JSON.stringify({ ts: Date.now(), items: mapped }));
    }
  };

  const loadActiveDiscounts = async () => {
    if (typeof window !== "undefined") {
      const cachedRaw = sessionStorage.getItem(DISCOUNT_CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as {
            ts: number;
            items: Array<{ code: string; label: string; percent: number; endsAt?: string }>;
          };
          if (Array.isArray(cached.items)) {
            setActiveDiscounts(cached.items);
          }
          if (Date.now() - cached.ts <= DISCOUNT_CACHE_TTL_MS) {
            return;
          }
        } catch {
          // ignore cache parse errors
        }
      }
    }

    const [{ data }, hiddenSettings] = await Promise.all([
      supabase
      .from("discounts")
      .select("id, code, discount_value, end_date")
      .eq("active", true)
      .not("code", "is", null),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hidden_discount_banner_ids")
        .maybeSingle(),
    ]);

    let hiddenIds = new Set<string>();
    try {
      const parsed = JSON.parse((hiddenSettings.data as { value?: string } | null)?.value ?? "[]");
      hiddenIds = new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []);
    } catch {
      hiddenIds = new Set<string>();
    }

    if (!data?.length) {
      setActiveDiscounts([]);
      return;
    }

    const now = new Date();
    const rows = (data as Array<{ id?: string; code: string; discount_value: number; end_date: string | null }>).filter((d) => {
      const notExpired = !d.end_date || new Date(d.end_date) >= now;
      const notHidden = d.id ? !hiddenIds.has(d.id) : true;
      return notExpired && notHidden;
    });

    if (!rows.length) {
      setActiveDiscounts([]);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(DISCOUNT_CACHE_KEY, JSON.stringify({ ts: Date.now(), items: [] }));
      }
      return;
    }

    const mapped = rows.map((d: { code: string; discount_value: number; end_date: string | null }) => ({
        code: d.code,
        label: "selected products",
        percent: d.discount_value,
        endsAt: d.end_date ? new Date(d.end_date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : undefined,
      }));

    setActiveDiscounts(mapped);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISCOUNT_CACHE_KEY, JSON.stringify({ ts: Date.now(), items: mapped }));
    }
  };

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    let active = true;
    const load = async () => {
      if (!active) return;
      await loadNotifications(user.id);
    };

    load();
    const timer = setInterval(load, 30000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    const channel = supabase
      .channel(`navbar-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => { load(); }
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navLinks: NavLink[] = [
    { href: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { href: "/user/shop", label: "Shop", icon: <ShoppingBag className="w-4 h-4" /> },
    { href: "/user/custom-order", label: "Custom", icon: <Scissors className="w-4 h-4" /> },
    { href: "/user/contact", label: "Contact", icon: <Phone className="w-4 h-4" /> },
  ];

  // Active discounts from Supabase (empty until discounts are created in admin)
  const [activeDiscounts, setActiveDiscounts] = useState<{code:string;label:string;percent:number;endsAt?:string}[]>([]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      await loadActiveDiscounts();
    };

    load();
    const timer = setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    const channel = supabase
      .channel("navbar-discounts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "discounts" }, () => {
        load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => {
        load();
      })
      .subscribe();

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Discount ticker */}
      {activeDiscounts.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[120]">
          <DiscountBanner discounts={activeDiscounts} />
        </div>
      )}
      {activeDiscounts.length > 0 && <div className="h-7" />}

      <header
        className={cn(
          "sticky z-[100] w-full transition-all duration-500",
          activeDiscounts.length > 0 ? "top-7" : "top-0",
          scrolled
            ? "glass-navbar shadow-navbar py-3"
            : "bg-transparent py-4"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">

            {/* ── Logo ── */}
            <Link href="/" className="flex-shrink-0 group">
              <div className="transition-transform duration-300 group-hover:scale-105">
                <CrochetLogo variant="horizontal" size={56} showText />
              </div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
              {navLinks.map((link) => (
                <AnimatedNavLink
                  key={link.href}
                  {...link}
                  active={isActive(link.href)}
                />
              ))}
            </nav>

            {/* ── Right icons ── */}
            <div className="flex items-center gap-1">
              {/* Wishlist — opens drawer */}
              <IconBtn count={wishlistCount} aria-label="Wishlist" onClick={() => setWishlistOpen(true)}>
                <Heart className={cn("w-5 h-5 transition-all duration-200",
                  wishlistCount > 0 ? "fill-blush text-blush" : "")} />
              </IconBtn>

              {/* Cart — opens drawer */}
              <IconBtn count={cartCount} aria-label="Shopping cart" onClick={() => setCartOpen(true)}>
                <ShoppingCart className="w-5 h-5" />
              </IconBtn>

              {/* Notifications */}
              <div ref={notifRef} className="relative">
                <IconBtn
                  count={unreadCount}
                  aria-label="Notifications"
                  active={notifOpen}
                  onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
                >
                  <Bell className="w-5 h-5" />
                </IconBtn>
                {notifOpen && (
                  <NotificationDropdown
                    notifications={notifications}
                    onClose={() => setNotifOpen(false)}
                    onMarkAllRead={async () => {
                      setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
                      if (user) {
                        await supabase.from("notifications").update({ is_read: true } as unknown as never).eq("user_id", user.id).eq("is_read", false);
                      }
                    }}
                  />
                )}
              </div>

              {/* Get Started / Profile */}
              <div ref={profileRef} className="relative ml-1">
                <button
                  onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl",
                    "text-xs font-sans font-semibold transition-all duration-300",
                    "btn-bubble",
                    profileOpen
                      ? "bg-caramel text-white shadow-button"
                      : "bg-gradient-to-r from-caramel to-rose text-white shadow-button hover:shadow-button-hover hover:-translate-y-0.5"
                  )}
                  aria-label={isLoggedIn ? "Account menu" : "Get started"}
                >
                  {isLoggedIn ? (
                    <>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blush to-mauve flex-shrink-0" />
                      )}
                      <span className="hidden sm:block">{displayName.split(" ")[0] || "My Account"}</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span className="hidden sm:block">Get Started</span>
                    </>
                  )}
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", profileOpen && "rotate-180")} />
                </button>
                {profileOpen && (
                  <ProfileDropdown
                    isLoggedIn={isLoggedIn}
                    avatarEmoji={avatarUrl ?? "🌸"}
                    userName={displayName}
                    onClose={() => setProfileOpen(false)}
                    onLogout={async () => { await signOut(); window.location.href = "/"; }}
                  />
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden ml-1 p-2 rounded-xl hover:bg-blush/20 text-ink-light transition-colors"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                <div className="relative w-5 h-5">
                  <Menu className={cn("absolute inset-0 w-5 h-5 transition-all duration-300", mobileOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100")} />
                  <X className={cn("absolute inset-0 w-5 h-5 transition-all duration-300", mobileOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50")} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="glass-light border-t border-blush/20 px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm font-semibold",
                  "transition-all duration-200",
                  isActive(link.href)
                    ? "bg-blush/20 text-caramel"
                    : "text-ink hover:bg-blush/10 hover:text-caramel"
                )}
              >
                <span className={cn("p-1 rounded-lg", isActive(link.href) ? "bg-blush/30 text-caramel" : "bg-cream-100 text-ink-light")}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-blush/20 grid grid-cols-2 gap-2">
              <button onClick={() => setWishlistOpen(true)}
                className="flex items-center justify-center gap-2 py-2 rounded-xl bg-blush/10 text-sm font-sans font-semibold text-ink hover:bg-blush/20 transition-colors btn-bubble">
                <Heart className="w-4 h-4 text-blush" /> Wishlist
                {wishlistCount > 0 && <span className="w-5 h-5 rounded-full bg-blush text-white text-[10px] font-bold flex items-center justify-center">{wishlistCount}</span>}
              </button>
              <button onClick={() => setCartOpen(true)}
                className="flex items-center justify-center gap-2 py-2 rounded-xl bg-cream-100 text-sm font-sans font-semibold text-ink hover:bg-blush/10 transition-colors btn-bubble">
                <ShoppingCart className="w-4 h-4 text-caramel" /> Cart
                {cartCount > 0 && <span className="w-5 h-5 rounded-full bg-caramel text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Drawers */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        onOpenCart={() => { setWishlistOpen(false); setCartOpen(true); }}
      />
    </>
  );
};

export default Navbar;
