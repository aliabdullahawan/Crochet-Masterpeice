"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Minus, Trash2, ShoppingBag, Tag, Check,
  ArrowRight, ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/lib/ShopContext";
import { supabase } from "@/lib/supabase";

type CouponScope = "all" | "product" | "category" | "cart";

const isCouponApplicableToItem = (
  item: { productId: string; category_id?: string },
  coupon: { appliesTo: CouponScope; targetId?: string | null } | null,
) => {
  if (!coupon) return false;
  if (coupon.appliesTo === "all") return true;
  if (coupon.appliesTo === "cart") return true;
  if (coupon.appliesTo === "product") return coupon.targetId === item.productId;
  if (coupon.appliesTo === "category") return !!item.category_id && coupon.targetId === item.category_id;
  return false;
};

/* =============================================
   ORDER POPUP inside drawer
   ============================================= */
const DrawerOrderPopup = ({
  onClose, total, itemCount,
}: {
  onClose: () => void;
  total: number;
  itemCount: number;
}) => {
  const { cartItems } = useShop();
  const checkoutHref = `/user/checkout?source=website&items=${encodeURIComponent(
    JSON.stringify(
      cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      }))
    )
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-xs rounded-3xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full glass rounded-3xl border border-blush/30 shadow-card p-5"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-base font-semibold text-ink-dark">Checkout ({itemCount} items)</h3>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-blush/10 text-ink-light btn-bubble"><X className="w-4 h-4" /></button>
        </div>

        <div className="bg-cream-50/80 rounded-xl p-3 mb-4 text-center border border-blush/15">
          <p className="text-xs text-ink-light/60 font-sans">Total amount</p>
          <p className="font-display text-xl font-semibold text-caramel">PKR {total.toLocaleString()}</p>
        </div>

        <div className="space-y-2.5">
            <Link
              href={checkoutHref}
              onClick={() => {
                onClose();
              }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#25D366] text-white hover:brightness-110 transition-all btn-bubble shadow-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.003-1.374l-.36-.213-3.74.981 1-3.648-.236-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            <div>
              <p className="text-xs font-sans font-bold">Continue to WhatsApp Checkout</p>
              <p className="text-[10px] text-white/70">Fill details, then send via WhatsApp</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* =============================================
   CART DRAWER
   ============================================= */
interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { cartItems, updateQty, removeFromCart, addToCart, clearCart, cartCount, appliedCoupon, setAppliedCoupon, clearCoupon } = useShop();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartSyncMessage, setCartSyncMessage] = useState("");

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const savings  = cartItems.reduce((s, i) => s + ((i.original_price ?? i.price) - i.price) * i.quantity, 0);
  const eligibleSubtotal = cartItems.reduce((sum, item) => {
    if (!isCouponApplicableToItem(item, appliedCoupon)) return sum;
    return sum + item.price * item.quantity;
  }, 0);
  const discountAmount = !appliedCoupon || eligibleSubtotal <= 0
    ? 0
    : appliedCoupon.discountType === "flat"
      ? Math.min(appliedCoupon.discountValue, eligibleSubtotal)
      : Math.min(eligibleSubtotal, Math.round((eligibleSubtotal * appliedCoupon.discountValue) / 100));
  const total = Math.max(0, subtotal - discountAmount);

  React.useEffect(() => {
    if (appliedCoupon?.code) {
      setCoupon(appliedCoupon.code);
      setCouponApplied(true);
      setCouponMessage("Coupon is active for this cart.");
      return;
    }
    setCouponApplied(false);
  }, [appliedCoupon]);

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setCouponApplied(false);
      setCouponMessage("Enter a coupon code first.");
      return;
    }

    setCouponLoading(true);
    try {
      const productIds = Array.from(new Set(cartItems.map((item) => item.productId).filter(Boolean)));
      const categoryIds = Array.from(new Set(cartItems
        .map((item) => item.category_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)));

      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, productIds, categoryIds }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        clearCoupon();
        setCouponApplied(false);
        setCouponMessage(data.message ?? "Invalid coupon code.");
        return;
      }

      const incomingCoupon = {
        appliesTo: data.appliesTo as CouponScope,
        targetId: data.targetId ?? null,
      };
      const hasEligibleItem = cartItems.some((item) => isCouponApplicableToItem(item, incomingCoupon));

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
    if (!cartItems.length) return true;

    const productIds = Array.from(new Set(cartItems.map((i) => i.productId)));
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

    for (const item of cartItems) {
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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-150 bg-ink-dark/30 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <motion.div
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-160 w-full max-w-sm flex flex-col"
          >
            <div className="relative flex flex-col h-full glass border-l border-blush/25 shadow-[-8px_0_40px_rgba(74,55,40,0.12)]">
              {/* Checkout popup overlay */}
              <AnimatePresence>
                {showCheckout && (
                  <DrawerOrderPopup
                    onClose={() => setShowCheckout(false)}
                    total={total}
                    itemCount={cartCount}
                  />
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-blush/20 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-linear-to-br from-caramel/20 to-blush/15 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-caramel" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-semibold text-ink-dark">Your Cart</h2>
                    <p className="text-[10px] text-ink-light/50 font-sans">{cartCount} item{cartCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cartItems.length > 0 && (
                    <button onClick={clearCart} className="text-[10px] text-ink-light/40 hover:text-rose font-sans transition-colors flex items-center gap-1 btn-bubble">
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                  <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-blush/10 text-ink-light transition-colors btn-bubble">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                    <div className="text-5xl animate-float"></div>
                    <div className="text-center">
                      <p className="font-display text-base font-semibold text-ink-dark mb-1">Your cart is empty</p>
                      <p className="text-xs text-ink-light/55 font-sans">Add something lovely!</p>
                    </div>
                    <button onClick={onClose}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-caramel to-rose text-white text-xs font-sans font-bold shadow-button btn-bubble">
                      <ShoppingBag className="w-3.5 h-3.5" /> Browse shop
                    </button>
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <div key={item.id || `${item.productId}-${index}`} className="flex gap-3 p-3 rounded-2xl glass border border-blush/15 hover:border-blush/30 transition-all group">
                      {/* Emoji image */}
                      <Link href={`/user/shop/${item.productId}`} onClick={onClose}
                        className="w-14 h-14 rounded-xl overflow-hidden shrink-0 hover:scale-105 transition-transform relative bg-linear-to-br from-cream-50 to-blush/20">
                        <div className="absolute inset-0 bg-linear-to-br from-blush/35 via-baby to-cream-100" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display text-lg font-semibold text-caramel/70">{item.name.charAt(0)}</span>
                        </div>
                      </Link>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-sans font-semibold text-ink-light/45 uppercase tracking-wider">{item.category}</p>
                        <Link href={`/user/shop/${item.productId}`} onClick={onClose}>
                          <p className="font-display text-xs font-semibold text-ink-dark hover:text-caramel transition-colors line-clamp-1">{item.name}</p>
                        </Link>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-bold text-caramel">PKR {(item.price * item.quantity).toLocaleString()}</span>
                          {item.original_price && item.original_price > item.price && (
                            <span className="text-[10px] text-ink-light/30 line-through">PKR {item.original_price.toLocaleString()}</span>
                          )}
                        </div>
                        {/* Qty */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 rounded-xl border border-caramel/20 bg-white/60">
                            <button onClick={() => updateQty(item.productId, Math.max(1, item.quantity - 1))}
                              className="p-1 text-ink-light/50 hover:text-caramel transition-colors btn-bubble">
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-ink">{item.quantity}</span>
                            <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                              className="p-1 text-ink-light/50 hover:text-caramel transition-colors btn-bubble">
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item.productId)}
                            className="p-1 rounded-lg text-ink-light/25 hover:text-rose hover:bg-rose/10 transition-all opacity-0 group-hover:opacity-100 btn-bubble">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer — only show if items */}
              {cartItems.length > 0 && (
                <div className="px-4 py-4 border-t border-blush/20 space-y-3 shrink-0 bg-white/40">
                  {/* Coupon */}
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center rounded-xl border border-caramel/15 bg-white/70 focus-within:border-blush focus-within:shadow-[0_0_0_2px_rgba(244,184,193,0.2)] transition-all">
                      <Tag className="w-3.5 h-3.5 text-caramel/40 ml-2.5 shrink-0" />
                      <input type="text" value={coupon}
                        onChange={(e) => {
                          setCoupon(e.target.value.toUpperCase());
                          setCouponApplied(false);
                          setCouponMessage("");
                          clearCoupon();
                        }}
                        placeholder="Coupon code"
                        className="flex-1 bg-transparent px-2 py-2 text-xs font-sans text-ink placeholder:text-ink-light/35 outline-hidden" />
                      {couponApplied && <Check className="w-3.5 h-3.5 text-green-500 mr-2" />}
                    </div>
                    <button onClick={applyCoupon} disabled={couponLoading}
                      className="px-3 py-2 rounded-xl bg-caramel/10 border border-caramel/20 text-caramel text-xs font-sans font-bold hover:bg-caramel/18 transition-all btn-bubble">
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponMessage && (
                    <p className={cn("text-[11px] font-sans", couponApplied ? "text-green-600" : "text-rose")}>{couponMessage}</p>
                  )}
                  {cartSyncMessage && (
                    <p className="text-[11px] font-sans text-amber-700">{cartSyncMessage}</p>
                  )}
                  {couponApplied && appliedCoupon && discountAmount > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                      <p className="text-[11px] text-green-700 font-sans">
                        {appliedCoupon.code} active ({appliedCoupon.appliesTo})
                      </p>
                      <button
                        onClick={() => {
                          clearCoupon();
                          setCouponApplied(false);
                          setCouponMessage("Coupon removed.");
                        }}
                        className="text-[11px] font-sans font-semibold text-green-700 hover:text-green-900"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-1 text-xs font-sans">
                    <div className="flex justify-between text-ink-light/65">
                      <span>Subtotal ({cartCount} items)</span>
                      <span>PKR {subtotal.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-700 font-semibold">
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
                    <div className="flex justify-between font-bold text-sm text-ink-dark pt-1 border-t border-blush/15">
                      <span>Total</span>
                      <span>PKR {total.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const ok = await revalidateCartBeforeCheckout();
                      if (ok) setShowCheckout(true);
                    }}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3 rounded-2xl",
                      "bg-linear-to-r from-caramel via-rose to-blush text-white",
                      "text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5",
                      "transition-all duration-300 btn-bubble relative overflow-hidden group"
                    )}
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <ShoppingBag className="w-4 h-4" /> Checkout
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
