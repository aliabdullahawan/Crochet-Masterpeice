"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, Star, Instagram, Facebook, Play } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

/* =============================================
   TYPES
   ============================================= */
interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category_name: string;
  average_rating: number;
  discount_percent?: number;
  image_url?: string;
  images?: string[];
}

interface SocialCount {
  platform: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  url: string;
}

/* =============================================
   WHATSAPP SVG ICON
   ============================================= */
const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.799 9.799 0 0 1-5.003-1.374l-.358-.213-3.742.981.999-3.648-.235-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
  </svg>
);

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.2 8.2 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

/* =============================================
   ANIMATED COUNTER
   ============================================= */
const AnimatedCounter = ({ target, duration = 2000 }: { target: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const step = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{formatNumber(count)}</span>;
};

/* =============================================
   SOCIAL STAT CARD
   ============================================= */
const SocialCard = ({ platform, count, icon, color, url }: SocialCount) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-2xl",
      "glass border border-white/40 hover:border-blush/40",
      "transition-all duration-300 hover:-translate-y-1 hover:shadow-card",
      "group cursor-pointer btn-bubble"
    )}
  >
    <div
      className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110", color)}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm font-bold font-sans text-ink-dark leading-none">
        <AnimatedCounter target={count} />
      </p>
      <p className="text-[10px] text-ink-light/60 font-sans mt-0.5">{platform}</p>
    </div>
  </a>
);

/* =============================================
   PRODUCT CARD (carousel item)
   ============================================= */
const ProductCard = ({
  product,
  index,
}: {
  product: Product;
  index: number;
}) => {
  const [hovered, setHovered] = useState(false);
  const primaryImage = product.image_url ?? product.images?.[0] ?? null;

  return (
    <motion.div
      className="flex-shrink-0 w-[260px] sm:w-[300px] cursor-pointer"
      whileHover={{ scale: 1.04, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Link href={`/user/shop/${product.id}`}>
        <div className={cn(
          "relative rounded-3xl overflow-hidden",
          "border border-blush/20",
          "shadow-card transition-shadow duration-300",
          hovered ? "shadow-[0_20px_50px_rgba(74,55,40,0.2)]" : ""
        )}
          style={{ height: "340px" }}
        >
          {/* Product image / placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-cream-100 via-blush/20 to-mauve/20">
            {primaryImage && (
              <img src={primaryImage} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
            )}

            {!primaryImage && (
              <>
                {/* Decorative yarn pattern as placeholder */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 300 340">
                  <circle cx="150" cy="170" r="120" stroke="#C8956C" strokeWidth="2" fill="none" strokeDasharray="8 5" />
                  <circle cx="150" cy="170" r="80" stroke="#F4B8C1" strokeWidth="1.5" fill="none" strokeDasharray="5 8" />
                  <circle cx="150" cy="170" r="40" stroke="#C9A0DC" strokeWidth="1" fill="rgba(244,184,193,0.2)" />
                </svg>

                {/* Initial circle fallback */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blush/35 to-mauve/25 border-2 border-blush/25 flex items-center justify-center shadow-soft">
                    <span className="font-display text-2xl font-semibold text-caramel/80">{product.name.charAt(0)}</span>
                  </div>
                  <p className="text-[10px] font-sans font-semibold text-ink-light/40 tracking-wider uppercase">{product.category_name}</p>
                </div>
              </>
            )}

            {/* Cream gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cream-50/80 via-blush/10 to-cream-100/88" />
          </div>

          {/* Discount badge */}
          {product.discount_percent && product.discount_percent > 0 && (
            <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-caramel to-rose text-white text-[11px] font-bold font-sans px-2 py-1 rounded-xl shadow-button animate-pulse-soft">
              -{product.discount_percent}%
            </div>
          )}

          {/* Hover overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-ink-dark/70 via-ink-dark/20 to-transparent z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Quick buy button — appears on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                className="absolute bottom-4 left-4 right-4 z-20"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
              >
                <button className={cn(
                  "w-full py-2.5 rounded-xl text-xs font-sans font-bold text-white",
                  "bg-gradient-to-r from-caramel to-rose",
                  "flex items-center justify-center gap-2",
                  "btn-bubble shadow-button"
                )}>
                  <ShoppingBag className="w-3.5 h-3.5" /> View Product
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info bar (always visible) */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 z-10 p-4",
            "bg-gradient-to-t from-white/95 to-transparent",
            "transition-all duration-300",
            hovered ? "pb-16" : "pb-4"
          )}>
            <p className="text-[10px] text-ink-light/60 font-sans uppercase tracking-wider mb-0.5">
              {product.category_name}
            </p>
            <p className="text-sm font-display font-semibold text-ink-dark leading-tight truncate">
              {product.name}
            </p>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1">
                {product.original_price && product.original_price > product.price ? (
                  <>
                    <span className="text-sm font-bold text-caramel">PKR {product.price.toLocaleString()}</span>
                    <span className="text-xs text-ink-light/40 line-through">PKR {product.original_price.toLocaleString()}</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-caramel">PKR {product.price.toLocaleString()}</span>
                )}
              </div>
              <div className="flex items-center gap-0.5 text-caramel">
                <Star className="w-3 h-3 fill-caramel" />
                <span className="text-xs font-semibold font-sans">{product.average_rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Spotlight glow follows hover */}
          {hovered && (
            <div className="absolute inset-0 pointer-events-none z-0"
              style={{
                background: "radial-gradient(circle at 50% 30%, rgba(244,184,193,0.25) 0%, transparent 60%)"
              }}
            />
          )}
        </div>
      </Link>
    </motion.div>
  );
};

/* =============================================
   INFINITE SCROLL CAROUSEL
   ============================================= */
const ProductCarousel = ({ products }: { products: Product[] }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(Math.max(products.length * 4, 20));

  const doubled = [...products, ...products];

  useEffect(() => {
    const syncSpeed = () => {
      const w = window.innerWidth;
      const secondsPerCard = w < 640 ? 3.0 : w < 1024 ? 3.6 : 4.6;
      setDuration(Math.max(products.length * secondsPerCard, 16));
    };

    syncSpeed();
    window.addEventListener("resize", syncSpeed);
    return () => window.removeEventListener("resize", syncSpeed);
  }, [products.length]);

  if (!products.length) return null;

  return (
    <div className="relative w-full overflow-hidden">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-cream-100 via-cream-100/85 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-cream-100 via-cream-100/85 to-transparent z-10 pointer-events-none" />

      <div
        ref={trackRef}
        className="flex gap-5 py-5 px-8"
        style={{
          animation: `carouselScroll ${duration}s linear infinite`,
          width: "max-content",
          willChange: "transform",
        }}
      >
        {doubled.map((product, i) => (
          <ProductCard key={`${product.id}-${i}`} product={product} index={i} />
        ))}
      </div>

      <style jsx>{`
        @keyframes carouselScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

/* =============================================
   FLOATING YARN DECORATION
   ============================================= */
const FloatingYarn = ({ style, color }: { style: React.CSSProperties; color: string }) => (
  <motion.div
    className="absolute pointer-events-none select-none"
    style={style}
    animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
  >
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="22" fill={color} fillOpacity="0.15" />
      <circle cx="30" cy="30" r="22" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
      <path d={`M 20 24 Q 30 16 40 24 Q 30 32 20 24`} stroke={color} strokeWidth="1" fill="none" strokeOpacity="0.5" />
      <path d={`M 20 36 Q 30 44 40 36 Q 30 28 20 36`} stroke={color} strokeWidth="1" fill="none" strokeOpacity="0.4" />
    </svg>
  </motion.div>
);

/* =============================================
   MAIN HERO SECTION
   ============================================= */
export const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.97]);

  // ── Fetch real social counts from /api/social-counts ──
  // That route tries official APIs first, falls back to admin-set values in Supabase
  const [socialData, setSocialData] = useState({
    whatsapp: 0, instagram: 0, facebook: 0, tiktok: 0,
    site_users: 0, total_community: 0,
  });
  const [countsLoaded, setCountsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSocialCounts = async () => {
      try {
        const r = await fetch("/api/social-counts", { cache: "no-store" });
        const d = await r.json();
        if (!active) return;
        setSocialData({
          whatsapp:        d.whatsapp?.count       ?? 0,
          instagram:       d.instagram?.count      ?? 0,
          facebook:        d.facebook?.count       ?? 0,
          tiktok:          d.tiktok?.count         ?? 0,
          site_users:      d.site_users?.count     ?? 0,
          total_community: d.total_community?.count ?? 0,
        });
      } catch {
        // Silent fail — keep previous values.
      } finally {
        if (active) setCountsLoaded(true);
      }
    };

    loadSocialCounts();
    const timer = setInterval(loadSocialCounts, 10000);
    const onFocus = () => loadSocialCounts();
    window.addEventListener("focus", onFocus);

    const channel = supabase
      .channel("hero-live-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => {
        loadSocialCounts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "discounts" }, () => {
        loadSocialCounts();
      })
      .subscribe();

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  // Products — fetched from Supabase
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, price, original_price, is_featured, average_rating, categories(name), image_url, images")
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(6)
      .then(({ data }) => {
        if (data) setProducts(data.map((p: {id:string;name:string;price:number;original_price:number|null;average_rating:number;categories:{name:string}|null;image_url?:string|null;images?:string[]|null}) => ({
          id: p.id, name: p.name, price: p.price,
          original_price: p.original_price ?? undefined,
          category_name: (p.categories as {name:string}|null)?.name ?? "",
          average_rating: p.average_rating,
          image_url: p.image_url ?? undefined,
          images: p.images ?? [],
        })));
      });
  }, []);

  const socialCounts: SocialCount[] = [
    {
      platform: "WhatsApp", count: socialData.whatsapp,
      icon: <WhatsAppIcon size={18} />,
      color: "bg-[#25D366]",
      url: "https://whatsapp.com/channel/0029VbBXbGv9WtC90s3UER04",
    },
    {
      platform: "Instagram", count: socialData.instagram,
      icon: <Instagram size={18} />,
      color: "bg-gradient-to-br from-[#E1306C] to-[#833AB4]",
      url: "https://www.instagram.com/croch_etmasterpiece",
    },
    {
      platform: "Facebook", count: socialData.facebook,
      icon: <Facebook size={18} />,
      color: "bg-[#1877F2]",
      url: "https://www.facebook.com/profile.php?id=61579353555271",
    },
    {
      platform: "TikTok", count: socialData.tiktok,
      icon: <TikTokIcon size={18} />,
      color: "bg-ink-dark",
      url: "https://www.tiktok.com/@croch_et.masterpiece",
    },
  ];

  const totalCommunity = socialData.total_community;

  // Text cycling animation
  const heroTexts = [
    "Made with hands, sent with heart",
    "No two pieces are ever the same",
    "Your custom order is my favourite kind",
    "Stitched slowly. Worth the wait.",
  ];
  const [textIndex, setTextIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTextIndex((i) => (i + 1) % heroTexts.length), 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden"
    >
      {/* ── Full-bleed background image carousel with soft overlay ── */}
      {/* Like crochet.com - real photos fill the section, text sits above */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Three real crochet photos side by side — each covers 1/3 of the width */}
        <img src="/images/crochet-1.jpg" alt="" aria-hidden="true"
          className="absolute top-0 left-0 w-1/3 h-full object-cover" />
        <img src="/images/crochet-5.jpg" alt="" aria-hidden="true"
          className="absolute top-0 left-1/3 w-1/3 h-full object-cover" />
        <img src="/images/crochet-4.jpg" alt="" aria-hidden="true"
          className="absolute top-0 right-0 w-1/3 h-full object-cover" />
        {/* Cream gradient overlay — keeps text readable while showing photos */}
        <div className="absolute inset-0 bg-gradient-to-br from-cream-100/82 via-cream-100/72 to-cream-100/80" />
        {/* Extra fade at the very top for navbar contrast */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cream-100/70 to-transparent" />
      </div>
      {/* ── Subtle background decorations ── */}
      <FloatingYarn style={{ top: "8%", left: "3%", opacity: 0.35 }} color="#F4B8C1" />
      <FloatingYarn style={{ top: "15%", right: "5%", opacity: 0.3 }} color="#C9A0DC" />
      <FloatingYarn style={{ bottom: "20%", left: "8%", opacity: 0.25 }} color="#C8956C" />
      <FloatingYarn style={{ top: "50%", right: "2%", opacity: 0.2 }} color="#E8A0A8" />

      {/* Large soft orb behind text */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          y: y1,
          background: "radial-gradient(circle, rgba(244,184,193,0.25) 0%, rgba(201,160,220,0.1) 40%, transparent 70%)",
        }}
      />

      {/* ── Main content ── */}
      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8"
      >
        {/* Tag line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="flex items-center gap-2 bg-blush/20 border border-blush/40 rounded-full px-4 py-1.5">
            <span className="text-xs font-sans font-semibold text-caramel tracking-widest uppercase">New Collection</span>
            <span className="w-1 h-1 rounded-full bg-caramel/50" />
            <span className="text-xs font-sans text-ink-light/70">Summer 2025</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-4"
        >
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-ink-dark leading-tight">
            <span className="block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={textIndex}
                  className="inline-block text-gradient-blush"
                  initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {heroTexts[textIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-center text-base sm:text-lg text-ink-light/80 font-sans max-w-xl mx-auto mb-8 leading-relaxed"
        >
          I make every piece by hand — slowly, carefully, the way it should be done.
          <span className="font-script text-caramel text-lg"> Just a girl who loves crochet.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
        >
          <Link
            href="/user/shop"
            className={cn(
              "flex items-center gap-2 px-7 py-3.5 rounded-2xl",
              "bg-gradient-to-r from-caramel via-rose to-blush",
              "text-white text-sm font-sans font-bold tracking-wide",
              "shadow-button hover:shadow-button-hover hover:-translate-y-0.5",
              "transition-all duration-300 btn-bubble relative overflow-hidden group"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <ShoppingBag className="w-4 h-4" />
            Shop Now
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/user/custom-order"
            className={cn(
              "flex items-center gap-2 px-7 py-3.5 rounded-2xl",
              "bg-white/70 border border-caramel/20",
              "text-ink text-sm font-sans font-semibold",
              "hover:bg-white hover:border-blush/40 hover:-translate-y-0.5",
              "transition-all duration-300 btn-bubble"
            )}
          >
            <span className="text-base">✂️</span>
            Custom Order
          </Link>
        </motion.div>

        {/* Social stats — moved BELOW product carousel via lower z-index + margin */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-wrap justify-center gap-3 mt-4 pb-2"
        >
          {socialCounts.map((s) => (
            <SocialCard key={s.platform} {...s} />
          ))}
          {/* Total community */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl glass border border-caramel/20">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blush to-mauve flex items-center justify-center text-white text-sm font-bold font-display">
              C
            </div>
            <div>
              <p className="text-sm font-bold font-sans text-ink-dark leading-none">
                <AnimatedCounter target={totalCommunity} />
              </p>
              <p className="text-[10px] text-ink-light/60 font-sans mt-0.5">Total Community</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Product Carousel — First visible section ── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{ y: y2 }}
        className="relative z-10 w-full pb-8"
      >
        {/* Section label */}
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
          <div>
            <p className="text-xs font-sans font-semibold text-ink-light/50 tracking-widest uppercase mb-0.5">Featured Collection</p>
            <h2 className="font-display text-xl font-semibold text-ink-dark">Our Best Pieces</h2>
          </div>
          <Link
            href="/user/shop?filter=featured"
            className="flex items-center gap-1.5 text-xs font-sans font-semibold text-caramel hover:text-ink transition-colors group"
          >
            Explore all
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        <ProductCarousel products={products} />
      </motion.div>

      
      <motion.div
        style={{ opacity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <p className="text-xs text-ink-light/40 font-sans tracking-widest uppercase">Scroll to explore</p>
        <div className="w-5 h-8 rounded-full border-[1.5px] border-caramel/30 flex items-start justify-center p-1">
          <motion.div
            className="w-1 h-1.5 rounded-full bg-caramel/60"
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
