"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Heart, ShoppingCart, Trash2, Star, Sparkles,
  Tag, ArrowRight, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/lib/ShopContext";

interface WishlistDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenCart: () => void;
}

export const WishlistDrawer = ({ open, onClose, onOpenCart }: WishlistDrawerProps) => {
  const {
    wishlistItems, removeFromWishlist, clearWishlist,
    wishlistCount, addToCartFromWishlist,
  } = useShop();

  const handleAddToCart = (productId: string) => {
    addToCartFromWishlist(productId);
    // Item stays in wishlist (per spec) — just show cart
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="wish-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-ink-dark/30 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <motion.div
            key="wish-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-[160] w-full max-w-sm flex flex-col"
          >
            <div className="flex flex-col h-full glass border-l border-blush/25 shadow-[-8px_0_40px_rgba(74,55,40,0.12)]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-blush/20 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blush/25 to-rose/15 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-blush text-blush" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-semibold text-ink-dark">Wishlist</h2>
                    <p className="text-[10px] text-ink-light/50 font-sans">{wishlistCount} saved item{wishlistCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {wishlistItems.length > 0 && (
                    <button onClick={clearWishlist}
                      className="text-[10px] text-ink-light/40 hover:text-rose font-sans transition-colors flex items-center gap-1 btn-bubble">
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                  <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-blush/10 text-ink-light transition-colors btn-bubble">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {wishlistItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                    <div className="text-5xl animate-float"></div>
                    <div className="text-center">
                      <p className="font-display text-base font-semibold text-ink-dark mb-1">Nothing saved yet</p>
                      <p className="text-xs text-ink-light/55 font-sans">Tap the heart on any product to save it here.</p>
                    </div>
                    <button onClick={onClose}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-caramel to-rose text-white text-xs font-sans font-bold shadow-button btn-bubble">
                      <ShoppingBag className="w-3.5 h-3.5" /> Browse products
                    </button>
                  </div>
                ) : (
                  wishlistItems.map((item) => (
                    <div key={item.id}
                      className="relative rounded-2xl glass border border-blush/15 hover:border-blush/35 transition-all duration-200 overflow-hidden group"
                    >
                      {/* Image + badges */}
                      <Link href={`/user/shop/${item.productId}`} onClick={onClose}
                        className="block relative h-32 overflow-hidden bg-gradient-to-br from-cream-50 to-blush/10">
                        {/* Subtle texture */}
                        <img
                          src={item.productId === "1" || item.productId === "5" ? "/images/bg-hands-knitting.jpg"
                            : item.productId === "2" ? "/images/bg-yarn-table.jpg"
                            : item.productId === "3" ? "/images/bg-crochet-items.jpg"
                            : "/images/bg-crochet-pink.jpg"}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover opacity-[0.1]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-cream-50/90 to-blush/15" />
                        {/* Initial circle */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blush/40 to-mauve/25 border-2 border-blush/20 flex items-center justify-center shadow-soft transition-transform duration-300 group-hover:scale-110">
                            <span className="font-display text-xl font-semibold text-caramel/80">{item.name.charAt(0)}</span>
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {item.discount_percent && (
                            <span className="bg-gradient-to-r from-caramel to-rose text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-button">
                              -{item.discount_percent}%
                            </span>
                          )}
                          {item.is_featured && (
                            <span className="bg-gradient-to-r from-mauve to-blush text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Sparkles className="w-2 h-2" /> Featured
                            </span>
                          )}
                        </div>
                        {/* Remove from wishlist — always visible */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromWishlist(item.productId); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 border border-rose/30 flex items-center justify-center hover:bg-rose/15 hover:border-rose/60 transition-all btn-bubble shadow-sm"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose/70 hover:text-rose" />
                        </button>
                      </Link>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-[9px] font-sans font-semibold text-ink-light/45 uppercase tracking-wider mb-0.5">{item.category}</p>
                        <Link href={`/user/shop/${item.productId}`} onClick={onClose}>
                          <p className="font-display text-xs font-semibold text-ink-dark hover:text-caramel transition-colors line-clamp-1">{item.name}</p>
                        </Link>
                        {/* Stars */}
                        <div className="flex gap-0.5 my-1.5">
                          {[1,2,3,4,5].map((i) => (
                            <Star key={i} className={cn("w-2.5 h-2.5", i <= Math.round(item.average_rating) ? "fill-caramel text-caramel" : "text-caramel/15")} />
                          ))}
                          <span className="text-[9px] text-ink-light/40 ml-0.5">({item.review_count})</span>
                        </div>
                        {/* Price + actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-sm font-bold font-sans text-ink-dark">PKR {item.price.toLocaleString()}</span>
                            {item.original_price && item.original_price > item.price && (
                              <span className="text-[10px] text-ink-light/35 line-through ml-1">PKR {item.original_price.toLocaleString()}</span>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            {/* Delete */}
                            <button
                              onClick={() => removeFromWishlist(item.productId)}
                              className="w-7 h-7 rounded-xl border border-rose/25 bg-rose/5 flex items-center justify-center hover:bg-rose/15 hover:border-rose/50 transition-all btn-bubble"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="w-3 h-3 text-rose/60" />
                            </button>
                            {/* Add to cart */}
                            <button
                              onClick={() => { handleAddToCart(item.productId); onClose(); onOpenCart(); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-caramel to-rose text-white text-[10px] font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble"
                              title="Add to cart (stays in wishlist)"
                            >
                              <ShoppingCart className="w-3 h-3" /> Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {wishlistItems.length > 0 && (
                <div className="px-4 py-4 border-t border-blush/20 flex-shrink-0 bg-white/40">
                  <p className="text-[11px] text-ink-light/45 font-sans text-center mb-3">
                    Items stay in wishlist when added to cart 
                  </p>
                  <Link
                    href="/user/shop"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-caramel/25 text-caramel text-sm font-sans font-semibold hover:bg-caramel/8 transition-all btn-bubble group"
                  >
                    Continue browsing
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
