"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Heart, Star, Package } from "lucide-react";

/* =============================================
   BUSINESS FEATURE SECTION
   Like crochet.com's "Yarn of the Month" block —
   full photo left, business story right, strong bg
   ============================================= */
export const BusinessFeature = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Full-bleed crochet photo background (the granny square one) */}
      <div className="absolute inset-0">
        <img
          src="/images/crochet-4.jpg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
        {/* Deep warm overlay so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-dark/65 via-ink-dark/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-dark/30 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: text on dark photo */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-white"
          >
            <p className="text-blush font-sans text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 fill-blush" /> Handmade with love
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold leading-tight mb-5">
              Every stitch<br />
              <span className="text-blush">tells a story</span>
            </h2>
            <p className="text-white/75 font-sans text-base leading-relaxed mb-8 max-w-md">
              Based in Pakistan, Crochet Masterpiece creates one-of-a-kind handmade pieces — from cosy cardigans and boho bags to plushies and home décor. Each item is made by hand, with care, using handpicked yarn.
            </p>

            {/* Quick stats row */}
            <div className="flex flex-wrap gap-6 mb-8">
              {[
                { icon: <Package className="w-4 h-4" />, stat: "500+", label: "Orders Delivered" },
                { icon: <Star className="w-4 h-4 fill-blush text-blush" />, stat: "4.9★", label: "Avg Rating" },
                { icon: <Heart className="w-4 h-4 fill-blush text-blush" />, stat: "100%", label: "Handmade" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold text-white">{item.stat}</p>
                    <p className="text-white/55 text-[11px] font-sans">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link href="/user/shop"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blush to-rose text-white text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/user/custom-order"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/15 border border-white/30 text-white text-sm font-sans font-semibold hover:bg-white/25 transition-all btn-bubble backdrop-blur-sm">
                Custom Order
              </Link>
            </div>
          </motion.div>

          {/* Right: floating photo card */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              {/* Main photo card */}
              <div className="w-72 h-72 rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.4)] ring-4 ring-white/20">
                <img
                  src="/images/crochet-1.jpg"
                  alt="Handmade crochet work"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Small accent card */}
              <motion.div
                className="absolute -bottom-8 -left-8 w-40 h-40 rounded-2xl overflow-hidden shadow-card ring-4 ring-white/30"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src="/images/crochet-3.jpg" alt="" className="w-full h-full object-cover" />
              </motion.div>
              {/* Badge */}
              <motion.div
                className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blush to-rose flex flex-col items-center justify-center text-center shadow-button"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-white font-display text-xs font-bold leading-tight">100%</span>
                <span className="text-white/80 font-sans text-[9px] font-semibold">Handmade</span>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default BusinessFeature;
