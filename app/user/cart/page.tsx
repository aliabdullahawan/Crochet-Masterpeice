"use client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

import React, { useEffect, useMemo, useState } from "react";
import { useShop } from "@/lib/ShopContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/* =============================================
   TYPES
   ============================================= */
interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  category_id?: string;
  stock_quantity?: number;
  quantity: number;
  emoji: string;
}

const formatOrderId = (id: string) => `#${id.slice(0, 6).toUpperCase()}`;

const isCouponApplicableToItem = (item: CartItem, coupon: { appliesTo: "all" | "product" | "category" | "cart"; targetId?: string | null } | null) => {
  if (!coupon) return false;
  if (coupon.appliesTo === "all") return true;
  if (coupon.appliesTo === "cart") return true;
  if (coupon.appliesTo === "product") return coupon.targetId === item.productId;
  if (coupon.appliesTo === "category") return !!item.category_id && coupon.targetId === item.category_id;
  return false;
};

/* =============================================
   MOCK CART — replace with Supabase + local state
   ============================================= */
const INITIAL_CART: CartItem[] = []; // Cart loaded from ShopContext (localStorage/Supabase)

/* =============================================
   EMPTY STATE
   ============================================= */
const EmptyCart = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center gap-5">
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blush/20 to-mauve/15 flex items-center justify-center text-5xl animate-float">
      
    </div>
    <div>
      <h3 className="font-display text-xl font-semibold text-ink-dark mb-2">Your cart is empty</h3>
      <p className="text-sm text-ink-light/60 font-sans">Haven&apos;t found something you love yet? Let&apos;s fix that.</p>
    </div>
    <Link href="/user/shop"
      className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-caramel to-rose text-white text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble">
      <ShoppingBag className="w-4 h-4" /> Browse the shop
    </Link>
  </motion.div>
);

/* =============================================
   CART ITEM ROW
   ============================================= */
const CartRow = ({
  item, onQty, onRemove, lineDiscount,
}: { item: CartItem; onQty: (id: string, q: number) => void; onRemove: (id: string) => void; lineDiscount: number }) => (
  (() => {
    const maxQty = item.stock_quantity ?? Infinity;
    const outOfStock = maxQty <= 0;
    const atMax = item.quantity >= maxQty;
    const lineSubtotal = item.price * item.quantity;
    const discountedLineTotal = Math.max(0, lineSubtotal - lineDiscount);
    const discountedUnitPrice = discountedLineTotal / item.quantity;
    return (
  <motion.div
    layout
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
    transition={{ duration: 0.3 }}
    className="flex gap-4 p-4 rounded-2xl glass border border-blush/20 hover:border-blush/35 transition-all duration-200 group"
  >
    {/* Product image placeholder */}
    <Link href={`/user/shop/${item.productId}`}
      className="w-20 h-20 rounded-xl bg-gradient-to-br from-cream-100 to-blush/15 flex items-center justify-center text-3xl flex-shrink-0 hover:scale-105 transition-transform duration-200">
      {item.emoji}
    </Link>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-sans font-semibold text-ink-light/50 uppercase tracking-wider mb-0.5">{item.category}</p>
      <Link href={`/user/shop/${item.productId}`}
        className="font-display text-sm font-semibold text-ink-dark hover:text-caramel transition-colors line-clamp-1">
        {item.name}
      </Link>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-bold font-sans text-ink-dark">
          PKR {lineDiscount > 0 ? Math.round(discountedUnitPrice).toLocaleString() : item.price.toLocaleString()}
        </span>
        {lineDiscount > 0 && (
          <span className="text-xs text-ink-light/35 line-through">PKR {item.price.toLocaleString()}</span>
        )}
        {item.original_price && item.original_price > item.price && (
          <span className="text-xs text-ink-light/35 line-through">PKR {item.original_price.toLocaleString()}</span>
        )}
      </div>
        {outOfStock && <p className="text-[11px] text-red-500 font-sans mt-1">Out of stock</p>}
    </div>

    {/* Qty + remove */}
    <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
      <button onClick={() => onRemove(item.id)}
        className="p-1.5 rounded-lg text-ink-light/30 hover:text-rose hover:bg-rose/10 transition-all duration-200 btn-bubble opacity-0 group-hover:opacity-100">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-center gap-1.5 rounded-xl border border-caramel/20 bg-white/60 px-1">
        <button onClick={() => onQty(item.id, item.quantity - 1)}
          className="p-1 text-ink-light/50 hover:text-caramel transition-colors btn-bubble">
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-6 text-center text-sm font-bold font-sans text-ink">{item.quantity}</span>
          <button disabled={outOfStock || atMax} onClick={() => onQty(item.id, item.quantity + 1)}
            className={cn("p-1 transition-colors btn-bubble", outOfStock || atMax ? "text-ink-light/25 cursor-not-allowed" : "text-ink-light/50 hover:text-caramel")}>
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <span className="text-xs font-sans font-semibold text-caramel">
        PKR {Math.round(discountedLineTotal).toLocaleString()}
      </span>
      {lineDiscount > 0 && (
        <span className="text-[10px] font-sans text-ink-light/40 line-through -mt-1">
          PKR {lineSubtotal.toLocaleString()}
        </span>
      )}
    </div>
  </motion.div>
    );
  })()
);

const RemoveCouponModal = ({ onCancel, onConfirm, totalWithoutCoupon }: { onCancel: () => void; onConfirm: () => void; totalWithoutCoupon: number }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/45 backdrop-blur-sm"
    onClick={onCancel}>
    <motion.div initial={{ scale: 0.92, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 14 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md glass rounded-3xl border border-caramel/25 shadow-card p-6">
      <h3 className="font-display text-lg font-semibold text-ink-dark mb-2">Remove this coupon?</h3>
      <p className="text-sm text-ink-light/65 font-sans">
        If you remove it, your total will increase to <span className="font-bold text-ink-dark">PKR {totalWithoutCoupon.toLocaleString()}</span>.
      </p>
      <p className="text-xs text-red-500 font-sans mt-2">
        Do not remove the coupon if you want to keep this discount.
      </p>
      <div className="flex gap-3 mt-5">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-2xl border border-caramel/20 text-ink font-sans font-semibold text-sm hover:bg-caramel/8 transition-all btn-bubble">
          Keep Coupon
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-2xl bg-red-500 text-white font-sans font-bold text-sm hover:bg-red-600 transition-all btn-bubble">
          Remove Anyway
        </button>
      </div>
    </motion.div>
  </motion.div>
);

/* =============================================
   ORDER MODAL
   ============================================= */
const OrderModal = ({
  items, subtotal, discountAmount, total, coupon, lineDiscountByItem, onClose, onOrderPlaced,
}: {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  coupon: string;
  lineDiscountByItem: Record<string, number>;
  onClose: () => void;
  onOrderPlaced: () => void;
}) => {
  const { user, isLoggedIn } = useAuth();
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryMsg, setQueryMsg] = useState("");

  const itemLines = items
    .map((i) => {
      const lineSubtotal = i.price * i.quantity;
      const lineDiscount = lineDiscountByItem[i.productId] ?? 0;
      const lineTotal = Math.max(0, lineSubtotal - lineDiscount);
      return `  • ${i.name} × ${i.quantity} = PKR ${lineTotal.toLocaleString()}`;
    })
    .join("\n");

  const createOrderAndNotify = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const activeUser = authData.user;

    const res = await fetch("/api/orders/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: activeUser?.id ?? null,
        customerName: activeUser?.user_metadata?.full_name ?? activeUser?.user_metadata?.name ?? activeUser?.email ?? "Guest",
        customerEmail: activeUser?.email ?? "",
        customerPhone: activeUser?.user_metadata?.phone ?? "",
        source: "website",
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        totalAmount: total,
        discountAmount,
        couponCode: coupon || null,
        note: "Customer sent a website order query.",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Order create failed");
    }

    return data;
  };
  const msg = encodeURIComponent(
    ` *Cart Order — Crochet Masterpiece*\n\n${itemLines}\n\n *Subtotal:* PKR ${subtotal.toLocaleString()}${discountAmount > 0 ? `\n *Discount:* -PKR ${discountAmount.toLocaleString()}` : ""}\n *Total:* PKR ${total.toLocaleString()}${coupon ? `\n *Coupon:* ${coupon}` : ""}\n\n_Sent from website_ `
  );
  const whatsappUrl = `https://wa.me/923159202186?text=${msg}`;

  const sendQueryAndContinueWhatsApp = async () => {
    if (!isLoggedIn || !user) {
      setQueryMsg("Please log in to send a website query.");
      return;
    }
    setQueryLoading(true);
    setQueryMsg("");
    try {
      await createOrderAndNotify();
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setQueryMsg("Query sent to admin and WhatsApp opened.");
      onOrderPlaced();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send query right now. Please try again.";
      setQueryMsg(message);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleWhatsAppOnly = () => {
    if (!isLoggedIn || !user) {
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
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm glass rounded-3xl border border-blush/30 shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold text-ink-dark">Place your order</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-blush/10 text-ink-light transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 mb-5 max-h-40 overflow-y-auto pr-1">
          {items.map((item, index) => (
            <div key={item.id || `${item.productId}-${index}`} className="flex justify-between items-center text-sm font-sans">
              <span className="text-ink/70">{item.emoji} {item.name} <span className="text-ink-light/50">×{item.quantity}</span></span>
              <div className="text-right">
                <span className="font-semibold text-ink">
                  PKR {Math.max(0, (item.price * item.quantity) - (lineDiscountByItem[item.productId] ?? 0)).toLocaleString()}
                </span>
                {(lineDiscountByItem[item.productId] ?? 0) > 0 && (
                  <p className="text-[10px] text-ink-light/35 line-through">PKR {(item.price * item.quantity).toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
          <div className="border-t border-blush/20 pt-2 flex justify-between font-bold text-sm">
            <span className="text-ink-dark">Total</span>
            <span className="text-caramel">PKR {total.toLocaleString()}</span>
          </div>
        </div>
        <div className="space-y-2.5">
          <button
            onClick={() => { void sendQueryAndContinueWhatsApp(); }}
            disabled={queryLoading}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-blush/25 bg-blush/8 hover:bg-blush/15 transition-all btn-bubble text-left disabled:opacity-70"
          >
            <MessageCircle className="w-5 h-5 text-mauve flex-shrink-0" />
            <div>
              <p className="text-sm font-sans font-semibold text-ink-dark">Query to admin</p>
              <p className="text-[11px] text-ink-light/55">{queryLoading ? "Sending query..." : "Needs account login"}</p>
            </div>
          </button>
          {queryMsg && (
            <p className={cn("text-xs font-sans", queryMsg.includes("sent") ? "text-green-600" : "text-red-500")}>{queryMsg}</p>
          )}
          <button
            type="button"
            onClick={handleWhatsAppOnly}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#25D366] text-white hover:brightness-110 transition-all btn-bubble shadow-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.799 9.799 0 0 1-5.003-1.374l-.358-.213-3.742.981.999-3.648-.235-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            <div>
              <p className="text-sm font-sans font-bold">Order via WhatsApp</p>
              <p className="text-[11px] text-white/70">Full order message pre-written </p>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* =============================================
   MAIN CART PAGE
   ============================================= */
export default function CartPage() {
  const { cartItems: items, updateQty, removeFromCart, addToCart, clearCart, placeOrder, appliedCoupon, setAppliedCoupon, clearCoupon } = useShop();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showRemoveCouponConfirm, setShowRemoveCouponConfirm] = useState(false);
  const [cartSyncMessage, setCartSyncMessage] = useState("");

  useEffect(() => {
    if (appliedCoupon?.code) {
      setCoupon(appliedCoupon.code);
      setCouponApplied(true);
      setCouponMessage("Coupon is active for this cart.");
    }
  }, [appliedCoupon]);

  const setQty = (id: string, q: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    updateQty(item.productId, q);
  };
  const removeItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) removeFromCart(item.productId);
  };
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItemQty = items.reduce((s, i) => s + i.quantity, 0);
  const savings = items.reduce((s, i) => s + ((i.original_price ?? i.price) - i.price) * i.quantity, 0);

  const eligibleSubtotal = useMemo(() => {
    if (!appliedCoupon) return 0;
    return items.reduce((sum, item) => {
      const applicable = appliedCoupon.appliesTo === "all"
        || appliedCoupon.appliesTo === "cart"
        || (appliedCoupon.appliesTo === "product" && appliedCoupon.targetId === item.productId)
        || (appliedCoupon.appliesTo === "category" && !!item.category_id && appliedCoupon.targetId === item.category_id);
      if (!applicable) return sum;
      return sum + (item.price * item.quantity);
    }, 0);
  }, [appliedCoupon, items]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon || eligibleSubtotal <= 0) return 0;
    if (appliedCoupon.discountType === "flat") {
      return Math.min(appliedCoupon.discountValue, eligibleSubtotal);
    }
    return Math.min(eligibleSubtotal, Math.round((eligibleSubtotal * appliedCoupon.discountValue) / 100));
  }, [appliedCoupon, eligibleSubtotal]);

  const total = Math.max(0, subtotal - discountAmount);

  const lineDiscountByItem = useMemo(() => {
    const discountMap = new Map<string, number>();
    if (!appliedCoupon || discountAmount <= 0 || eligibleSubtotal <= 0) return discountMap;

    const eligibleItems = items.filter((item) => isCouponApplicableToItem(item, appliedCoupon));
    if (!eligibleItems.length) return discountMap;

    let remaining = discountAmount;
    eligibleItems.forEach((item, index) => {
      const lineSubtotal = item.price * item.quantity;
      const isLast = index === eligibleItems.length - 1;
      const proportional = Math.floor((lineSubtotal / eligibleSubtotal) * discountAmount);
      const assigned = isLast ? remaining : Math.min(remaining, proportional);
      const safeAssigned = Math.max(0, Math.min(lineSubtotal, assigned));
      discountMap.set(item.productId, safeAssigned);
      remaining -= safeAssigned;
    });

    return discountMap;
  }, [appliedCoupon, discountAmount, eligibleSubtotal, items]);

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setCouponApplied(false);
      setCouponMessage("Enter a coupon code first.");
      return;
    }

    setCouponLoading(true);
    try {
      const productIds = Array.from(new Set(items.map((item) => item.productId).filter(Boolean)));
      const categoryIds = Array.from(new Set(items
        .map((item) => item.category_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)));

      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, productIds, categoryIds }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponApplied(false);
        setCouponMessage(data.message ?? "Invalid coupon code.");
        clearCoupon();
        return;
      }

      const hasEligibleItem = items.some((item) =>
        isCouponApplicableToItem(item, {
          appliesTo: data.appliesTo,
          targetId: data.targetId ?? null,
        })
      );

      if (!hasEligibleItem && data.appliesTo !== "cart") {
        clearCoupon();
        setCouponApplied(false);
        setCouponMessage("This coupon does not apply to items in your cart.");
        return;
      }

      setAppliedCoupon({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        appliesTo: data.appliesTo,
        targetId: data.targetId ?? null,
      });
      setCouponApplied(true);
      setCouponMessage(data.message ?? "Coupon applied.");
    } catch {
      setCouponApplied(false);
      setCouponMessage("Could not validate coupon right now.");
    } finally {
      setCouponLoading(false);
    }
  };

  const revalidateCartBeforeCheckout = async () => {
    if (!items.length) return true;

    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, stock_quantity, is_active")
      .in("id", productIds);

    if (error || !data) {
      setCartSyncMessage("Could not verify latest stock right now. Please try checkout again.");
      return false;
    }

    const byId = new Map((data as { id: string; name: string; price: number; stock_quantity: number; is_active: boolean }[]).map((p) => [p.id, p]));
    let changed = false;

    for (const item of items) {
      const latest = byId.get(item.productId);
      if (!latest || !latest.is_active || latest.stock_quantity <= 0) {
        removeFromCart(item.productId);
        changed = true;
        continue;
      }

      if (latest.price !== item.price) {
        removeFromCart(item.productId);
        addToCart({
          productId: item.productId,
          name: latest.name || item.name,
          price: latest.price,
          original_price: item.original_price,
          category: item.category,
          category_id: item.category_id,
          emoji: item.emoji,
        }, Math.min(item.quantity, latest.stock_quantity));
        changed = true;
        continue;
      }

      const allowedQty = Math.max(1, Math.min(item.quantity, latest.stock_quantity));
      if (allowedQty !== item.quantity) {
        updateQty(item.productId, allowedQty);
        changed = true;
      }
    }

    if (changed) {
      setCartSyncMessage("Cart updated with latest admin stock/price changes. Please review and checkout again.");
      return false;
    }

    setCartSyncMessage("");
    return true;
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink-dark">Your Cart</h1>
            {items.length > 0 && (
              <p className="text-sm text-ink-light/60 font-sans mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} in your cart</p>
            )}
          </div>
          {items.length > 0 && (
            <button onClick={clearCart}
              className="text-xs text-ink-light/50 hover:text-rose font-sans transition-colors flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <CartRow key={item.id || `${item.productId}-${index}`} item={item} onQty={setQty} onRemove={removeItem} lineDiscount={lineDiscountByItem.get(item.productId) ?? 0} />
                ))}
              </AnimatePresence>
              <Link href="/user/shop"
                className="flex items-center gap-2 text-sm font-sans font-semibold text-caramel hover:text-ink transition-colors mt-4 group">
                <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" />
                Continue shopping
              </Link>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="glass rounded-3xl border border-blush/25 shadow-card p-5 sticky top-28 space-y-4">
                <h3 className="font-display text-base font-semibold text-ink-dark">Order Summary</h3>

                <div className="space-y-2 text-sm font-sans">
                  <div className="flex justify-between text-ink-light/70">
                      <span>Subtotal ({totalItemQty} items)</span>
                    <span>PKR {subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Coupon discount</span>
                      <span>-PKR {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {savings > 0 && (
                    <div className="flex justify-between text-caramel font-semibold">
                      <span>You save</span>
                      <span>-PKR {savings.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-blush/20 pt-2 flex justify-between font-bold text-ink-dark">
                    <span>Total</span>
                    <span>PKR {total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center rounded-xl border border-caramel/20 bg-white/70 focus-within:border-blush focus-within:shadow-[0_0_0_2px_rgba(244,184,193,0.2)] transition-all">
                    <Tag className="w-3.5 h-3.5 text-caramel/50 ml-3 flex-shrink-0" />
                    <input type="text" value={coupon} onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponApplied(false); setCouponMessage(""); }}
                      placeholder="Coupon code"
                      className="flex-1 bg-transparent px-2 py-2 text-xs font-sans text-ink placeholder:text-ink-light/40 outline-none" />
                  </div>
                  <button onClick={applyCoupon} disabled={couponLoading}
                    className="px-3 py-2 rounded-xl bg-caramel/10 border border-caramel/20 text-caramel text-xs font-sans font-bold hover:bg-caramel/18 transition-all btn-bubble">
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
                {couponMessage && (
                  <p className={cn("text-xs font-sans -mt-2", couponApplied ? "text-green-600" : "text-red-500")}>
                    {couponMessage}
                  </p>
                )}
                {cartSyncMessage && (
                  <p className="text-xs font-sans text-amber-700 -mt-2">{cartSyncMessage}</p>
                )}
                {appliedCoupon && (
                  <button
                    onClick={() => setShowRemoveCouponConfirm(true)}
                    className="text-xs text-ink-light/55 font-sans underline decoration-caramel/30 hover:text-caramel transition-colors"
                  >
                    Remove active coupon
                  </button>
                )}
                <button
                  onClick={async () => {
                    const ok = await revalidateCartBeforeCheckout();
                    if (ok) setShowOrder(true);
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl",
                    "bg-gradient-to-r from-caramel via-rose to-blush text-white",
                    "text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5",
                    "transition-all duration-300 btn-bubble relative overflow-hidden group"
                  )}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <ShoppingBag className="w-4 h-4" /> Checkout
                </button>

                <p className="text-[10px] text-center text-ink-light/40 font-sans">
                  Choose WhatsApp or website query at checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <AnimatePresence>
        {showOrder && (
          <OrderModal
            items={items}
            subtotal={subtotal}
            discountAmount={discountAmount}
            total={total}
            coupon={appliedCoupon?.code ?? coupon}
            lineDiscountByItem={Object.fromEntries(lineDiscountByItem)}
            onClose={() => setShowOrder(false)}
            onOrderPlaced={() => {
              placeOrder();
              setCoupon("");
              setCouponApplied(false);
              setCouponMessage("Coupon used and order recorded.");
              setShowOrder(false);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRemoveCouponConfirm && (
          <RemoveCouponModal
            totalWithoutCoupon={subtotal}
            onCancel={() => setShowRemoveCouponConfirm(false)}
            onConfirm={() => {
              clearCoupon();
              setCouponApplied(false);
              setCouponMessage("Coupon removed.");
              setShowRemoveCouponConfirm(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
