"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, Star, Instagram, Facebook, Play } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { getHiddenReviewIdSet, isReviewHiddenByModeration } from "@/lib/reviewModeration";

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const from = count;
    const to = Math.max(0, Number(target) || 0);
    const start = Date.now();

    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.floor(from + (to - from) * eased);
      setCount(next);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, duration, isVisible]);

  return <span ref={ref}>{formatNumber(count)}</span>;
};

/* =============================================
   SOCIAL STAT CHIP
   ============================================= */
const SocialChip = ({ platform, count, icon, color, url }: SocialCount) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "flex items-center gap-2.5 px-3.5 py-2 rounded-2xl",
      "bg-white/80 border border-white/60 hover:border-blush/50",
      "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
      "group cursor-pointer"
    )}
  >
    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 shrink-0", color)}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-bold font-sans text-ink-dark leading-none">
        <AnimatedCounter target={count} />
      </p>
      <p className="text-[10px] text-ink-light/55 font-sans mt-0.5">{platform}</p>
    </div>
  </a>
);

/* =============================================
   PHOTO GRID CARD (reference-inspired)
   ============================================= */
const PhotoCard = ({
  img, label, sub, cta, ctaHref, tall = false,
}: {
  img: string; label: string; sub?: string; cta?: string; ctaHref?: string; tall?: boolean;
}) => (
  <div
    className={cn(
      "relative rounded-2xl overflow-hidden group cursor-pointer",
      tall ? "row-span-2" : "row-span-1"
    )}
    style={{ minHeight: tall ? 360 : 170 }}
  >
    <img src={img} alt={label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
    <div className="absolute inset-0 bg-linear-to-t from-ink-dark/75 via-ink-dark/20 to-transparent" />
    <div className="absolute inset-0 p-5 flex flex-col justify-end">
      <p className="text-white font-display text-xl font-semibold leading-tight mb-1">{label}</p>
      {sub && <p className="text-white/70 text-xs font-sans mb-3">{sub}</p>}
      {cta && ctaHref && (
        <Link
          href={ctaHref}
          className="w-fit inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/95 text-ink-dark text-xs font-sans font-bold hover:bg-white transition-all shadow-sm group-hover:-translate-y-0.5"
        >
          {cta} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  </div>
);

/* =============================================
   PRODUCT CAROUSEL CARD
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
      className="shrink-0 w-[240px] sm:w-[270px] cursor-pointer"
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Link href={`/user/shop/${product.id}`}>
        <div className={cn(
          "relative rounded-2xl overflow-hidden border border-blush/20",
          "shadow-sm transition-shadow duration-300",
          hovered ? "shadow-[0_16px_40px_rgba(74,55,40,0.18)]" : ""
        )}
          style={{ height: "300px" }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-cream-100 via-blush/20 to-mauve/20">
            {primaryImage && (
              <img src={primaryImage} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
            )}
            {!primaryImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-blush/35 to-mauve/25 border-2 border-blush/25 flex items-center justify-center shadow-soft">
                  <span className="font-display text-2xl font-semibold text-caramel/80">{product.name.charAt(0)}</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-br from-cream-50/60 via-blush/10 to-cream-100/70" />
          </div>

          {product.discount_percent && product.discount_percent > 0 && (
            <div className="absolute top-3 left-3 z-10 bg-linear-to-r from-caramel to-rose text-white text-[11px] font-bold font-sans px-2 py-1 rounded-xl shadow-button">
              -{product.discount_percent}%
            </div>
          )}

          <motion.div
            className="absolute inset-0 bg-linear-to-t from-ink-dark/65 via-ink-dark/15 to-transparent z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

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
                  "bg-linear-to-r from-caramel to-rose",
                  "flex items-center justify-center gap-2",
                  "btn-bubble shadow-button"
                )}>
                  <ShoppingBag className="w-3.5 h-3.5" /> View Product
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={cn(
            "absolute bottom-0 left-0 right-0 z-10 p-4",
            "bg-linear-to-t from-white/95 to-transparent",
            "transition-all duration-300",
            hovered ? "pb-16" : "pb-4"
          )}>
            <p className="text-[10px] text-ink-light/60 font-sans uppercase tracking-wider mb-0.5">{product.category_name}</p>
            <p className="text-sm font-display font-semibold text-ink-dark leading-tight truncate">{product.name}</p>
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
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-cream-100 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-cream-100 to-transparent z-10 pointer-events-none" />
      <div
        ref={trackRef}
        className="flex gap-4 py-5 px-8"
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
   MAIN HERO SECTION
   ============================================= */
export const HeroSection = () => {
  // ── Social counts
  const [socialData, setSocialData] = useState({
    whatsapp: 0, instagram: 0, facebook: 0, tiktok: 0, site_users: 0, total_community: 0,
  });

  useEffect(() => {
    let active = true;
    const loadManualCounts = async () => {
      type Row = { key: string; value: string | null };
      const [{ data: settings }, { count: usersCount }] = await Promise.all([
        supabase.from("site_settings").select("key,value").in("key", [
          "instagram_count_manual", "facebook_count_manual",
          "tiktok_count_manual", "whatsapp_count_manual",
        ]) as unknown as Promise<{ data: Row[] | null }>,
        supabase.from("users").select("*", { count: "exact", head: true }),
      ]);
      const get = (key: string) => {
        const raw = (settings as Row[] | null)?.find((s) => s.key === key)?.value;
        const n = parseInt(raw ?? "", 10);
        return Number.isFinite(n) ? n : 0;
      };
      const wa = get("whatsapp_count_manual");
      const ig = get("instagram_count_manual");
      const fb = get("facebook_count_manual");
      const tt = get("tiktok_count_manual");
      const su = (usersCount as number | null) ?? 0;
      return { whatsapp: wa, instagram: ig, facebook: fb, tiktok: tt, site_users: su, total_community: wa + ig + fb + tt + su };
    };

    const load = async () => {
      try {
        const r = await fetch("/api/social-counts", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!active) return;
        const next = {
          whatsapp: d.whatsapp?.count ?? 0, instagram: d.instagram?.count ?? 0,
          facebook: d.facebook?.count ?? 0, tiktok: d.tiktok?.count ?? 0,
          site_users: d.site_users?.count ?? 0, total_community: d.total_community?.count ?? 0,
        };
        if (!next.whatsapp && !next.instagram && !next.facebook && !next.tiktok) {
          const m = await loadManualCounts(); if (!active) return; setSocialData(m);
        } else { setSocialData(next); }
      } catch {
        const m = await loadManualCounts(); if (!active) return; setSocialData(m);
      }
    };

    load();
    const timer = setInterval(load, 10000);
    window.addEventListener("focus", load);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", load); };
  }, []);

  // ── Products
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    const loadHeroProducts = async () => {
      const sel = "id, name, price, original_price, is_featured, average_rating, categories(name), image_url, images";
      let { data } = await supabase.from("products").select(sel).eq("is_active", true).eq("is_featured", true).limit(8);
      if (!data?.length) {
        const fb = await supabase.from("products").select(sel).eq("is_active", true).order("created_at", { ascending: false }).limit(8);
        data = fb.data;
      }
      if (!data?.length) return;

      type PR = { id: string; name: string; price: number; original_price: number | null; average_rating: number | null; categories: { name: string } | null; image_url?: string | null; images?: string[] | null };
      const mapped = (data as PR[]).map((p) => ({
        id: p.id, name: p.name, price: p.price, original_price: p.original_price ?? undefined,
        category_name: p.categories?.name ?? "", average_rating: p.average_rating ?? 0,
        image_url: p.image_url ?? undefined, images: p.images ?? [],
      }));

      const pids = mapped.map((p) => p.id);
      if (!pids.length) { setProducts(mapped); return; }

      const hiddenIds = await getHiddenReviewIdSet();
      type RR = { id: string; product_id: string; rating: number; admin_reply?: string | null };
      const { data: revData } = await supabase.from("reviews").select("id, product_id, rating, admin_reply").in("product_id", pids);
      const reviewRows = (revData ?? []) as RR[];

      const stats = new Map<string, { sum: number; count: number }>();
      for (const row of reviewRows) {
        if (isReviewHiddenByModeration(row.id, row.admin_reply, hiddenIds)) continue;
        const cur = stats.get(row.product_id) ?? { sum: 0, count: 0 };
        stats.set(row.product_id, { sum: cur.sum + (Number(row.rating) || 0), count: cur.count + 1 });
      }

      setProducts(mapped.map((p) => {
        const s = stats.get(p.id);
        return s && s.count > 0 ? { ...p, average_rating: Number((s.sum / s.count).toFixed(1)) } : p;
      }));
    };
    void loadHeroProducts();
  }, []);

  const totalCommunity = socialData.total_community > 0
    ? socialData.total_community
    : socialData.whatsapp + socialData.instagram + socialData.facebook + socialData.tiktok + socialData.site_users;

  const socialCounts: SocialCount[] = [
    { platform: "WhatsApp", count: socialData.whatsapp, icon: <WhatsAppIcon size={16} />, color: "bg-[#25D366]", url: "https://whatsapp.com/channel/0029VbBXbGv9WtC90s3UER04" },
    { platform: "Instagram", count: socialData.instagram, icon: <Instagram size={16} />, color: "bg-linear-to-br from-[#E1306C] to-[#833AB4]", url: "https://www.instagram.com/croch_etmasterpiece" },
    { platform: "Facebook", count: socialData.facebook, icon: <Facebook size={16} />, color: "bg-[#1877F2]", url: "https://www.facebook.com/profile.php?id=61579353555271" },
    { platform: "TikTok", count: socialData.tiktok, icon: <TikTokIcon size={16} />, color: "bg-ink-dark", url: "https://www.tiktok.com/@croch_et.masterpiece" },
  ];

  // Cycling headline text
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

  const stripImages = [
    "/images/bg-crochet-pink.jpg",
    "/images/crochet-3.jpg",
    "/images/bg-hands-knitting.jpg",
    "/images/crochet-4.jpg",
    "/images/bg-yarn-table.jpg",
    "/images/crochet-6.jpg",
  ];

  const [fadeIndex, setFadeIndex] = useState(0);
  useEffect(() => {
    const fadeTimer = setInterval(() => {
      setFadeIndex((i) => (i + 1) % stripImages.length);
    }, 4000); // 4 seconds per image
    return () => clearInterval(fadeTimer);
  }, [stripImages.length]);

  return (
    <section className="relative overflow-hidden bg-cream-100">
      {/* ═══════════════════════════════════
          UPPER HERO — Split Layout (LIHMON/Kindred inspired)
          ═══════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 min-h-[85vh] lg:min-h-[88vh]">
        {/* LEFT — large hero image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden lg:min-h-full min-h-[50vw]"
        >
          <AnimatePresence mode="popLayout">
            <motion.img
              key={fadeIndex}
              src={stripImages[fadeIndex]}
              alt={`Crochet Masterpiece Gallery ${fadeIndex + 1}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-linear-to-r from-ink-dark/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-ink-dark/30 via-transparent to-transparent" />

          {/* Floating info card — bottom-left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="absolute bottom-8 left-6 max-w-[200px] bg-white/92 backdrop-blur-sm rounded-2xl p-4 shadow-card border border-white/60"
          >
            <p className="text-[9px] text-ink-light/55 font-sans uppercase tracking-widest mb-1">Signature line</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={textIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
                className="text-xs font-sans font-semibold text-ink-dark leading-snug"
              >
                {heroTexts[textIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>

        </motion.div>

        {/* RIGHT — headline + CTAs */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-16 lg:py-20 bg-cream-100"
        >
          {/* Label tag */}
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 self-start bg-blush/20 border border-blush/35 rounded-full px-4 py-1.5 text-[11px] font-sans font-bold text-caramel uppercase tracking-widest mb-6"
          >
            Handmade Originals · Pakistan
          </motion.span>

          {/* Main headline - H1 optimized for SEO (no initial opacity 0) */}
          <motion.h1
            initial={{ y: 24 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="font-display text-5xl sm:text-6xl lg:text-[4.5rem] font-semibold text-ink-dark leading-[1.08] mb-6"
          >
            Crochet that
            <span className="block text-gradient-blush">feels like a</span>
            warm hug.
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-base text-ink-light/75 font-sans max-w-sm leading-relaxed mb-3"
          >
            I craft every piece slowly and carefully, with yarn I love and patterns I test by hand.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="font-script text-caramel text-xl mb-8"
          >
            Just a girl who loves crochet.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {["Pakistan-wide delivery", "Custom orders welcome", "Limited weekly batches"].map((l) => (
              <span key={l} className="px-3 py-1.5 rounded-full border border-caramel/20 bg-white/70 text-[11px] font-sans font-semibold text-ink-light/70">
                {l}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/user/shop"
              className={cn(
                "flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl",
                "bg-ink-dark text-white text-sm font-sans font-bold tracking-wide",
                "hover:bg-ink hover:-translate-y-0.5 transition-all duration-300 shadow-lg"
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              Shop Bestsellers
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/user/custom-order"
              className={cn(
                "flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl",
                "bg-white border-2 border-caramel/20 text-ink text-sm font-sans font-semibold",
                "hover:border-caramel/50 hover:-translate-y-0.5 transition-all duration-300"
              )}
            >
              <span>✂️</span>
              Start Custom Order
            </Link>
          </motion.div>

        </motion.div>
      </div>

      {/* ═══════════════════════════════════
          SOCIAL CHIPS ROW (Below Hero, Above Fading Image)
          ═══════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="w-full bg-cream-100 py-8 border-t border-caramel/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          {socialCounts.map((s) => (
            <SocialChip key={s.platform} {...s} />
          ))}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-white/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blush to-mauve flex items-center justify-center text-white text-xs font-bold font-display">C</div>
            <div>
              <p className="text-sm font-bold font-sans text-ink-dark leading-none"><AnimatedCounter target={totalCommunity} /></p>
              <p className="text-[10px] text-ink-light/55 font-sans mt-0.5">Community</p>
            </div>
          </div>
        </div>
      </motion.div>



      {/* ═══════════════════════════════════
          CARD GRID — Yoga/Serenity inspired
          ═══════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 auto-rows-[180px]">
          {/* Large card */}
          <div className="sm:col-span-2 sm:row-span-2" style={{ minHeight: 360 }}>
            <PhotoCard
              img="/images/crochet-2.jpg"
              label="Explore the Full Collection"
              sub="Handmade pieces for every occasion"
              cta="Shop now"
              ctaHref="/user/shop"
              tall
            />
          </div>
          {/* Small card 1 */}
          <PhotoCard
            img="/images/bg-crochet-pink.jpg"
            label="Improved Comfort"
            sub="Soft yarns, gentle on skin"
            cta="Discover"
            ctaHref="/user/shop"
          />
          {/* Small card 2 */}
          <div className="relative rounded-2xl overflow-hidden bg-ink-dark group" style={{ minHeight: 180 }}>
            <img src="/images/crochet-5.jpg" alt="Custom crochet" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-500 group-hover:scale-105 transform-gpu" />
            <div className="absolute inset-0 bg-linear-to-t from-ink-dark/80 via-ink-dark/40 to-transparent" />
            <div className="absolute inset-0 p-5 flex flex-col justify-end gap-3">
              <p className="text-white font-display text-lg font-semibold leading-tight">Start your custom order</p>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Describe your idea..."
                  className="flex-1 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/50 outline-none focus:border-white/50 transition"
                />
                <Link
                  href="/user/custom-order"
                  className="shrink-0 px-3 py-2 rounded-xl bg-white text-ink-dark text-xs font-bold hover:bg-cream-100 transition"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          PRODUCT CAROUSEL
          ═══════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="relative z-10 w-full pb-10"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
          <div>
            <p className="text-xs font-sans font-semibold text-ink-light/50 tracking-widest uppercase mb-0.5">Featured Collection</p>
            <h2 className="font-display text-xl font-semibold text-ink-dark">Our Best Pieces</h2>
          </div>
          <Link href="/user/shop?filter=featured" className="flex items-center gap-1.5 text-xs font-sans font-semibold text-caramel hover:text-ink transition-colors group">
            Explore all
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
        <ProductCarousel products={products} />
      </motion.div>
    </section>
  );
};

export default HeroSection;
