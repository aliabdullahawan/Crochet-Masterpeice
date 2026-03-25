"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Heart, ArrowRight, Package, Star, Users } from "lucide-react";

/* ── Stat Pill ── */
const StatPill = ({ icon, value, label, delay }: {
  icon: React.ReactNode; value: string; label: string; delay: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 200 }}
      className="flex flex-col items-center gap-1 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blush/30 to-mauve/20 flex items-center justify-center text-caramel mb-1">
        {icon}
      </div>
      <p className="font-display text-2xl font-semibold text-ink-dark">{value}</p>
      <p className="text-xs font-sans text-ink-light/60">{label}</p>
    </motion.div>
  );
};

/* ── About Section ── */
export const AboutSection = () => {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  const content = {
    label: "Our Story",
    title: "Made by hand. Sent with love.",
    body: `Hi! I'm the girl behind Crochet Masterpiece — and honestly, crochet kind of took over my life in the best way possible. It started as something I did late at night to unwind, and slowly turned into something I couldn't stop sharing.\n\nWhat you'll find here isn't mass-produced or rushed. Every single piece is made by my hands, with yarn I've handpicked, following patterns I've tested and loved. I take each order personally — because to me, you're not just a customer, you're someone I'm making something for.\n\nMy little shop runs mostly on WhatsApp and a whole lot of word-of-mouth. I'm so grateful for every order, every kind message, and every photo customers share wearing their pieces. It genuinely makes my day.`,
    cta_label: "Let's make something just for you",
    cta_link: "/user/custom-order",
  };

  return (
    <section ref={sectionRef} className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">

      {/* Full-bleed background photo with warm overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <img src="/images/crochet-5.jpg" alt="" className="w-full h-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-cream-100/92 via-cream-100/82 to-cream-100/65" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Photo collage ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: imgY }}
            className="relative"
          >
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              {/* Main photo */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto rounded-3xl overflow-hidden shadow-card ring-4 ring-white/60">
                <img src="/images/crochet-3.jpg" alt="Crochet work in progress" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-dark/20 to-transparent" />
              </div>

              {/* Floating accent photo — bottom right */}
              <motion.div
                className="absolute -bottom-6 -right-6 w-28 h-28 rounded-2xl overflow-hidden shadow-card ring-4 ring-white/80"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src="/images/crochet-2.jpg" alt="" className="w-full h-full object-cover" />
              </motion.div>

              {/* Floating accent photo — top right */}
              <motion.div
                className="absolute -top-6 -right-10 w-24 h-24 rounded-2xl overflow-hidden shadow-card ring-4 ring-white/80"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src="/images/crochet-6.jpg" alt="" className="w-full h-full object-cover" />
              </motion.div>

              {/* Logo badge — bottom left */}
              <motion.div
                className="absolute -bottom-4 -left-6 w-16 h-16 rounded-2xl overflow-hidden shadow-card ring-4 ring-white/80 bg-cream-50 flex items-center justify-center"
                animate={{ rotate: [0, 3, 0, -3, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image src="/images/logo.png" alt="Logo" width={56} height={56} className="object-contain p-1" />
              </motion.div>
            </div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid grid-cols-3 gap-4 mt-16 px-4"
            >
              <StatPill icon={<Package className="w-5 h-5" />} value="500+" label="Orders Delivered" delay={0.6} />
              <StatPill icon={<Star className="w-5 h-5" />} value="4.9★" label="Average Rating" delay={0.7} />
              <StatPill icon={<Users className="w-5 h-5" />} value="1.2K+" label="Happy Customers" delay={0.8} />
            </motion.div>
          </motion.div>

          {/* ── Right: Text ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-sans font-semibold text-caramel tracking-widest uppercase mb-3 flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 fill-blush text-blush" /> {content.label}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink-dark leading-tight mb-6">
              {content.title}
            </h2>

            <div className="space-y-4">
              {content.body.split("\\n\\n").filter(Boolean).map((para, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
                  className="text-base text-ink-light/80 font-sans leading-relaxed"
                >
                  {para}
                </motion.p>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-8"
            >
              <Link href={content.cta_link}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-caramel to-rose text-white font-sans font-bold text-sm shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble"
              >
                <Heart className="w-4 h-4 fill-white/70" />
                {content.cta_label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
