"use client";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import React, { useState, useRef, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ShoppingCart, Star, SlidersHorizontal, X,
  ChevronDown, Tag, Sparkles, ArrowUpDown,
  Check, Grid3X3, LayoutList, Search, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/lib/ShopContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/* =============================================
   TYPES
   ============================================= */
interface Product {
  id: string; name: string; price: number; original_price?: number;
  category_name: string; category_id: string;
  stock_quantity: number;
  average_rating: number; review_count: number;
  discount_percent?: number; discount_active?: boolean;
  is_featured?: boolean; tags?: string[];
  image_url?: string; images?: string[];
}
interface Category { id: string; name: string; }
type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc" | "rating_desc";

/* =============================================
   MOCK DATA (replaced by Supabase fetch in component)
   ============================================= */
const PRODUCTS: Product[] = [];

/* =============================================
   ORDER POPUP — login aware
   ============================================= */
const OrderPopup = ({ product, onClose, isLoggedIn }: { product: Product; onClose: () => void; isLoggedIn: boolean }) => {
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryMsg, setQueryMsg] = useState("");
  const msg = encodeURIComponent(` *Order — Crochet Masterpiece*\n\n *Product:* ${product.name}\n *Price:* PKR ${product.price.toLocaleString()}\n\n_Sent from website_ `);
  const whatsappUrl = `https://wa.me/923159202186?text=${msg}`;

  const formatOrderId = (id: string) => `#${id.slice(0, 6).toUpperCase()}`;

  const createOrderAndNotify = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const activeUser = authData.user;
    if (!activeUser) throw new Error("Login required");

    const res = await fetch("/api/orders/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: activeUser.id,
        customerName: activeUser.user_metadata?.full_name ?? activeUser.user_metadata?.name ?? activeUser.email ?? "User",
        customerEmail: activeUser.email ?? "",
        customerPhone: activeUser.user_metadata?.phone ?? "",
        source: "website",
        items: [
          {
            productId: product.id,
            name: product.name,
            quantity: 1,
            unitPrice: product.price,
          },
        ],
        totalAmount: product.price,
        discountAmount: 0,
        couponCode: null,
        note: "Customer sent a website order query and continued on WhatsApp.",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Order create failed");
    }

    if (typeof data?.orderId === "string") {
      const orderId = data.orderId;
      return formatOrderId(orderId);
    }
    return null;
  };

  const sendQueryAndContinueWhatsApp = async () => {
    if (!isLoggedIn) {
      setQueryMsg("Please log in to send a query.");
      return;
    }

    setQueryLoading(true);
    setQueryMsg("");
    try {
      await createOrderAndNotify();
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setQueryMsg("Query sent and WhatsApp opened.");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send query right now. Please try again.";
      setQueryMsg(message);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleWhatsAppOnly = () => {
    if (!isLoggedIn) {
      window.alert("No query will be sent. Send Query is available only after login.");
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const alsoSendQuery = window.confirm(
      "No query will be sent to the website if you continue with WhatsApp only. If you want admin to see your order in site, click OK to send query now."
    );

    if (alsoSendQuery) {
      void sendQueryAndContinueWhatsApp();
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-dark/50 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm glass rounded-3xl border border-blush/30 shadow-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-lg font-semibold text-ink-dark">Place your order</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-blush/10 text-ink-light btn-bubble"><X className="w-4 h-4" /></button>
        </div>
        <div className="bg-cream-50/80 rounded-2xl p-3 mb-4 border border-blush/15">
          <p className="font-display text-sm font-semibold text-ink-dark">{product.name}</p>
          <p className="text-sm font-bold text-caramel">PKR {product.price.toLocaleString()}</p>
        </div>
        <div className="space-y-3">
          {/* Website query */}
          <div className={cn("rounded-2xl border p-4", isLoggedIn ? "border-blush/30 bg-blush/8" : "border-caramel/15 bg-cream-50/50")}>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blush to-mauve flex items-center justify-center text-white flex-shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                {isLoggedIn ? (
                  <>
                    <p className="text-sm font-sans font-semibold text-ink-dark">Send query to admin</p>
                    <p className="text-[11px] text-ink-light/55 mb-2">Your order will be tracked on the website.</p>
                    <button
                      onClick={() => { void sendQueryAndContinueWhatsApp(); }}
                      disabled={queryLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blush to-mauve text-white text-xs font-sans font-bold btn-bubble shadow-button disabled:opacity-70"
                    >
                      <Check className="w-3 h-3" /> Confirm & Send
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-sans font-semibold text-ink-dark">Send query via website</p>
                    <p className="text-[11px] text-ink-light/55 mb-2">
                      You&apos;re not logged in — your query will reach the admin but you won&apos;t be able to track it.
                    </p>
                    <Link href="/user/login" onClick={onClose}
                      className="text-xs font-sans font-semibold text-caramel underline decoration-blush/50 hover:text-ink transition-colors">
                      Log in to track your order →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          {queryMsg && (
            <p className={cn("text-xs font-sans", queryMsg.includes("sent") ? "text-green-600" : "text-red-500")}>{queryMsg}</p>
          )}
          {/* WhatsApp — always available */}
          <button type="button" onClick={handleWhatsAppOnly}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#25D366] text-white hover:brightness-110 transition-all btn-bubble shadow-button">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.003-1.374l-.358-.213-3.742.981.999-3.648-.235-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-sans font-bold">{isLoggedIn ? "Order via WhatsApp" : "Continue on WhatsApp"}</p>
              <p className="text-[11px] text-white/70">{isLoggedIn ? "Message pre-filled " : "No login needed"}</p>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* =============================================
   PRODUCT CARD
   ============================================= */
const ShopCard = ({ product }: { product: Product }) => {
  const { addToWishlist, removeFromWishlist, isWishlisted, addToCart, cartItems } = useShop();
  const wishlisted = isWishlisted(product.id);
  const [hover, setHover] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [showOrder, setShowOrder] = useState(false);
  const { isLoggedIn } = useAuth();
  const inCartQty = cartItems.find((i) => i.productId === product.id)?.quantity ?? 0;
  const remainingStock = Math.max(0, product.stock_quantity - inCartQty);
  const outOfStock = product.stock_quantity <= 0 || remainingStock <= 0;

  return (
    <>
      <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
        <div
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMouse({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={cn("relative rounded-3xl overflow-hidden border border-blush/20 bg-white/90 transition-all duration-300 group", hover ? "shadow-[0_16px_40px_rgba(74,55,40,0.15)] -translate-y-1.5" : "shadow-card")}
        >
          {/* Cursor glow */}
          {hover && <div className="absolute inset-0 pointer-events-none z-0 rounded-3xl" style={{ background: `radial-gradient(200px circle at ${mouse.x}px ${mouse.y}px, rgba(244,184,193,0.18), transparent 55%)` }} />}

          {/* Product image area — heart OUTSIDE overflow-hidden and Link */}
          <div className="relative h-52">
            {/* Textured BG — overflow clipped inside this nested div only */}
            <div className="absolute inset-0 overflow-hidden rounded-t-3xl">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <img src="/images/crochet-1.jpg" alt="" aria-hidden="true" className="w-full h-full object-cover opacity-[0.35]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-cream-50/95 via-blush/10 to-cream-100/90" />
            </div>

            {/* Clickable link — z-10 */}
            <Link href={`/user/shop/${product.id}`} className="absolute inset-0 z-10" aria-label={product.name} />

            {/* Initial circle — pointer-events-none */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className={cn(
                "w-16 h-16 rounded-full bg-gradient-to-br from-blush/30 to-mauve/20 border-2 border-blush/20",
                "flex items-center justify-center shadow-soft",
                "transition-transform duration-300 group-hover:scale-110"
              )}>
                <span className="font-display text-2xl font-semibold text-caramel/80">{product.name.charAt(0)}</span>
              </div>
              <p className="text-xs font-sans font-semibold text-ink-light/40 tracking-wider uppercase">{product.category_name}</p>
            </div>

            {/* Badges — z-20, no pointer events */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-20 pointer-events-none">
              {product.discount_active && product.discount_percent && (
                <span className="bg-gradient-to-r from-caramel to-rose text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-button">-{product.discount_percent}%</span>
              )}
              {outOfStock && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">Out of stock</span>
              )}
              {product.is_featured && (
                <span className="bg-gradient-to-r from-mauve to-blush text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Featured
                </span>
              )}
            </div>

            {/* HEART BUTTON — z-30 beats link at z-10 */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (wishlisted) removeFromWishlist(product.id);
                else addToWishlist({ productId: product.id, name: product.name, price: product.price, original_price: product.original_price, category: product.category_name, category_id: product.category_id, average_rating: product.average_rating, review_count: product.review_count, discount_percent: product.discount_percent, is_featured: product.is_featured, emoji: "" });
              }}
              className={cn(
                "absolute top-3 right-3 z-30",
                "w-9 h-9 rounded-2xl flex items-center justify-center",
                "transition-all duration-300 border-2 shadow-soft",
                wishlisted
                  ? "bg-blush border-blush shadow-[0_0_12px_rgba(244,184,193,0.6)] scale-110"
                  : "bg-white/95 border-white/80 hover:border-blush/60 hover:scale-110 hover:bg-blush/10"
              )}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("w-4 h-4 transition-all duration-200", wishlisted ? "fill-white text-white" : "text-rose/60")} />
            </button>
          </div>

          {/* Info */}
          <div className="p-4 relative z-10">
            <p className="text-[10px] font-sans font-semibold text-ink-light/50 uppercase tracking-wider mb-0.5">{product.category_name}</p>
            <Link href={`/user/shop/${product.id}`}>
              <h3 className="font-display text-sm font-semibold text-ink-dark mb-1.5 hover:text-caramel transition-colors line-clamp-1">{product.name}</h3>
            </Link>
            {product.tags && product.tags.length > 0 && (
              <div className="flex gap-1 mb-2">
                {product.tags.slice(0, 2).map((t) => <span key={t} className="text-[9px] bg-blush/12 text-caramel font-sans font-semibold px-1.5 py-0.5 rounded-md">#{t}</span>)}
              </div>
            )}
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map((i) => <Star key={i} className={cn("w-3 h-3", i <= Math.round(product.average_rating) ? "fill-caramel text-caramel" : "text-caramel/15")} />)}
              <span className="text-[10px] text-ink-light/45 ml-1">({product.review_count})</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-base font-bold font-sans text-ink-dark">PKR {product.price.toLocaleString()}</span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-xs text-ink-light/35 line-through ml-1.5">PKR {product.original_price.toLocaleString()}</span>
                )}
              </div>
              <div className="flex gap-1.5">
                <button
                  disabled={outOfStock}
                  onClick={(e) => {
                    e.preventDefault();
                    if (outOfStock) return;
                    addToCart({ productId: product.id, name: product.name, price: product.price, original_price: product.original_price, category: product.category_name, category_id: product.category_id, emoji: "" });
                  }}
                  className={cn("p-1.5 rounded-xl border transition-all btn-bubble", outOfStock ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed" : "bg-cream-100 border-caramel/20 text-caramel hover:bg-caramel/10")}
                  title="Add to cart"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={outOfStock}
                  onClick={(e) => { e.preventDefault(); if (!outOfStock) setShowOrder(true); }}
                  className={cn("flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all btn-bubble",
                    outOfStock ? "bg-red-100 text-red-500 border border-red-200 cursor-not-allowed" : "bg-gradient-to-r from-caramel to-rose text-white shadow-button hover:shadow-button-hover hover:-translate-y-0.5")}
                >
                  {outOfStock ? "Sold out" : "Buy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showOrder && <OrderPopup product={product} onClose={() => setShowOrder(false)} isLoggedIn={isLoggedIn} />}
      </AnimatePresence>
    </>
  );
};

/* =============================================
   FILTER PANEL
   ============================================= */
const FilterPanel = ({
  categories, selectedCategory, onCategory,
  priceRange, onPriceRange,
  showFeatured, onFeatured,
  showDiscounted, onDiscounted,
  onClear,
}: {
  categories: Category[];
  selectedCategory: string; onCategory: (id: string) => void;
  priceRange: [number, number]; onPriceRange: (r: [number, number]) => void;
  showFeatured: boolean; onFeatured: (v: boolean) => void;
  showDiscounted: boolean; onDiscounted: (v: boolean) => void;
  onClear: () => void;
}) => {
  const MAX = 10000;
  const [showAll, setShowAll] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink-dark flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-caramel" /> Filters</h3>
        <button onClick={onClear} className="text-xs text-caramel font-sans font-semibold hover:text-ink transition-colors">Clear</button>
      </div>
      {/* Special */}
      <div className="space-y-2">
        <p className="text-[10px] font-sans font-semibold text-ink-light/55 uppercase tracking-widest">Special</p>
        {[
          { label: "Featured", icon: <Sparkles className="w-3 h-3" />, value: showFeatured, toggle: onFeatured },
          { label: "On Sale", icon: <Tag className="w-3 h-3" />, value: showDiscounted, toggle: onDiscounted },
        ].map((f) => (
          <button key={f.label} onClick={() => f.toggle(!f.value)}
            className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-sans font-semibold transition-all btn-bubble",
              f.value ? "bg-caramel/10 border-caramel/30 text-caramel" : "border-caramel/15 bg-white/60 text-ink-light hover:border-blush/40")}>
            <div className={cn("w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all", f.value ? "bg-gradient-to-br from-caramel to-rose border-transparent" : "border-caramel/25")}>
              {f.value && <Check className="w-3 h-3 text-white" />}
            </div>
            {f.icon} {f.label}
          </button>
        ))}
      </div>
      {/* Categories */}
      <div className="space-y-1">
        <p className="text-[10px] font-sans font-semibold text-ink-light/55 uppercase tracking-widest">Category</p>
        <button onClick={() => onCategory("")} className={cn("w-full text-left px-3 py-2 rounded-xl text-xs font-sans transition-all", !selectedCategory ? "bg-caramel/12 font-semibold text-caramel" : "text-ink hover:bg-blush/8")}>All</button>
        {(showAll ? categories : categories.slice(0, 3)).map((c) => (
          <button key={c.id} onClick={() => onCategory(c.id)} className={cn("w-full text-left px-3 py-2 rounded-xl text-xs font-sans transition-all", selectedCategory === c.id ? "bg-caramel/12 font-semibold text-caramel" : "text-ink hover:bg-blush/8")}>{c.name}</button>
        ))}
        {categories.length > 3 && (
          <button onClick={() => setShowAll(!showAll)} className="w-full text-left px-3 py-1.5 text-[10px] font-sans font-semibold text-caramel hover:text-ink transition-colors btn-bubble">
            {showAll ? "Show less ▲" : `+${categories.length - 3} more ▼`}
          </button>
        )}
      </div>
      {/* Price — clamped to prevent negative or invalid values */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-sans font-semibold text-ink-light/55 uppercase tracking-widest">Price Range</p>
        <div className="flex gap-2 text-[11px] font-sans font-semibold text-caramel">
          <span>PKR {priceRange[0].toLocaleString()}</span><span className="text-ink-light/30">—</span><span>PKR {priceRange[1].toLocaleString()}</span>
        </div>
        <input type="range" min={0} max={MAX} step={100} value={priceRange[0]}
          onChange={(e) => { const v = Math.max(0, Math.min(Number(e.target.value), priceRange[1] - 100)); onPriceRange([v, priceRange[1]]); }}
          className="w-full cursor-pointer" style={{ accentColor: "#C8956C" }} />
        <input type="range" min={0} max={MAX} step={100} value={priceRange[1]}
          onChange={(e) => { const v = Math.max(priceRange[0] + 100, Math.min(Number(e.target.value), MAX)); onPriceRange([priceRange[0], v]); }}
          className="w-full cursor-pointer" style={{ accentColor: "#F4B8C1" }} />
        <div className="flex gap-1.5">
          {[1000, 3000, 5000].map((v) => (
            <button key={v} onClick={() => onPriceRange([0, v])} className="flex-1 py-1 rounded-lg text-[10px] font-sans font-semibold border border-caramel/20 text-ink-light hover:border-caramel/50 hover:text-caramel transition-all btn-bubble">
              ≤{v / 1000}K
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =============================================
   SORT DROPDOWN
   ============================================= */
const SortDropdown = ({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const opts: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price ↑" },
    { value: "price_desc", label: "Price ↓" },
    { value: "name_asc", label: "A → Z" },
    { value: "name_desc", label: "Z → A" },
    { value: "rating_desc", label: "Top Rated" },
  ];
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-caramel/20 bg-white/80 text-sm font-sans font-semibold text-ink hover:border-blush/50 transition-all btn-bubble">
        <ArrowUpDown className="w-3.5 h-3.5 text-caramel" />
        <span className="hidden sm:block">{opts.find((o) => o.value === value)?.label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-ink-light/50 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-40 glass rounded-2xl shadow-card border border-blush/25 overflow-hidden z-30">
            {opts.map((o) => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                className={cn("w-full flex items-center justify-between px-3 py-2 text-sm font-sans hover:bg-blush/10 transition-colors", o.value === value ? "text-caramel font-semibold" : "text-ink")}>
                {o.label} {o.value === value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* =============================================
   SHOP CONTENT
   ============================================= */
function ShopContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [cat, setCat] = useState(searchParams.get("category") ?? "");
  const [price, setPrice] = useState<[number, number]>([0, 10000]);
  const [featured, setFeatured] = useState(searchParams.get("filter") === "featured");
  const [discounted, setDiscounted] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [grid, setGrid] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [shopLoading, setShopLoading] = useState(true);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    setCat(searchParams.get("category") ?? "");
    setFeatured(searchParams.get("filter") === "featured");
  }, [searchParams]);

  const loadCategories = React.useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order");
    if (data) setCats(data as Category[]);
  }, []);

  const loadProducts = React.useCallback(async () => {
    const { data } = await supabase
      .from("product_listing")
      .select("id, name, description, price, original_price, category_name, category_id, stock_quantity, is_featured, average_rating, review_count, tags, active_discount_percent, discount_active, image_url, images");

    if (data) {
      const mapped = (data as (Product & { active_discount_percent?: number; stock_quantity?: number })[]).map((p) => ({
        ...p,
        category_id: p.category_id ?? "",
        stock_quantity: p.stock_quantity ?? 0,
        category_name: (p.category_name ?? "").trim() || "Uncategorised",
        average_rating: p.average_rating ?? 0,
        review_count: p.review_count ?? 0,
        discount_percent: p.discount_percent ?? p.active_discount_percent,
      }));

      const productIds = mapped.map((p) => p.id);
      if (productIds.length === 0) {
        setProducts(mapped);
        setShopLoading(false);
        return;
      }

      const { data: reviewRows } = await supabase
        .from("reviews")
        .select("product_id, rating")
        .in("product_id", productIds);

      if (!reviewRows) {
        setProducts(mapped);
        setShopLoading(false);
        return;
      }

      const stats = new Map<string, { sum: number; count: number }>();
      for (const row of reviewRows as Array<{ product_id: string; rating: number }>) {
        const current = stats.get(row.product_id) ?? { sum: 0, count: 0 };
        stats.set(row.product_id, {
          sum: current.sum + (Number(row.rating) || 0),
          count: current.count + 1,
        });
      }

      setProducts(
        mapped.map((p) => {
          const stat = stats.get(p.id);
          if (!stat || stat.count === 0) return p;
          return {
            ...p,
            average_rating: Number((stat.sum / stat.count).toFixed(1)),
            review_count: stat.count,
          };
        })
      );
    }
    setShopLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  useEffect(() => {
    const refresh = () => {
      loadCategories();
      loadProducts();
    };

    const timer = setInterval(refresh, 60000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadCategories, loadProducts]);

  const selectedCategory = cats.find((c) => c.id === cat)
    ?? cats.find((c) => c.name.toLowerCase() === cat.toLowerCase());

  const results = products.filter((p) => {
    if (query) {
      const q = query.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.category_name.toLowerCase().includes(q) && !(p.tags ?? []).some((t) => t.toLowerCase().includes(q))) return false;
    }
    if (cat) {
      const normalized = cat.toLowerCase();
      const productCategoryId = (p.category_id ?? "").trim();
      const productCategoryName = (p.category_name ?? "").trim().toLowerCase();
      const matchesId = productCategoryId === cat;
      const matchesName = productCategoryName === normalized;
      const matchesSelected = selectedCategory ? productCategoryId === selectedCategory.id : false;
      if (!matchesId && !matchesName && !matchesSelected) return false;
    }
    if (p.price < price[0] || p.price > price[1]) return false;
    if (featured && !p.is_featured) return false;
    if (discounted && !p.discount_active) return false;
    return true;
  }).sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "name_asc") return a.name.localeCompare(b.name);
    if (sort === "name_desc") return b.name.localeCompare(a.name);
    if (sort === "rating_desc") return b.average_rating - a.average_rating;
    return 0;
  });

  const clear = () => { setCat(""); setPrice([0, 10000]); setFeatured(false); setDiscounted(false); };
  const activeCount = [!!cat, featured, discounted, price[0] > 0 || price[1] < 10000].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <div className="relative pt-20 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Real crochet photo backgrounds */}
        <div className="absolute inset-0 pointer-events-none">
          <img src="/images/crochet-6.jpg" alt="" aria-hidden="true" className="absolute top-0 right-0 w-2/5 h-full object-cover opacity-[0.18]" />
          <img src="/images/crochet-2.jpg" alt="" aria-hidden="true" className="absolute top-0 left-0 w-1/3 h-full object-cover opacity-[0.12]" />
          <div className="absolute inset-0 bg-gradient-to-br from-cream-100/90 via-cream-100/80 to-cream-100/90" />
        </div>
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl sm:text-4xl font-semibold text-ink-dark mb-5">Our Shop</motion.h1>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-caramel/50 z-10" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, categories, tags..."
                className="w-full h-12 pl-11 pr-10 rounded-2xl border border-caramel/20 bg-white/90 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none focus:border-blush focus:shadow-[0_0_0_3px_rgba(244,184,193,0.2)] transition-all" />
              {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-ink-light/40 hover:text-caramel transition-colors"><X className="w-4 h-4" /></button>}
            </div>
          </motion.div>
          <AnimatePresence>
            {(featured || discounted || cat) && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap justify-center gap-2 mt-4">
                {featured && <span className="flex items-center gap-1.5 bg-mauve/15 border border-mauve/25 text-mauve px-3 py-1 rounded-full text-xs font-sans font-semibold"><Sparkles className="w-3 h-3" /> Featured <button onClick={() => setFeatured(false)}><X className="w-3 h-3" /></button></span>}
                {discounted && <span className="flex items-center gap-1.5 bg-caramel/12 border border-caramel/25 text-caramel px-3 py-1 rounded-full text-xs font-sans font-semibold"><Tag className="w-3 h-3" /> On Sale <button onClick={() => setDiscounted(false)}><X className="w-3 h-3" /></button></span>}
                {cat && <span className="flex items-center gap-1.5 bg-blush/15 border border-blush/30 text-caramel px-3 py-1 rounded-full text-xs font-sans font-semibold">{selectedCategory?.name ?? cat} <button onClick={() => setCat("")}><X className="w-3 h-3" /></button></span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-28 glass rounded-3xl border border-blush/25 p-5">
              <FilterPanel categories={cats} selectedCategory={cat} onCategory={setCat} priceRange={price} onPriceRange={setPrice} showFeatured={featured} onFeatured={setFeatured} showDiscounted={discounted} onDiscounted={setDiscounted} onClear={clear} />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <p className="text-sm text-ink-light/70 font-sans"><span className="font-semibold text-ink">{results.length}</span> products{query && <> for <span className="text-caramel font-semibold">&ldquo;{query}&rdquo;</span></>}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setFilterOpen(true)} className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-caramel/20 bg-white/80 text-sm font-sans font-semibold text-ink btn-bubble">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-caramel" /> Filters
                  {activeCount > 0 && <span className="w-5 h-5 rounded-full bg-gradient-to-br from-caramel to-rose text-white text-[10px] font-bold flex items-center justify-center">{activeCount}</span>}
                </button>
                <SortDropdown value={sort} onChange={setSort} />
                <div className="flex border border-caramel/20 rounded-xl overflow-hidden">
                  <button onClick={() => setGrid(true)} className={cn("p-2 transition-all", grid ? "bg-caramel/15 text-caramel" : "bg-white/60 text-ink-light")}><Grid3X3 className="w-4 h-4" /></button>
                  <button onClick={() => setGrid(false)} className={cn("p-2 transition-all", !grid ? "bg-caramel/15 text-caramel" : "bg-white/60 text-ink-light")}><LayoutList className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {results.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 text-center gap-4">
                  <div className="text-6xl"></div>
                  <p className="font-display text-xl text-ink-dark">No products found</p>
                  <button onClick={() => { setQuery(""); clear(); }} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-caramel to-rose text-white text-sm font-sans font-bold btn-bubble shadow-button">Clear filters</button>
                </motion.div>
              ) : (
                <motion.div key="grid" layout className={cn("grid gap-5", grid ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
                  {results.map((p) => <ShopCard key={p.id} product={p} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFilterOpen(false)} className="fixed inset-0 bg-ink-dark/40 z-40 backdrop-blur-sm" />
            <motion.div key="dr" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed top-0 left-0 bottom-0 w-72 glass z-50 p-6 overflow-y-auto border-r border-blush/25">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-semibold text-ink-dark">Filters</h2>
                <button onClick={() => setFilterOpen(false)} className="p-2 rounded-xl hover:bg-blush/10 text-ink-light"><X className="w-5 h-5" /></button>
              </div>
              <FilterPanel categories={cats} selectedCategory={cat} onCategory={(id) => { setCat(id); setFilterOpen(false); }} priceRange={price} onPriceRange={setPrice} showFeatured={featured} onFeatured={setFeatured} showDiscounted={discounted} onDiscounted={setDiscounted} onClear={clear} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-100 flex items-center justify-center"><div className="text-5xl animate-float"></div></div>}>
      <ShopContent />
    </Suspense>
  );
}
