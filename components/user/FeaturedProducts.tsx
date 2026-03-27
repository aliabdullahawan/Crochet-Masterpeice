"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useRef, useEffect } from "react";
import { GlowCard } from "@/components/ui/GlowCard";
import { useShop } from "@/lib/ShopContext";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Heart, ShoppingCart, Star, ArrowRight, Sparkles, Tag, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/* =============================================
   TYPES
   ============================================= */
interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  stock_quantity: number;
  category_name: string;
  category_id?: string;
  average_rating: number;
  review_count: number;
  discount_percent?: number;
  tags?: string[];
  is_featured?: boolean;
  image_url?: string;
  images?: string[];
}

/* =============================================
   SHATTER BUTTON (mini version for card buttons)
   ============================================= */
interface Shard { id: number; tx: number; ty: number; rot: number; size: number; color: string; }

const ShatterBtn = ({
  children, onClick, variant = "primary", className,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: "primary" | "ghost" | "icon";
  className?: string;
}) => {
  const [shards, setShards] = useState<Shard[]>([]);
  const [burst, setBurst] = useState(false);
  const colors = ["#F4B8C1", "#C9A0DC", "#C8956C", "#E8A0A8", "#FFF8ED"];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newShards: Shard[] = Array.from({ length: 10 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
      const v = 40 + Math.random() * 70;
      return { id: i, tx: Math.cos(angle) * v, ty: Math.sin(angle) * v, rot: Math.random() * 360 - 180, size: 3 + Math.random() * 5, color: colors[Math.floor(Math.random() * colors.length)] };
    });
    setShards(newShards);
    setBurst(true);
    setTimeout(() => { setBurst(false); setShards([]); }, 600);
    onClick?.(e);
  };

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden transition-all duration-300 active:scale-95",
          variant === "primary" && "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-caramel to-rose text-white text-xs font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5",
          variant === "ghost" && "flex items-center justify-center w-8 h-8 rounded-xl bg-white/80 border border-blush/30 text-ink-light hover:text-blush hover:bg-blush/10 hover:border-blush/50",
          variant === "icon" && "flex items-center justify-center w-8 h-8 rounded-xl bg-white/80 border border-caramel/20 text-ink-light hover:text-caramel hover:bg-caramel/10",
          burst && "scale-0 opacity-0 transition-all duration-150",
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-500" />
        <span className="relative z-10">{children}</span>
      </button>
      {shards.map((s) => (
        <div key={s.id} className="absolute left-1/2 top-1/2 pointer-events-none rounded-sm"
          style={{ width: s.size, height: s.size, background: s.color, boxShadow: `0 0 6px ${s.color}`, transition: "all 0.5s ease-out",
            transform: `translate(${s.tx}px, ${s.ty}px) rotate(${s.rot}deg) scale(0.3)`, opacity: 0 }}
          ref={(el) => { if (el) requestAnimationFrame(() => { el.style.transform = `translate(${s.tx}px, ${s.ty}px) rotate(${s.rot}deg) scale(0.5)`; el.style.opacity = "0"; }); }}
        />
      ))}
    </div>
  );
};

/* =============================================
   STAR RATING
   ============================================= */
const StarRating = ({ rating, count }: { rating: number; count: number }) => (
  <div className="flex items-center gap-1">
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("w-3 h-3", i <= Math.round(rating) ? "fill-caramel text-caramel" : "text-caramel/20")} />
      ))}
    </div>
    <span className="text-[10px] text-ink-light/50 font-sans">({count})</span>
  </div>
);

/* =============================================
   PRODUCT CARD — spotlight glow effect
   ============================================= */
const FeaturedCard = ({ product, index }: { product: Product; index: number }) => {
  const { addToWishlist, removeFromWishlist, isWishlisted, addToCart, cartItems } = useShop();
  const wishlisted = isWishlisted(product.id);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHover, setIsHover] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlisted) removeFromWishlist(product.id);
    else addToWishlist({
      productId: product.id, name: product.name, price: product.price,
      original_price: product.original_price, category: product.category_name, category_id: product.category_id,
      average_rating: product.average_rating, review_count: product.review_count,
      discount_percent: product.discount_percent, is_featured: product.is_featured, emoji: "",
    });
  };

  const bgImages = [
    "/images/bg-hands-knitting.jpg",
    "/images/bg-yarn-table.jpg",
    "/images/bg-crochet-pink.jpg",
    "/images/bg-crochet-items.jpg",
  ];
  const primaryImage = product.image_url ?? product.images?.[0] ?? null;
  const inCartQty = cartItems.find((i) => i.productId === product.id)?.quantity ?? 0;
  const remainingStock = Math.max(0, product.stock_quantity - inCartQty);
  const outOfStock = product.stock_quantity <= 0 || remainingStock <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative" /* overflow-visible so heart isn't clipped */
    >
      {/* heart moved inside image area — see below */}

      {/* Card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className={cn(
          "relative rounded-3xl overflow-hidden border border-blush/20",
          "bg-gradient-to-br from-cream-50 to-cream-100",
          "transition-all duration-300 group cursor-pointer",
          isHover ? "shadow-[0_20px_50px_rgba(74,55,40,0.18)] -translate-y-2" : "shadow-card"
        )}
      >
        {/* Cursor glow */}
        {isHover && (
          <div className="absolute inset-0 pointer-events-none z-0"
            style={{ background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(244,184,193,0.2), transparent 60%)` }}
          />
        )}

        {/* Image area */}
        <div className="relative h-52">
          {/* Texture background — NOT overflow-hidden so heart button works */}
          <div className="absolute inset-0 overflow-hidden rounded-t-3xl">
            {primaryImage ? (
              <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <img
                src={bgImages[index % 4]}
                alt="" aria-hidden="true"
                className="w-full h-full object-cover opacity-[0.22]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-cream-50/80 via-blush/8 to-cream-100/86" />
          </div>

          {/* Clickable link overlay — below heart button */}
          <Link href={`/user/shop/${product.id}`} className="absolute inset-0 z-10" aria-label={product.name} />

          {/* Initial circle fallback for products with no image */}
          {!primaryImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className={cn(
                "w-20 h-20 rounded-full border-2 border-blush/25 flex items-center justify-center shadow-soft",
                "bg-gradient-to-br from-blush/35 to-mauve/25",
                "transition-transform duration-500 group-hover:scale-110"
              )}>
                <span className="font-display text-3xl font-semibold text-caramel/80">{product.name.charAt(0)}</span>
              </div>
              <p className="text-xs font-sans font-semibold text-ink-light/40 tracking-wider uppercase">{product.category_name}</p>
            </div>
          )}

          {/* Badges — bottom-left of z-10 layer */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-20 pointer-events-none">
            {product.discount_percent && product.discount_percent > 0 && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-caramel to-rose text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-button">
                <Tag className="w-2.5 h-2.5" /> -{product.discount_percent}%
              </span>
            )}
            {outOfStock && (
              <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                Sold out
              </span>
            )}
            {product.is_featured && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-mauve to-blush text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                <Sparkles className="w-2.5 h-2.5" /> Featured
              </span>
            )}
          </div>

          {/* HEART BUTTON — z-30 beats the link overlay at z-10 */}
          <button
            type="button"
            onClick={handleWishlist}
            className={cn(
              "absolute top-3 right-3 z-30",
              "w-9 h-9 rounded-2xl flex items-center justify-center",
              "transition-all duration-300 border-2 shadow-soft",
              wishlisted
                ? "bg-blush border-blush shadow-[0_0_12px_rgba(244,184,193,0.7)] scale-110"
                : "bg-white/95 border-white/80 hover:border-blush/60 hover:scale-110 hover:bg-blush/10"
            )}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn(
              "w-4 h-4 transition-all duration-200",
              wishlisted ? "fill-white text-white" : "text-rose/60"
            )} />
          </button>

          {/* Quick view hover overlay */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center bg-ink-dark/20 rounded-t-3xl transition-all duration-300 pointer-events-none z-10",
            isHover ? "opacity-100" : "opacity-0"
          )}>
            <span className="flex items-center gap-1.5 text-white text-xs font-semibold font-sans bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Eye className="w-3.5 h-3.5" /> Quick View
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 relative z-10">
          <p className="text-[10px] font-sans font-semibold text-ink-light/50 uppercase tracking-wider mb-1">
            {product.category_name}
          </p>
          <Link href={`/user/shop/${product.id}`}>
            <h3 className="font-display text-sm font-semibold text-ink-dark mb-1.5 leading-snug hover:text-caramel transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[9px] bg-blush/15 text-caramel font-sans font-semibold px-1.5 py-0.5 rounded-md">{tag}</span>
              ))}
            </div>
          )}
          <StarRating rating={product.average_rating} count={product.review_count} />

          {/* Price + actions */}
          <div className="flex items-center justify-between mt-3 gap-2">
            <div>
              <span className="text-base font-bold font-sans text-ink-dark">
                PKR {product.price.toLocaleString()}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-ink-light/35 line-through ml-1.5">
                  PKR {product.original_price.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={outOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  if (outOfStock) return;
                  addToCart({ productId: product.id, name: product.name, price: product.price, original_price: product.original_price, category: product.category_name, category_id: product.category_id, emoji: "" });
                }}
                className={cn("p-2 rounded-xl border transition-all btn-bubble", outOfStock ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed" : "bg-cream-100 border-caramel/20 text-caramel hover:bg-caramel/10")}
                title="Add to cart"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={outOfStock}
                onClick={(e) => { e.stopPropagation(); if (!outOfStock) setShowOrder(true); }}
                className={cn("flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-sans font-bold transition-all btn-bubble",
                  outOfStock ? "bg-red-100 text-red-500 border border-red-200 cursor-not-allowed" : "bg-gradient-to-r from-caramel to-rose text-white shadow-button hover:shadow-button-hover hover:-translate-y-0.5")}
              >
                {outOfStock ? "Sold out" : "Buy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* =============================================
   SECTION HEADING ANIMATION
   ============================================= */
const SectionHeading = ({ label, title, sub }: { label: string; title: string; sub?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="text-center mb-12">
      <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
        className="text-xs font-sans font-semibold text-caramel tracking-widest uppercase mb-2 flex items-center justify-center gap-2">
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-caramel/60 inline-block" />
        {label}
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-caramel/60 inline-block" />
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
        className="font-display text-3xl sm:text-4xl font-semibold text-ink-dark">
        {title}
      </motion.h2>
      {sub && (
        <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm text-ink-light/70 font-sans max-w-lg mx-auto mt-3 leading-relaxed">
          {sub}
        </motion.p>
      )}
      <motion.div initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 0.8, delay: 0.3 }}
        className="yarn-divider w-32 mx-auto mt-4 origin-center" />
    </div>
  );
};

/* =============================================
   MAIN FEATURED PRODUCTS SECTION
   ============================================= */
export const FeaturedProducts = () => {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });

  // Fetch featured products from Supabase
  const [products, setProducts] = useState<Product[]>([]);
  const loadFeaturedProducts = React.useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, original_price, stock_quantity, category_id, category_name:categories(name), average_rating, review_count, tags, is_featured, image_url, images")
      .eq("is_featured", true)
      .eq("is_active", true)
      .limit(6);

    if (data) {
      const mapped = data.map((p: {id:string;name:string;price:number;original_price:number|null;stock_quantity:number|null;category_id:string|null;category_name:{name:string}|null;average_rating:number|null;review_count:number|null;tags:string[]|null;is_featured:boolean;image_url?:string|null;images?:string[]|null}) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        original_price: p.original_price ?? undefined,
        stock_quantity: p.stock_quantity ?? 0,
        category_id: p.category_id ?? undefined,
        category_name: (p.category_name as {name:string}|null)?.name ?? "Uncategorised",
        average_rating: p.average_rating ?? 0,
        review_count: p.review_count ?? 0,
        tags: p.tags ?? [],
        is_featured: p.is_featured,
        image_url: p.image_url ?? undefined,
        images: p.images ?? [],
      }));

      const productIds = mapped.map((p) => p.id);
      if (productIds.length === 0) {
        setProducts(mapped);
        return;
      }

      const { data: reviewRows } = await supabase
        .from("reviews")
        .select("product_id, rating")
        .in("product_id", productIds);

      if (!reviewRows) {
        setProducts(mapped);
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
  }, []);

  useEffect(() => {
    loadFeaturedProducts();
  }, [loadFeaturedProducts]);

  useEffect(() => {
    const timer = setInterval(loadFeaturedProducts, 60000);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadFeaturedProducts();
    };

    window.addEventListener("focus", loadFeaturedProducts);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", loadFeaturedProducts);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadFeaturedProducts]);

  return (
    <section ref={sectionRef} className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-cream-100 to-cream-50/80 overflow-hidden">
      {/* BG decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blush/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-mauve/8 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeading
          label="Featured Collection"
          title="Pieces Made with Heart"
          sub="Each item is hand-crafted with premium yarn, love, and an eye for detail. These are our most-loved pieces."
        />

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {products.map((p, i) => (
            <FeaturedCard key={p.id} product={p} index={i} />
          ))}
        </motion.div>

        {/* Explore more */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex justify-center mt-12"
        >
          <Link
            href="/user/shop?filter=featured"
            className={cn(
              "flex items-center gap-2 px-8 py-3.5 rounded-2xl font-sans font-bold text-sm",
              "border-2 border-caramel/30 text-caramel bg-white/60",
              "hover:bg-gradient-to-r hover:from-caramel hover:to-rose hover:text-white hover:border-transparent",
              "hover:shadow-button-hover hover:-translate-y-0.5",
              "transition-all duration-300 group btn-bubble"
            )}
          >
            Explore All Products
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
