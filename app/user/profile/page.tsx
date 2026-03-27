"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Package, Heart, Bell, LogOut, Edit2, Save, X, ShoppingBag, Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { signOut, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { getHiddenReviewIdSet, isReviewHiddenByModeration } from "@/lib/reviewModeration";

/* =============================================
   AVATAR STYLES — DiceBear
   ============================================= */
const AVATAR_STYLES = [
  { id: "lorelei",   label: "Lorelei",   preview: "lorelei" },
  { id: "micah",     label: "Micah",     preview: "micah" },
  { id: "bottts",    label: "Bottts",    preview: "bottts" },
  { id: "avataaars", label: "Avatars",   preview: "avataaars" },
];

function dicebearUrl(seed: string, style: string) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffd5dc,ffdfbf,d1d4f9,c0aede&radius=50`;
}

/* =============================================
   REDIRECT IF NOT LOGGED IN
   ============================================= */
function useRequireAuth() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) window.location.href = "/user/login";
  }, [user, loading]);
  return { user, loading };
}

/* =============================================
   ORDER HISTORY (mock — replace with Supabase)
   ============================================= */
// Orders fetched from Supabase in the component below
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  confirmed: "bg-blue-50 text-blue-600 border-blue-200",
  shipped: "bg-purple-50 text-purple-600 border-purple-200",
  delivered: "bg-green-50 text-green-600 border-green-200",
  cancelled: "bg-red-50 text-red-400 border-red-200",
};

/* =============================================
   PROFILE PAGE
   ============================================= */
export default function UserProfilePage() {
  const { user, loading } = useRequireAuth();
  const [tab, setTab] = useState<"profile" | "orders" | "reviews" | "avatar">("profile");
  const [orders, setOrders] = useState<{id:string;product:string;total:number;status:string;date:string}[]>([]);
  const [reviews, setReviews] = useState<Array<{
    id: string;
    product_id: string;
    product_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }>>([]);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Fetch user's orders from Supabase
  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadOrders = async () => {
      const { data } = await supabase
        .from("order_summary")
        .select("id, items_json, total_amount, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!active || !data) return;
      setOrders(data.map((o:{id:string;items_json:{name:string}[]|null;total_amount:number;status:string;created_at:string}) => ({
        id: "#" + o.id.slice(0, 6).toUpperCase(),
        product: o.items_json?.map((i:{name:string}) => i.name).join(", ") ?? "Order",
        total: o.total_amount,
        status: o.status,
        date: new Date(o.created_at).toISOString().split("T")[0],
      })));
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
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadMyReviews = async () => {
      const hiddenReviewIds = await getHiddenReviewIdSet();

      let rows: Array<{
        id: string;
        product_id: string;
        rating: number;
        comment: string;
        admin_reply?: string | null;
        created_at: string;
      }> = [];

      const withModeration = await supabase
        .from("reviews")
        .select("id, product_id, rating, comment, admin_reply, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!withModeration.error && withModeration.data) {
        rows = withModeration.data as typeof rows;
      } else {
        const legacy = await supabase
          .from("reviews")
          .select("id, product_id, rating, comment, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (legacy.data) {
          rows = (legacy.data as Array<{ id: string; product_id: string; rating: number; comment: string; created_at: string }>).map((r) => ({
            ...r,
            admin_reply: null,
          }));
        }
      }

      rows = rows.filter((r) => !isReviewHiddenByModeration(r.id, r.admin_reply, hiddenReviewIds));

      const productIds = Array.from(new Set(rows.map((r) => r.product_id)));
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      const productMap = new Map<string, string>(
        ((products ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name])
      );

      setReviews(
        rows.map((r) => ({
          id: r.id,
          product_id: r.product_id,
          product_name: productMap.get(r.product_id) ?? "Product",
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
        }))
      );
    };

    void loadMyReviews();
  }, [user]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState("lorelei");

  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "",
        phone: user.user_metadata?.phone ?? "",
        address: user.user_metadata?.address ?? "",
      });
      // Load user's chosen avatar style from DB
      supabase.from("users").select("avatar_url").eq("id", user.id).single().then(({ data }) => {
        const row = data as { avatar_url?: string | null } | null;
        if (row?.avatar_url?.includes("dicebear")) {
          const match = row.avatar_url.match(/7\.x\/([^/]+)\//);
          if (match) setAvatarStyle(match[1]);
        }
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { name: form.name, phone: form.phone, address: form.address },
    });
    if (!error) {
      await supabase.from("users").update({
        name: form.name, phone: form.phone || null, address: form.address || null,
      } as unknown as never).eq("id", user.id);
      localStorage.setItem("cm_user_name", form.name);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleSaveAvatar = async () => {
    if (!user) return;
    setSaving(true);
    const avatarUrl = dicebearUrl(user.email ?? user.id, avatarStyle);
    await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
    await supabase.from("users").update({ avatar_url: avatarUrl } as unknown as never).eq("id", user.id);
    localStorage.setItem("cm_user_avatar", avatarUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/user/login";
  };

  const deleteMyReview = async (reviewId: string) => {
    if (!user) return;
    const ok = window.confirm("Delete this review?");
    if (!ok) return;

    setDeletingReviewId(reviewId);
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (!error) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blush/35 to-mauve/25 animate-pulse" />
      </div>
    );
  }

  const displayName = form.name || user.email?.split("@")[0] || "User";
  const avatarUrl = dicebearUrl(user.email ?? user.id, avatarStyle);
  const googleAvatar = user.user_metadata?.avatar_url && !user.user_metadata.avatar_url.includes("dicebear")
    ? user.user_metadata.avatar_url : null;

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="glass rounded-3xl border border-blush/20 p-6 mb-6 flex items-center gap-5 relative overflow-hidden">
          {/* BG texture */}
          <img src="/images/bg-crochet-pink.jpg" alt="" aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-[0.05] pointer-events-none" />

          {/* Avatar */}
          <div className="relative flex-shrink-0 z-10">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-blush/30 shadow-card">
              <img src={googleAvatar ?? avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            </div>
            <button onClick={() => setTab("avatar")}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-gradient-to-br from-caramel to-rose flex items-center justify-center shadow-button hover:scale-110 transition-transform btn-bubble">
              <Edit2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 z-10">
            <h1 className="font-display text-xl font-semibold text-ink-dark">{displayName}</h1>
            <p className="text-sm text-ink-light/55 font-sans truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-sans font-bold text-white bg-gradient-to-r from-caramel to-rose px-2.5 py-1 rounded-lg tracking-wide shadow-button">Member</span>
              {user.app_metadata?.provider === "google" && (
                <span className="text-[10px] font-sans font-semibold text-ink-light/55 bg-cream-100 px-2 py-0.5 rounded-lg border border-caramel/15">via Google</span>
              )}
            </div>
          </div>

          {/* Sign out */}
          <button onClick={handleSignOut}
            className="z-10 flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200/60 text-red-400 text-xs font-sans font-semibold hover:bg-red-50 transition-all btn-bubble flex-shrink-0">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["profile", "orders", "reviews", "avatar"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-5 py-2 rounded-xl text-xs font-sans font-semibold capitalize transition-all btn-bubble border",
                tab === t ? "bg-gradient-to-r from-caramel to-rose text-white border-transparent shadow-button"
                  : "border-caramel/20 text-ink-light/65 hover:border-caramel/40 bg-white/70")}>
              {t === "avatar" ? "My Avatar" : t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-blush/20 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink-dark">Account Details</h2>
              <div className="flex items-center gap-2">
                {saved && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-[11px] text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-xl border border-green-200">
                    <Check className="w-3 h-3" /> Saved
                  </motion.span>
                )}
                <button onClick={() => setEditing(!editing)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-sans font-semibold transition-all btn-bubble",
                    editing ? "border-red-200 text-red-400 hover:bg-red-50" : "border-caramel/25 text-caramel hover:bg-caramel/8")}>
                  {editing ? <><X className="w-3 h-3" /> Cancel</> : <><Edit2 className="w-3 h-3" /> Edit</>}
                </button>
              </div>
            </div>

            {[
              { label: "Full Name",     icon: <User className="w-4 h-4" />,     key: "name",    placeholder: "Your name" },
              { label: "Phone",         icon: <Phone className="w-4 h-4" />,    key: "phone",   placeholder: "+92 300 1234567" },
              { label: "Address",       icon: <MapPin className="w-4 h-4" />,   key: "address", placeholder: "Your delivery address" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-[10px] font-sans font-bold text-ink-light/55 uppercase tracking-widest mb-1.5">
                  {field.label}
                </label>
                {editing ? (
                  <div className="flex items-center rounded-2xl border border-caramel/20 bg-cream-50/80 focus-within:border-caramel focus-within:shadow-[0_0_0_3px_rgba(200,149,108,0.15)] transition-all">
                    <span className="text-caramel/50 pl-3.5">{field.icon}</span>
                    <input value={form[field.key as keyof typeof form]}
                      onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="flex-1 bg-transparent px-3 py-3 text-sm font-sans text-ink placeholder:text-ink-light/35 outline-none" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-cream-50/60 border border-caramel/10">
                    <span className="text-caramel/50">{field.icon}</span>
                    <span className={cn("text-sm font-sans", form[field.key as keyof typeof form] ? "text-ink" : "text-ink-light/35 italic")}>
                      {form[field.key as keyof typeof form] || `No ${field.label.toLowerCase()} added`}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Email (non-editable) */}
            <div>
              <label className="block text-[10px] font-sans font-bold text-ink-light/55 uppercase tracking-widest mb-1.5">Email</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-cream-50/40 border border-caramel/10">
                <Mail className="w-4 h-4 text-caramel/40" />
                <span className="text-sm font-sans text-ink-light/60">{user.email}</span>
                <span className="ml-auto text-[10px] text-ink-light/35 font-sans">(cannot change)</span>
              </div>
            </div>

            {editing && (
              <button onClick={handleSaveProfile} disabled={saving}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-caramel to-rose text-white text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble flex items-center justify-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
              </button>
            )}
          </motion.div>
        )}

        {tab === "orders" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-blush/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-blush/15">
              <h2 className="font-display text-base font-semibold text-ink-dark">Order History</h2>
              <p className="text-xs text-ink-light/50 font-sans mt-0.5">Your past and current orders</p>
            </div>
            <div className="divide-y divide-blush/10">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 px-6 py-4 hover:bg-caramel/4 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blush/30 to-mauve/20 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-caramel" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-sans font-bold text-caramel">{order.id}</span>
                      <span className={cn("text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border", STATUS_COLORS[order.status])}>{order.status}</span>
                    </div>
                    <p className="text-sm font-sans font-semibold text-ink-dark truncate">{order.product}</p>
                    <p className="text-[10px] text-ink-light/45 font-sans">{order.date}</p>
                  </div>
                  <span className="text-sm font-bold font-sans text-ink-dark flex-shrink-0">PKR {order.total.toLocaleString()}</span>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                  <Package className="w-8 h-8 text-caramel/30" />
                  <p className="font-display text-base text-ink-dark">No orders yet</p>
                  <Link href="/user/shop" className="text-sm text-caramel font-sans font-semibold hover:text-ink transition-colors">Browse our shop →</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === "reviews" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-blush/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-blush/15">
              <h2 className="font-display text-base font-semibold text-ink-dark">My Reviews</h2>
              <p className="text-xs text-ink-light/50 font-sans mt-0.5">All reviews you posted</p>
            </div>
            <div className="divide-y divide-blush/10">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="px-6 py-4 hover:bg-caramel/4 transition-colors cursor-pointer"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("button, a")) return;
                    window.location.href = `/user/shop/${r.product_id}?review=${r.id}&mine=1#review-${r.id}`;
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/user/shop/${r.product_id}?review=${r.id}&mine=1#review-${r.id}`} className="text-sm font-sans font-semibold text-caramel hover:text-ink transition-colors">
                        {r.product_name}
                      </Link>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map((i) => <Star key={i} className={cn("w-3 h-3", i <= r.rating ? "fill-caramel text-caramel" : "text-caramel/15")} />)}
                      </div>
                      <p className="text-sm text-ink-light/75 font-sans mt-2">{r.comment}</p>
                      <p className="text-[10px] text-ink-light/45 font-sans mt-1">
                        {new Date(r.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteMyReview(r.id);
                      }}
                      disabled={deletingReviewId === r.id}
                      className="px-3 py-1.5 rounded-xl border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 text-xs font-sans font-bold transition-all btn-bubble disabled:opacity-60"
                    >
                      {deletingReviewId === r.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                  <Star className="w-8 h-8 text-caramel/30" />
                  <p className="font-display text-base text-ink-dark">No reviews yet</p>
                  <Link href="/user/shop" className="text-sm text-caramel font-sans font-semibold hover:text-ink transition-colors">Review a product →</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === "avatar" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-blush/20 p-6 space-y-5">
            <div>
              <h2 className="font-display text-base font-semibold text-ink-dark mb-1">Choose Your Avatar</h2>
              <p className="text-xs text-ink-light/50 font-sans">Pick a style — your avatar is generated from your email</p>
            </div>

            {/* Current avatar preview */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-caramel/25 shadow-card">
                <img src={dicebearUrl(user.email ?? user.id, avatarStyle)} alt="Your avatar" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Style grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AVATAR_STYLES.map((style) => (
                <button key={style.id} onClick={() => setAvatarStyle(style.id)}
                  className={cn("relative rounded-2xl p-3 flex flex-col items-center gap-2 border transition-all btn-bubble",
                    avatarStyle === style.id
                      ? "border-caramel/50 bg-caramel/10 shadow-button"
                      : "border-caramel/15 bg-white/60 hover:border-caramel/35")}>
                  <div className="w-14 h-14 rounded-xl overflow-hidden">
                    <img src={dicebearUrl(user.email ?? user.id, style.id)} alt={style.label} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-ink-dark">{style.label}</span>
                  {avatarStyle === style.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-caramel flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button onClick={handleSaveAvatar} disabled={saving}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-caramel to-rose text-white text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble flex items-center justify-center gap-2 disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : saved ? "Saved!" : "Save Avatar"}
            </button>

            {googleAvatar && (
              <p className="text-[11px] text-center text-ink-light/45 font-sans">
                You signed in with Google — your Google profile photo is used by default. Saving a style here will override it.
              </p>
            )}
          </motion.div>
        )}

        {/* Quick nav */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { href: "/user/shop",          icon: <ShoppingBag className="w-4 h-4" />, label: "Browse Shop" },
            { href: "/user/notifications",  icon: <Bell className="w-4 h-4" />,        label: "Notifications" },
            { href: "/user/custom-order",   icon: <Star className="w-4 h-4" />,        label: "Custom Order" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl glass border border-blush/15 hover:border-caramel/35 hover:-translate-y-0.5 transition-all btn-bubble group">
              <span className="text-caramel/70 group-hover:text-caramel transition-colors">{item.icon}</span>
              <span className="text-[11px] font-sans font-semibold text-ink-light/65 group-hover:text-ink transition-colors">{item.label}</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
