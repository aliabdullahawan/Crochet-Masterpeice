"use client";

import { motion } from "framer-motion";
import { Instagram, Facebook, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/* =============================================
   CUSTOM ICON SVGS
   ============================================= */
const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.799 9.799 0 0 1-5.003-1.374l-.358-.213-3.742.981.999-3.648-.235-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
  </svg>
);

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.2 8.2 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
);

/* =============================================
   SOCIAL ICON ITEM TYPE
   ============================================= */
interface SocialItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;   // tailwind bg class
  hoverBg: string;
}

/* =============================================
   ANIMATED SOCIAL ICONS COMPONENT
   Plus button slides right to reveal icons
   ============================================= */
export const AnimatedSocialIcons = () => {
  const [active, setActive] = useState(false);

  const socials: SocialItem[] = [
    { icon: <WhatsAppIcon size={18} />, label: "WhatsApp", href: "https://wa.me/923159202186", color: "bg-[#25D366]", hoverBg: "hover:bg-[#1fb558]" },
    { icon: <Instagram size={18} />, label: "Instagram", href: "https://www.instagram.com/croch_etmasterpiece", color: "bg-gradient-to-br from-[#E1306C] to-[#833AB4]", hoverBg: "" },
    { icon: <Facebook size={18} />, label: "Facebook", href: "https://www.facebook.com/profile.php?id=61579353555271", color: "bg-[#1877F2]", hoverBg: "hover:bg-[#0f65d9]" },
    { icon: <TikTokIcon size={18} />, label: "TikTok", href: "https://www.tiktok.com/@croch_et.masterpiece", color: "bg-ink-dark", hoverBg: "hover:bg-black" },
  ];

  return (
    <div className="relative flex items-center gap-3">
      {/* Sliding plus/close button */}
      <motion.div
        className="relative z-10"
        animate={{ x: active ? `calc(${socials.length} * 44px + ${(socials.length - 1) * 12}px)` : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        <motion.button
          onClick={() => setActive(!active)}
          animate={{ rotate: active ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-caramel to-rose flex items-center justify-center text-white shadow-button hover:shadow-button-hover transition-shadow btn-bubble"
          aria-label="Toggle social links"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </motion.button>
      </motion.div>

      {/* Social icon buttons (revealed behind the plus) */}
      <div className="absolute left-0 flex items-center gap-3">
        {socials.map((s, i) => (
          <motion.a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white",
              s.color, s.hoverBg,
              "shadow-lg transition-all duration-200 hover:scale-110 btn-bubble"
            )}
            animate={{
              filter: active ? "blur(0px)" : "blur(3px)",
              scale: active ? 1 : 0.85,
              rotate: active ? 0 : 45,
              opacity: active ? 1 : 0.3,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.04 }}
            title={s.label}
          >
            {s.icon}
          </motion.a>
        ))}
      </div>
    </div>
  );
};

export default AnimatedSocialIcons;
