"use client";

import React, { useState } from "react";
import { useShop } from "@/lib/ShopContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ArrowRight, Star, Tag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  average_rating: number;
  review_count: number;
  discount_percent?: number;
  is_featured?: boolean;
  emoji: string;
}

const INITIAL_WISHLIST: WishlistItem[] = []; // Wishlist from ShopContext

const EmptyWishlist = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center gap-5">
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blush/20 to-rose/10 flex items-center justify-center text-5xl animate-float">
      
    </div>
    <div>
      <h3 className="font-display text-xl font-semibold text-ink-dark mb-2">Your wishlist is empty</h3>
      <p className="text-sm text-ink-light/60 font-sans">Tap the heart on any product to save it for later.</p>
    </div>
    <Link href="/user/shop"
      className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-caramel to-rose text-white text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble">
      <Heart className="w-4 h-4" /> Browse products
    </Link>
  </motion.div>
);

const WishlistCard = ({
  item, onRemove, onAddCart,
}: { item: WishlistItem; onRemove: (id: string) => void; onAddCart: (id: string) => void }) => {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "relative rounded-3xl border overflow-hidden transition-all duration-300",
        hover ? "border-blush/50 shadow-card -translate-y-1.5" : "border-blush/20 shadow-soft bg-white/80"
      )}
    >
      {/* Image */}
      <Link href={`/user/shop/${item.productId}`}
        className="block h-44 bg-gradient-to-br from-cream-50 to-blush/15 flex items-center justify-center relative">
        <div className={cn("text-5xl select-none transition-transform duration-500", hover ? "scale-110 rotate-6" : "")}>
          {item.emoji}
        </div>
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {item.discount_percent && (
            <span className="bg-gradient-to-r from-caramel to-rose text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-button">
              -{item.discount_percent}%
            </span>
          )}
          {item.is_featured && (
            <span className="bg-gradient-to-r from-mauve to-blush text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </span>
          )}
        </div>
        {/* Remove wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); onRemove(item.id); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/80 border border-rose/20 flex items-center justify-center hover:bg-rose/10 hover:border-rose/40 transition-all btn-bubble"
        >
          <Heart className="w-4 h-4 fill-rose text-rose" />
        </button>
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] font-sans font-semibold text-ink-light/50 uppercase tracking-wider mb-0.5">{item.category}</p>
        <Link href={`/user/shop/${item.productId}`}>
          <h3 className="font-display text-sm font-semibold text-ink-dark hover:text-caramel transition-colors mb-1.5 line-clamp-1">{item.name}</h3>
        </Link>
        <div className="flex gap-0.5 mb-2.5">
          {[1,2,3,4,5].map((i) => <Star key={i} className={cn("w-3 h-3", i <= Math.round(item.average_rating) ? "fill-caramel text-caramel" : "text-caramel/15")} />)}
          <span className="text-[10px] text-ink-light/45 ml-1">({item.review_count})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold font-sans text-ink-dark">PKR {item.price.toLocaleString()}</span>
            {item.original_price && item.original_price > item.price && (
              <span className="text-xs text-ink-light/35 line-through ml-1.5">PKR {item.original_price.toLocaleString()}</span>
            )}
          </div>
          <button onClick={() => onAddCart(item.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-caramel to-rose text-white text-xs font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble">
            <ShoppingCart className="w-3 h-3" /> Add
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function WishlistPage() {
  const { wishlistItems: items, removeFromWishlist, clearWishlist, addToCartFromWishlist } = useShop();
  const [cartAdded, setCartAdded] = useState<string[]>([]);

  // Per spec: adding to cart does NOT remove from wishlist
  const remove = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) removeFromWishlist(item.productId);
  };
  const addToCart = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    addToCartFromWishlist(item.productId); // does NOT remove from wishlist
    setCartAdded((prev) => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink-dark flex items-center gap-3">
              <Heart className="w-7 h-7 fill-blush text-blush" /> Wishlist
            </h1>
            {items.length > 0 && (
              <p className="text-sm text-ink-light/60 font-sans mt-0.5">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
            )}
          </div>
          {items.length > 0 && (
            <button onClick={clearWishlist}
              className="text-xs text-ink-light/50 hover:text-rose font-sans transition-colors flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Clear wishlist
            </button>
          )}
        </div>

        {items.length === 0 ? <EmptyWishlist /> : (
          <>
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <WishlistCard key={item.id} item={item} onRemove={remove} onAddCart={addToCart} />
                ))}
              </AnimatePresence>
            </motion.div>
            <div className="flex justify-center mt-10">
              <Link href="/user/shop"
                className="flex items-center gap-2 px-7 py-3 rounded-2xl border border-caramel/25 text-caramel font-sans font-semibold text-sm hover:bg-caramel/8 transition-all btn-bubble group">
                Find more to love
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
