"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Mail, Phone, MapPin, Heart, Instagram, Facebook, ExternalLink, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CrochetLogo } from "@/components/ui/CrochetLogo";
import { AnimatedSocialIcons } from "@/components/ui/AnimatedSocialIcons";

/* =============================================
   SOCIAL ICON SVGs
   ============================================= */
const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.799 9.799 0 0 1-5.003-1.374l-.358-.213-3.742.981.999-3.648-.235-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.2 8.2 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
);

/* =============================================
   ANIMATED SOCIAL BUTTON (expand on click)
   ============================================= */
const SocialButton = ({
  icon, label, href, color, bgColor,
}: {
  icon: React.ReactNode; label: string; href: string; color: string; bgColor: string;
}) => {
  const [active, setActive] = useState(false);
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="relative group flex items-center overflow-hidden"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      aria-label={label}
    >
      <div className={cn(
        "flex items-center gap-2 rounded-full transition-all duration-500 overflow-hidden",
        "border border-white/20",
        active ? `pl-3 pr-4 py-2 ${bgColor} text-white shadow-button` : "p-2.5 bg-white/10 text-white/70 hover:text-white hover:bg-white/15"
      )}>
        <span className="flex-shrink-0">{icon}</span>
        <motion.span
          className="text-xs font-sans font-semibold whitespace-nowrap overflow-hidden"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: active ? "auto" : 0, opacity: active ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {label}
        </motion.span>
      </div>
    </a>
  );
};

/* =============================================
   TEXT HOVER SVG EFFECT
   ============================================= */
const HoverTextSVG = ({ text }: { text: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPos, setMaskPos] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = ((cursor.x - rect.left) / rect.width) * 100;
    const cy = ((cursor.y - rect.top) / rect.height) * 100;
    setMaskPos({ cx: `${cx}%`, cy: `${cy}%` });
  }, [cursor]);

  return (
    <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 400 80"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className="select-none cursor-pointer"
    >
      <defs>
        <linearGradient id="footerGradient" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="25%">
          {hovered && <>
            <stop offset="0%" stopColor="#E8C97A" />
            <stop offset="30%" stopColor="#F4B8C1" />
            <stop offset="60%" stopColor="#C9A0DC" />
            <stop offset="100%" stopColor="#C8956C" />
          </>}
        </linearGradient>
        <radialGradient id="footerRevealMask" gradientUnits="userSpaceOnUse" r="25%"
          cx={maskPos.cx} cy={maskPos.cy}>
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
        <mask id="footerTextMask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#footerRevealMask)" />
        </mask>
      </defs>
      {/* Base outline text */}
      <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
        strokeWidth="0.5" className="fill-transparent font-[helvetica] text-6xl font-bold"
        style={{ stroke: "rgba(255,255,255,0.1)", opacity: hovered ? 0.6 : 0, transition: "opacity 0.3s" }}>
        {text}
      </text>
      {/* Animated draw */}
      <motion.text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
        strokeWidth="0.5" className="fill-transparent font-[helvetica] text-6xl font-bold"
        style={{ stroke: "rgba(244,184,193,0.4)" }}
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{ strokeDashoffset: 0, strokeDasharray: 1000 }}
        transition={{ duration: 4, ease: "easeInOut" }}>
        {text}
      </motion.text>
      {/* Colour reveal on hover */}
      <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
        stroke="url(#footerGradient)" strokeWidth="0.5"
        mask="url(#footerTextMask)" className="fill-transparent font-[helvetica] text-6xl font-bold">
        {text}
      </text>
    </svg>
  );
};

/* =============================================
   FOOTER LINK ROW
   ============================================= */
const FooterLink = ({ href, label }: { href: string; label: string }) => (
  <li>
    <Link href={href}
      className="text-xs font-sans text-white/50 hover:text-white transition-colors duration-200 flex items-center gap-1 group">
      <span className="w-0 h-px bg-blush inline-block transition-all duration-200 group-hover:w-3" />
      {label}
    </Link>
  </li>
);

/* =============================================
   BACK TO TOP BUTTON
   ============================================= */
const BackToTop = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-6 z-50 w-11 h-11 rounded-2xl",
        "bg-gradient-to-br from-caramel to-rose text-white shadow-button",
        "flex items-center justify-center",
        "hover:shadow-button-hover hover:-translate-y-1 transition-all duration-300",
        "btn-bubble"
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.8, pointerEvents: visible ? "auto" : "none" }}
      transition={{ duration: 0.3 }}
      aria-label="Back to top"
    >
      <ArrowUp className="w-4 h-4" />
    </motion.button>
  );
};

/* =============================================
   MAIN FOOTER
   ============================================= */
export const Footer = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const categories = [
    { label: "Cardigans & Tops", href: "/user/shop?category=cardigans" },
    { label: "Bags & Totes", href: "/user/shop?category=bags" },
    { label: "Accessories", href: "/user/shop?category=accessories" },
    { label: "Home Décor", href: "/user/shop?category=home-decor" },
    { label: "Plushies & Gifts", href: "/user/shop?category=plushies" },
  ];

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/user/shop" },
    { label: "Custom Order", href: "/user/custom-order" },
    { label: "Contact Us", href: "/user/contact" },
    { label: "My Orders", href: "/user/orders" },
    { label: "Wishlist", href: "/user/wishlist" },
  ];

  const socials = [
    { icon: <WhatsAppIcon />, label: "WhatsApp", href: "https://whatsapp.com/channel/0029VbBXbGv9WtC90s3UER04", color: "text-[#25D366]", bgColor: "bg-[#25D366]" },
    { icon: <Instagram size={18} />, label: "Instagram", href: "https://www.instagram.com/croch_etmasterpiece", color: "text-pink-400", bgColor: "bg-gradient-to-br from-pink-500 to-purple-600" },
    { icon: <Facebook size={18} />, label: "Facebook", href: "https://www.facebook.com/profile.php?id=61579353555271", color: "text-blue-400", bgColor: "bg-[#1877F2]" },
    { icon: <TikTokIcon />, label: "TikTok", href: "https://www.tiktok.com/@croch_et.masterpiece", color: "text-white", bgColor: "bg-ink-dark" },
  ];

  return (
    <>
      <BackToTop />
      <footer ref={ref} className="relative bg-ink-dark overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(244,184,193,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(201,160,220,0.05),transparent_50%)]" />

        {/* Main grid */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/8">

            {/* Brand column */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <CrochetLogo variant="horizontal" size={52} showText className="brightness-0 invert opacity-90" />
              <p className="text-xs text-white/50 font-sans leading-relaxed max-w-[220px]">
                Handcrafted crochet pieces made with love, patience, and the finest yarn — just for you.
              </p>
              {/* Animated social icons — plus button reveals all */}
              <div className="pt-2">
                <AnimatedSocialIcons />
              </div>
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="text-sm font-display font-semibold text-white mb-5">Shop by Category</h4>
              <ul className="space-y-2.5">
                {categories.map((c) => <FooterLink key={c.label} href={c.href} label={c.label} />)}
              </ul>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-sm font-display font-semibold text-white mb-5">Quick Links</h4>
              <ul className="space-y-2.5">
                {quickLinks.map((l) => <FooterLink key={l.label} href={l.href} label={l.label} />)}
              </ul>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="text-sm font-display font-semibold text-white mb-5">Get in Touch</h4>
              <ul className="space-y-3">
                {[
                  { icon: <Mail className="w-3.5 h-3.5 text-blush" />, text: "crochetmasterpiece@gmail.com", href: "mailto:crochetmasterpiece@gmail.com" },
                  { icon: <Phone className="w-3.5 h-3.5 text-blush" />, text: "+92 300 1234567", href: "tel:+923159202186" },
                  { icon: <MapPin className="w-3.5 h-3.5 text-blush" />, text: "Pakistan ", href: "#" },
                ].map((item) => (
                  <li key={item.text}>
                    <a href={item.href} className="flex items-center gap-2 text-xs font-sans text-white/50 hover:text-white transition-colors duration-200 group">
                      {item.icon} {item.text}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Newsletter-style CTA */}
              <div className="mt-6 p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-white/50 font-sans mb-2">Order on WhatsApp</p>
                <a
                  href="https://wa.me/923159202186"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center justify-center gap-2 w-full py-2 rounded-xl",
                    "bg-[#25D366] text-white text-xs font-sans font-bold",
                    "hover:brightness-110 transition-all duration-200 btn-bubble"
                  )}
                >
                  <WhatsAppIcon /> Chat on WhatsApp
                </a>
              </div>
            </motion.div>
          </div>

          {/* Bottom bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4"
          >
            <p className="text-xs text-white/30 font-sans flex items-center gap-1.5">
              © {new Date().getFullYear()} Crochet Masterpiece · Made with
              <Heart className="w-3 h-3 fill-blush text-blush animate-pulse-soft" />
              in Pakistan
            </p>
            <div className="flex items-center gap-4">
              {["Privacy Policy", "Terms of Service"].map((t) => (
                <Link key={t} href="#"
                  className="text-xs text-white/30 hover:text-white/60 font-sans transition-colors duration-200">{t}</Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Big hover text at bottom */}
        <div className="hidden lg:block h-40 -mt-8 -mb-6 opacity-80">
          <HoverTextSVG text="Crochet Masterpiece" />
        </div>
      </footer>
    </>
  );
};

export default Footer;
