"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Scissors, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const CustomOrderBanner = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const steps = [
    { emoji: "💬", title: "Tell me your idea", desc: "Drop me a message — describe the colours, the vibe, who it's for. No detail is too small." },
    { emoji: "🧶", title: "I'll get to work", desc: "I personally craft your piece with handpicked yarn. No machines, no shortcuts — just me and my hook." },
    { emoji: "📦", title: "It arrives at your door", desc: "Wrapped with care, posted with love. Often with a little handwritten note tucked inside." },
  ];

  return (
    <section ref={ref} className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Real photo background with warm overlay — like crochet.com's feature blocks */}
      <div className="absolute inset-0">
        <img src="/images/banner-hero.jpg" alt="" className="w-full h-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-blush/85 via-cream-100/80 to-mauve/70" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center gap-2 bg-caramel/10 border border-caramel/20 rounded-full px-4 py-1.5 mb-4"
          >
            <Scissors className="w-3.5 h-3.5 text-caramel" />
            <span className="text-xs font-sans font-semibold text-caramel tracking-widest uppercase">Custom Orders</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl font-semibold text-ink-dark mb-4"
          >
            Can&apos;t find what you&apos;re looking for?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-ink-light/70 font-sans max-w-md mx-auto"
          >
            That&apos;s actually my favourite kind of order. Tell me your idea — the colour, the vibe, who it&apos;s for — and I&apos;ll bring it to life, stitch by stitch.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative text-center p-6 rounded-3xl glass border border-blush/25 hover:border-caramel/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-card group"
            >
              {/* Step number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-caramel to-rose text-white text-xs font-bold font-sans flex items-center justify-center shadow-button">
                {i + 1}
              </div>
              <div className="text-4xl mb-3 mt-1 transition-transform duration-300 group-hover:scale-110">{step.emoji}</div>
              <h3 className="font-display text-base font-semibold text-ink-dark mb-2">{step.title}</h3>
              <p className="text-xs text-ink-light/60 font-sans leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/user/custom-order"
            className={cn(
              "flex items-center gap-2 px-8 py-4 rounded-2xl font-sans font-bold text-sm",
              "bg-gradient-to-r from-caramel via-rose to-blush text-white",
              "shadow-button hover:shadow-button-hover hover:-translate-y-1",
              "transition-all duration-300 btn-bubble relative overflow-hidden group"
            )}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Sparkles className="w-4 h-4" />
            Start My Custom Order
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <p className="text-xs text-ink-light/50 font-sans">No login required · Quick WhatsApp order</p>
        </motion.div>
      </div>
    </section>
  );
};

export default CustomOrderBanner;
