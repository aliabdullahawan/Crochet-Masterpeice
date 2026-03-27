"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

/* =============================================
   TYPES
   ============================================= */
interface Review {
  id: string;
  user_name: string;
  avatar_emoji: string;
  avatar_bg: string;
  rating: number;
  comment: string;
  product_name: string;
  product_id: string;
  product_emoji: string;
  date: string;
}

/* =============================================
   STAR DISPLAY
   ============================================= */
const Stars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={cn("w-4 h-4", i <= rating ? "fill-caramel text-caramel" : "text-caramel/20")} />
    ))}
  </div>
);

/* =============================================
   SINGLE REVIEW CARD (stagger-style with angled cut)
   ============================================= */
const ReviewCard = ({
  review, position, onClick, cardSize,
}: {
  review: Review;
  position: number;
  onClick: () => void;
  cardSize: number;
}) => {
  const isCenter = position === 0;
  const SQRT5000 = Math.sqrt(5000);

  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer transition-all duration-500 ease-out",
        "border-2 p-6",
        isCenter
          ? "z-20 bg-gradient-to-br from-cream-50 to-white border-caramel/30"
          : "z-10 bg-cream-100/80 border-blush/20 hover:border-blush/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(40px 0%, calc(100% - 40px) 0%, 100% 40px, 100% 100%, calc(100% - 40px) 100%, 40px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -55 : position % 2 ? 10 : -10}px)
          rotate(${isCenter ? 0 : position % 2 ? 2 : -2}deg)
        `,
        boxShadow: isCenter
          ? "0 8px 0 4px rgba(244,184,193,0.4)"
          : "0 0 0 0 transparent",
      }}
    >
      {/* Angled cut decoration */}
      <span className="absolute block origin-top-right rotate-45 bg-blush/20"
        style={{ right: -2, top: 38, width: SQRT5000, height: 2 }} />

      {/* Quote icon */}
      <div className="mb-3">
        <Quote className={cn("w-6 h-6", isCenter ? "text-caramel/40" : "text-blush/30")} />
      </div>

      {/* Stars */}
      <Stars rating={review.rating} />

      {/* Review text */}
      <p className={cn(
        "mt-3 text-sm font-sans leading-relaxed line-clamp-3",
        isCenter ? "text-ink" : "text-ink-light/60"
      )}>
        &ldquo;{review.comment}&rdquo;
      </p>

      {/* Product reference */}
      <Link
        href={`/user/shop/${review.product_id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 mt-3 group"
      >
        <span className="text-lg">{review.product_emoji}</span>
        <span className={cn(
          "text-xs font-sans font-semibold transition-colors duration-200",
          isCenter ? "text-caramel group-hover:text-ink" : "text-ink-light/40"
        )}>
          {review.product_name}
        </span>
      </Link>

      {/* Author */}
      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm", review.avatar_bg)}>
            {review.avatar_emoji}
          </div>
          <div>
            <p className={cn("text-xs font-sans font-semibold", isCenter ? "text-ink-dark" : "text-ink-light/50")}>
              {review.user_name}
            </p>
            <p className="text-[10px] text-ink-light/40 font-sans">{review.date}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =============================================
   MAIN REVIEWS SECTION
   ============================================= */
export const ReviewsSection = () => {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });
  const [cardSize, setCardSize] = useState(340);

  const [reviews, setReviews] = useState<Review[]>([]);

  const loadLatestReviews = React.useCallback(async () => {
    const { data: reviewRows, error } = await supabase
      .from("reviews")
      .select("id, user_name, rating, comment, product_id, created_at")
      .order("created_at", { ascending: false })
      .limit(15);

    if (error || !reviewRows || reviewRows.length === 0) {
      setReviews([]);
      return;
    }

    const productIds = Array.from(new Set(reviewRows.map((r) => r.product_id).filter(Boolean)));
    const { data: productRows } = await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds);

    const productNames = new Map<string, string>(
      (productRows ?? []).map((p: { id: string; name: string | null }) => [p.id, p.name ?? "Product"])
    );

    const avatarBackgrounds = [
      "bg-gradient-to-br from-blush/30 to-mauve/20",
      "bg-gradient-to-br from-caramel/20 to-rose/25",
      "bg-gradient-to-br from-mauve/25 to-cream-100",
      "bg-gradient-to-br from-rose/20 to-blush/20",
    ];

    const productEmojis = ["🧶", "🌸", "✨", "🧵", "💝", "🎀"];

    setReviews(
      reviewRows.map((r, i) => ({
        id: r.id,
        user_name: r.user_name || "Customer",
        avatar_emoji: productEmojis[i % productEmojis.length],
        avatar_bg: avatarBackgrounds[i % avatarBackgrounds.length],
        rating: Math.max(1, Math.min(5, Number(r.rating) || 0)),
        comment: r.comment || "Loved this handmade piece.",
        product_name: productNames.get(r.product_id) ?? "Crochet Product",
        product_id: r.product_id,
        product_emoji: productEmojis[(i + 2) % productEmojis.length],
        date: new Date(r.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }),
      }))
    );
  }, []);

  const move = (steps: number) => {
    const newList = [...reviews];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (item) newList.push({ ...item, id: `${item.id}-next-${Date.now()}` });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (item) newList.unshift({ ...item, id: `${item.id}-prev-${Date.now()}` });
      }
    }
    setReviews(newList);
  };

  // Responsive card size
  React.useEffect(() => {
    const update = () => setCardSize(window.innerWidth >= 640 ? 340 : 270);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    void loadLatestReviews();

    const channel = supabase
      .channel("home-reviews-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        void loadLatestReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLatestReviews]);

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden bg-gradient-to-b from-cream-50 to-cream-100">
      {/* Decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-mauve/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-blush/10 blur-3xl pointer-events-none" />

      {/* Heading */}
      <div className="text-center px-4 mb-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-xs font-sans font-semibold text-caramel tracking-widest uppercase mb-2 flex items-center justify-center gap-2"
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-caramel/60 inline-block" />
          Customer Love
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-caramel/60 inline-block" />
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-3xl sm:text-4xl font-semibold text-ink-dark"
        >
          What Our Customers Say
        </motion.h2>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="yarn-divider w-32 mx-auto mt-4 origin-center"
        />
      </div>

      {/* Cards stage */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative w-full overflow-hidden"
        style={{ height: cardSize + 120 }}
      >
        {reviews.length === 0 && (
          <div className="h-full flex items-center justify-center px-4">
            <p className="text-sm font-sans text-ink-light/60 text-center">
              No reviews yet. Be the first to share your experience.
            </p>
          </div>
        )}
        {reviews.map((review, index) => {
          const position =
            reviews.length % 2
              ? index - (reviews.length + 1) / 2
              : index - reviews.length / 2;
          return (
            <ReviewCard
              key={review.id}
              review={review}
              position={position}
              onClick={() => move(position)}
              cardSize={cardSize}
            />
          );
        })}
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={() => move(-1)}
          disabled={reviews.length < 2}
          aria-label="Previous review"
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-2xl",
            "border-2 border-blush/30 bg-white/70 text-ink-light",
            "hover:bg-gradient-to-br hover:from-blush hover:to-caramel hover:text-white hover:border-transparent",
            "transition-all duration-300 hover:shadow-button hover:-translate-y-0.5",
            reviews.length < 2 && "opacity-50 cursor-not-allowed",
            "btn-bubble"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {reviews.slice(0, 7).map((_, i) => (
            <button
              key={i}
              onClick={() => move(i - Math.floor(reviews.length / 2))}
              className={cn(
                "rounded-full transition-all duration-300",
                i === Math.floor(reviews.length / 2)
                  ? "w-6 h-2 bg-gradient-to-r from-caramel to-rose"
                  : "w-2 h-2 bg-caramel/20 hover:bg-caramel/40"
              )}
            />
          ))}
        </div>

        <button
          onClick={() => move(1)}
          disabled={reviews.length < 2}
          aria-label="Next review"
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-2xl",
            "border-2 border-blush/30 bg-white/70 text-ink-light",
            "hover:bg-gradient-to-br hover:from-caramel hover:to-rose hover:text-white hover:border-transparent",
            "transition-all duration-300 hover:shadow-button hover:-translate-y-0.5",
            reviews.length < 2 && "opacity-50 cursor-not-allowed",
            "btn-bubble"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default ReviewsSection;
