"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

/* =============================================
   TYPES
   ============================================= */
export interface CartItem {
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

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  category_id?: string;
  average_rating: number;
  review_count: number;
  discount_percent?: number;
  is_featured?: boolean;
  emoji: string;
}

export interface AppliedCoupon {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  appliesTo: "all" | "product" | "category" | "cart";
  targetId?: string | null;
}

interface ShopContextType {
  // Cart
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (item: Omit<CartItem, "id" | "quantity">, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;

  // Wishlist
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  addToWishlist: (item: Omit<WishlistItem, "id">) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;

  // Move from wishlist → cart (does NOT remove from wishlist per spec)
  addToCartFromWishlist: (productId: string) => void;

  // After placing order → clear cart
  placeOrder: () => void;

  // Coupon
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  clearCoupon: () => void;
}

const ShopContext = createContext<ShopContextType | null>(null);

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
};

/* =============================================
   PROVIDER
   ============================================= */
export const ShopProvider = ({ children }: { children: ReactNode }) => {
  // Always start empty on server, load from localStorage only on client
  // This prevents hydration mismatch between server (count=0) and client (count=N)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [appliedCoupon, setAppliedCouponState] = useState<AppliedCoupon | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after hydration (client only)
  useEffect(() => {
    const hydrate = async () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cm_cart") ?? "[]") as CartItem[];
        const wish = JSON.parse(localStorage.getItem("cm_wishlist") ?? "[]") as WishlistItem[];
        const coupon = JSON.parse(localStorage.getItem("cm_coupon") ?? "null");

        const missingIds = Array.from(new Set([
          ...cart.filter((i) => !i.category_id).map((i) => i.productId),
          ...wish.filter((i) => !i.category_id).map((i) => i.productId),
        ].filter(Boolean)));

        if (missingIds.length) {
          const { data } = await supabase
            .from("products")
            .select("id, category_id")
            .in("id", missingIds);

          const categoryByProduct = new Map<string, string>();
          (data ?? []).forEach((row: { id: string; category_id: string | null }) => {
            if (row.id && row.category_id) categoryByProduct.set(row.id, row.category_id);
          });

          const repairedCart = cart.map((i) => i.category_id ? i : ({ ...i, category_id: categoryByProduct.get(i.productId) }));
          const repairedWish = wish.map((i) => i.category_id ? i : ({ ...i, category_id: categoryByProduct.get(i.productId) }));

          if (repairedCart.length) setCartItems(repairedCart);
          if (repairedWish.length) setWishlistItems(repairedWish);
        } else {
          if (cart.length) setCartItems(cart);
          if (wish.length) setWishlistItems(wish);
        }

        if (coupon && typeof coupon.code === "string") {
          const cartForCoupon = (cart ?? []) as CartItem[];
          const productIds = Array.from(new Set(cartForCoupon.map((i) => i.productId).filter(Boolean)));
          const categoryIds = Array.from(new Set(cartForCoupon
            .map((i) => i.category_id)
            .filter((value): value is string => typeof value === "string" && value.length > 0)));

          if (!productIds.length) {
            localStorage.removeItem("cm_coupon");
          } else {
            try {
              const res = await fetch("/api/validate-coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: String(coupon.code).toUpperCase(), productIds, categoryIds }),
              });
              const data = await res.json();
              if (res.ok && data?.valid) {
                setAppliedCouponState({
                  code: data.code,
                  discountType: data.discountType,
                  discountValue: data.discountValue,
                  appliesTo: data.appliesTo,
                  targetId: data.targetId ?? null,
                } as AppliedCoupon);
              } else {
                localStorage.removeItem("cm_coupon");
              }
            } catch {
              // Keep existing persisted coupon if validation endpoint is temporarily unavailable.
              setAppliedCouponState(coupon as AppliedCoupon);
            }
          }
        }
      } catch { /* ignore */ }
      setHydrated(true);
    };

    void hydrate();
  }, []);

  // Persist to localStorage on change (only after hydration to avoid overwriting)
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("cm_cart", JSON.stringify(cartItems));
  }, [cartItems, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("cm_wishlist", JSON.stringify(wishlistItems));
  }, [wishlistItems, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("cm_coupon", JSON.stringify(appliedCoupon));
  }, [appliedCoupon, hydrated]);

  // ── CART ────────────────────────────────────────────────
  const addToCart = useCallback((item: Omit<CartItem, "id" | "quantity">, qty = 1) => {
    setCartItems((prev) => {
      const stockLimit = item.stock_quantity ?? Infinity;
      if (stockLimit <= 0) return prev;

      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        // Increase quantity if already in cart
        const maxAllowed = existing.stock_quantity ?? stockLimit;
        const nextQty = Math.min(maxAllowed, existing.quantity + qty);
        if (nextQty <= existing.quantity) return prev;
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: nextQty } : i
        );
      }

      const initialQty = Math.max(1, Math.min(stockLimit, qty));
      return [...prev, { ...item, id: `cart-${item.productId}-${Date.now()}`, quantity: initialQty }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setCartItems((prev) => prev.map((i) => {
      if (i.productId !== productId) return i;
      const maxAllowed = i.stock_quantity ?? Infinity;
      return { ...i, quantity: Math.min(maxAllowed, qty) };
    }));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCartItems([]), []);

  // After placing order — clear CART only, wishlist stays
  const placeOrder = useCallback(() => {
    setCartItems([]);
    setAppliedCouponState(null);
    // Wishlist is intentionally NOT cleared
  }, []);

  const setAppliedCoupon = useCallback((coupon: AppliedCoupon | null) => {
    setAppliedCouponState(coupon);
  }, []);

  const clearCoupon = useCallback(() => {
    setAppliedCouponState(null);
  }, []);

  // ── WISHLIST ─────────────────────────────────────────────
  const addToWishlist = useCallback((item: Omit<WishlistItem, "id">) => {
    setWishlistItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        if (!existing.category_id && item.category_id) {
          return prev.map((i) => i.productId === item.productId ? { ...i, category_id: item.category_id } : i);
        }
        return prev; // already wishlisted
      }
      return [...prev, { ...item, id: `wish-${item.productId}-${Date.now()}` }];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlistItems.some((i) => i.productId === productId),
    [wishlistItems]
  );

  const clearWishlist = useCallback(() => setWishlistItems([]), []);

  // Add to cart from wishlist — per spec: does NOT remove from wishlist
  const addToCartFromWishlist = useCallback((productId: string) => {
    const wish = wishlistItems.find((i) => i.productId === productId);
    if (!wish) return;
    addToCart({
      productId: wish.productId,
      name: wish.name,
      price: wish.price,
      original_price: wish.original_price,
      category: wish.category,
      category_id: wish.category_id,
      emoji: wish.emoji,
    });
    // Wishlist item is NOT removed — stays in wishlist
  }, [wishlistItems, addToCart]);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const wishlistCount = wishlistItems.length;

  return (
    <ShopContext.Provider value={{
      cartItems, cartCount, addToCart, removeFromCart, updateQty, clearCart,
      wishlistItems, wishlistCount, addToWishlist, removeFromWishlist, isWishlisted, clearWishlist,
      addToCartFromWishlist, placeOrder,
      appliedCoupon, setAppliedCoupon, clearCoupon,
    }}>
      {children}
    </ShopContext.Provider>
  );
};
