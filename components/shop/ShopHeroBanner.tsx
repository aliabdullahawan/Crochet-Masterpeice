"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Heart, Truck } from "lucide-react";

const SLIDES = [
  {
    img: "/images/crochet-1.jpg",
    tag: "Handmade Collection",
    title: "Every piece is crocheted\nwith love — just for you",
    sub: "Custom crochet from Pakistan's favourite maker",
    cta: { label: "Shop Now →", href: "/user/shop?filter=featured" },
  },
  {
    img: "/images/crochet-2.jpg",
    tag: "Limited Drops",
    title: "No two pieces\nare ever the same",
    sub: "Stitched slowly, worth every stitch",
    cta: { label: "Browse Collection →", href: "/user/shop" },
  },
  {
    img: "/images/crochet-4.jpg",
    tag: "Custom Orders",
    title: "Design your own\ncrochet masterpiece",
    sub: "Tell me your idea — I'll make it real",
    cta: { label: "Start Custom Order →", href: "/user/custom-order" },
  },
  {
    img: "/images/crochet-5.jpg",
    tag: "Best Sellers",
    title: "Warmth you can\nwear and gift",
    sub: "Pakistan-wide delivery on all orders",
    cta: { label: "Shop Best Sellers →", href: "/user/shop?filter=featured" },
  },
  {
    img: "/images/crochet-6.jpg",
    tag: "New Arrivals",
    title: "Fresh drops for\nevery season",
    sub: "New pieces added every week",
    cta: { label: "See New Arrivals →", href: "/user/shop?sort=newest" },
  },
];

export function ShopHeroBanner() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current]);

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const prev = () => { setDirection(-1); setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length); };
  const next = () => { setDirection(1); setCurrent((c) => (c + 1) % SLIDES.length); };

  const slide = SLIDES[current];

  return (
    <div className="relative w-full overflow-hidden bg-ink-dark" style={{ height: "clamp(320px, 52vw, 560px)" }}>
      {/* Image layers */}
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0.6, scale: 1.04 }),
            center: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
            exit: (d: number) => ({ x: d > 0 ? "-40%" : "40%", opacity: 0, scale: 0.96, transition: { duration: 0.5 } }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <img
            src={slide.img}
            alt={slide.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient overlays — left side heavier for text legibility */}
          <div className="absolute inset-0 bg-linear-to-r from-ink-dark/80 via-ink-dark/40 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-ink-dark/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${current}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15 } }}
              exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
              className="max-w-xl"
            >
              {/* Tag */}
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest text-white/85 mb-4">
                <Sparkles className="w-2.5 h-2.5" />
                {slide.tag}
              </span>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight mb-3 whitespace-pre-line">
                {slide.title}
              </h1>

              {/* Sub */}
              <p className="text-white/70 font-sans text-sm sm:text-base mb-6 leading-relaxed">
                {slide.sub}
              </p>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Arrow controls */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110"
        aria-label="Previous slide"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110"
        aria-label="Next slide"
      >
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Bottom badges */}
      <div className="absolute bottom-4 right-4 sm:right-10 z-20 hidden sm:flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-white/12 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-[11px] font-sans font-semibold text-white/85">
          <Heart className="w-3 h-3 text-blush" /> Custom orders
        </span>
        <span className="inline-flex items-center gap-1.5 bg-white/12 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-[11px] font-sans font-semibold text-white/85">
          <Truck className="w-3 h-3 text-caramel" /> Pakistan-wide
        </span>
      </div>
    </div>
  );
}
