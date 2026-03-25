"use client";

import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Send, Instagram, Facebook, Heart, MessageCircle, MapPin, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/* ============================================
   SOCIAL LINK CARDS
   ============================================= */
const WhatsAppIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.799 9.799 0 0 1-5.003-1.374l-.358-.213-3.742.981.999-3.648-.235-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
  </svg>
);

const TikTokIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.2 8.2 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
);

interface SocialPlatform {
  name: string; handle: string; url: string; description: string;
  icon: React.ReactNode; gradient: string; textColor: string; followLabel: string;
}

const SOCIALS: SocialPlatform[] = [
  {
    name: "WhatsApp",
    handle: "Order & Chat",
    url: "https://wa.me/923159202186",
    description: "The fastest way to reach me. I reply to every message — usually within a few hours.",
    icon: <WhatsAppIcon />,
    gradient: "from-[#25D366]/20 to-[#128C7E]/10",
    iconBg: "bg-gradient-to-br from-[#25D366]/20 to-[#128C7E]/10",
    btnBg: "bg-gradient-to-r from-[#25D366]/20 to-[#128C7E]/10 text-[#0a6640] border-transparent",
    textColor: "text-[#128C7E]",
    followLabel: "Message me",
  },
  {
    name: "WhatsApp Channel",
    handle: "@CrochetMasterpiece",
    url: "https://whatsapp.com/channel/0029VbBXbGv9WtC90s3UER04",
    description: "Join my channel for new arrivals, behind-the-scenes, and occasional discounts.",
    icon: <WhatsAppIcon />,
    gradient: "from-[#25D366]/15 to-[#075E54]/8",
    iconBg: "bg-gradient-to-br from-[#25D366]/15 to-[#075E54]/8",
    btnBg: "bg-gradient-to-r from-[#25D366]/15 to-[#075E54]/8 text-[#0a6640] border-transparent",
    textColor: "text-[#075E54]",
    followLabel: "Join channel",
  },
  {
    name: "Instagram",
    handle: "@croch_etmasterpiece",
    url: "https://www.instagram.com/croch_etmasterpiece",
    description: "All my finished pieces, works-in-progress, and the occasional yarn haul. Come say hi!",
    icon: <Instagram size={22} />,
    gradient: "from-[#E1306C]/12 to-[#833AB4]/8",
    iconBg: "bg-gradient-to-br from-[#E1306C]/12 to-[#833AB4]/8",
    btnBg: "bg-gradient-to-r from-[#E1306C]/12 to-[#833AB4]/8 text-[#c2185b] border-transparent",
    textColor: "text-[#C13584]",
    followLabel: "Follow on Instagram",
  },
  {
    name: "Facebook",
    handle: "Crochet Masterpiece",
    url: "https://www.facebook.com/profile.php?id=61579353555271",
    description: "For longer updates, customer photos, and community posts. Love seeing you there.",
    icon: <Facebook size={22} />,
    gradient: "from-[#1877F2]/12 to-[#0a5dc5]/6",
    iconBg: "bg-gradient-to-br from-[#1877F2]/12 to-[#0a5dc5]/6",
    btnBg: "bg-gradient-to-r from-[#1877F2]/12 to-[#0a5dc5]/6 text-[#1877F2] border-transparent",
    textColor: "text-[#1877F2]",
    followLabel: "Like on Facebook",
  },
  {
    name: "TikTok",
    handle: "@croch_et.masterpiece",
    url: "https://www.tiktok.com/@croch_et.masterpiece",
    description: "Short videos of the process — from yarn selection to finished pieces. Oddly satisfying!",
    icon: <TikTokIcon />,
    gradient: "from-ink-dark/8 to-ink/5",
    iconBg: "bg-gradient-to-br from-ink-dark/8 to-ink/5",
    btnBg: "bg-gradient-to-r from-ink-dark/8 to-ink/5 text-ink-dark border-transparent",
    textColor: "text-ink-dark",
    followLabel: "Follow on TikTok",
  },
];

const SocialCard = ({ platform, index }: { platform: SocialPlatform; index: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative rounded-3xl border border-blush/20 overflow-hidden transition-all duration-350 group",
          hovered ? "shadow-card -translate-y-1" : "shadow-soft bg-white/75"
        )}
      >
        {/* Gradient bg */}
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300", platform.gradient)} />

        <div className="relative z-10 p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300",
              platform.iconBg,
              hovered ? "scale-110" : ""
            )}>
              <span className={platform.textColor}>{platform.icon}</span>
            </div>
            <a
              href={platform.url} target="_blank" rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-bold border transition-all duration-250 btn-bubble flex-shrink-0",
                hovered
                  ? platform.btnBg
                  : "border-caramel/20 text-ink-light/70 bg-white/60"
              )}
            >
              {platform.followLabel}
            </a>
          </div>

          <div>
            <p className="font-display text-base font-semibold text-ink-dark leading-tight">{platform.name}</p>
            <p className={cn("text-xs font-sans font-semibold mt-0.5 mb-2", platform.textColor)}>{platform.handle}</p>
            <p className="text-xs text-ink-light/65 font-sans leading-relaxed">{platform.description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ============================================
   CHAT FORM (WhatsApp — not stored anywhere)
   ============================================= */
const ChatForm = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const set = (f: keyof typeof form) => (v: string) => setForm((prev) => ({ ...prev, [f]: v }));

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    const text = encodeURIComponent(
      `Hi! I have a question \n\n*Name:* ${form.name || "—"}\n*Email:* ${form.email || "—"}\n\n${form.message}\n\n_Sent from Crochet Masterpiece website_`
    );
    window.open(`https://wa.me/923159202186?text=${text}`, "_blank");
    setSent(true);
  };

  const inputCls = "w-full bg-white/70 border border-caramel/20 rounded-2xl px-4 py-3 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none focus:border-blush focus:bg-white focus:shadow-[0_0_0_3px_rgba(244,184,193,0.18)] transition-all duration-300";

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-3xl border border-blush/25 shadow-card overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blush/20 via-cream-50 to-mauve/15 px-7 py-5 border-b border-blush/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blush to-mauve flex items-center justify-center text-white">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-dark">Send me a message</h3>
            <p className="text-xs text-ink-light/55 font-sans">Opens WhatsApp — nothing is stored on our side </p>
          </div>
        </div>
      </div>

      {sent ? (
        <div className="px-7 py-10 text-center space-y-3">
          <div className="text-4xl"></div>
          <p className="font-display text-lg text-ink-dark">WhatsApp should be open!</p>
          <p className="text-sm text-ink-light/65 font-sans">Just tap send and I&apos;ll reply as soon as I can.</p>
          <button onClick={() => setSent(false)}
            className="mt-2 text-xs text-caramel underline decoration-blush/50 font-sans hover:text-ink transition-colors">
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="px-7 py-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <input type="text" value={form.name} onChange={(e) => set("name")(e.target.value)}
              placeholder="Your name (optional)" className={inputCls} />
            <input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)}
              placeholder="Email (optional)" className={inputCls} />
          </div>
          <textarea value={form.message} onChange={(e) => set("message")(e.target.value)}
            placeholder="What's on your mind? A question, a compliment, a custom idea — anything goes! "
            rows={4} required
            className={`${inputCls} resize-none`} />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[11px] text-ink-light/40 font-sans">
              This message goes straight to WhatsApp — not stored anywhere.
            </p>
            <button type="submit"
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl",
                "bg-[#25D366] text-white text-sm font-sans font-bold",
                "shadow-button hover:shadow-button-hover hover:-translate-y-0.5",
                "transition-all duration-250 btn-bubble"
              )}>
              <Send className="w-4 h-4" /> Send on WhatsApp
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

/* ============================================
   MAIN PAGE
   ============================================= */
export default function ContactPage() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden pt-28 pb-16 px-4 sm:px-6 lg:px-8 text-center"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(244,184,193,0.18) 0%, transparent 60%), #FFF8ED" }}
      >
        {/* Floating emojis */}
        {["", "", "", ""].map((em, i) => (
          <motion.span key={em}
            className="absolute text-xl pointer-events-none select-none opacity-15"
            style={{ left: `${6 + i * 24}%`, top: `${20 + (i % 2) * 45}%` }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
          >{em}</motion.span>
        ))}

        <div className="max-w-2xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-blush/20 border border-blush/35 rounded-full px-4 py-1.5 mb-5">
            <Heart className="w-3.5 h-3.5 fill-blush text-blush" />
            <span className="text-xs font-sans font-semibold text-caramel tracking-widest uppercase">Get in touch</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 22 }} animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="font-display text-4xl sm:text-5xl font-semibold text-ink-dark mb-4 leading-tight">
            I&apos;d love to hear from you.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 14 }} animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="text-base text-ink-light/70 font-sans leading-relaxed mb-8">
            Questions, custom ideas, feedback, or just wanting to say hi — I genuinely love hearing from
            the people who find my shop. Don&apos;t be shy! 
          </motion.p>

          {/* Response time badge */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-6 bg-white/70 border border-blush/20 rounded-2xl px-5 py-3 shadow-soft">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              <span className="text-xs font-sans font-semibold text-ink/70">Usually replies within</span>
            </div>
            <span className="font-display text-base font-semibold text-ink-dark">a few hours</span>
            <Clock className="w-4 h-4 text-caramel/50" />
          </motion.div>
        </div>
      </section>

      {/* ── Social platforms ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <p className="text-xs font-sans font-semibold text-caramel tracking-widest uppercase mb-2 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-caramel/60 inline-block" />
            Find me here
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-caramel/60 inline-block" />
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-dark">All my little corners of the internet</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {SOCIALS.map((platform, i) => (
            <SocialCard key={platform.name} platform={platform} index={i} />
          ))}
        </div>

        {/* ── Chat form ── */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-semibold text-ink-dark mb-2">Or just drop me a message</h2>
            <p className="text-sm text-ink-light/60 font-sans">
              Fill this in and it&apos;ll open WhatsApp with your message already typed. Simple!
            </p>
          </div>
          <ChatForm />
        </div>

        {/* ── Location note ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-left"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blush/25 to-mauve/15 flex items-center justify-center text-2xl flex-shrink-0">
            
          </div>
          <div>
            <p className="font-display text-base font-semibold text-ink-dark mb-0.5">Based in Pakistan, shipping nationwide</p>
            <p className="text-xs text-ink-light/60 font-sans leading-relaxed max-w-sm">
              I ship to all major cities via courier. Delivery usually takes 3–5 working days.
              For international orders — message me and we&apos;ll figure it out together!
            </p>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
