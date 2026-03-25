"use client";

import React, { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlowColor = "pink" | "mauve" | "caramel" | "green" | "blue";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: GlowColor;
  customSize?: boolean;
}

const glowColorMap: Record<GlowColor, { base: number; spread: number }> = {
  pink:    { base: 340, spread: 40  },
  mauve:   { base: 280, spread: 60  },
  caramel: { base: 30,  spread: 30  },
  green:   { base: 120, spread: 80  },
  blue:    { base: 210, spread: 120 },
};

export const GlowCard = ({
  children,
  className,
  glowColor = "pink",
  customSize = true,
}: GlowCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const { base, spread } = glowColorMap[glowColor];

  useEffect(() => {
    const sync = (e: PointerEvent) => {
      if (!cardRef.current) return;
      cardRef.current.style.setProperty("--x", e.clientX.toFixed(2));
      cardRef.current.style.setProperty("--xp", (e.clientX / window.innerWidth).toFixed(2));
      cardRef.current.style.setProperty("--y", e.clientY.toFixed(2));
      cardRef.current.style.setProperty("--yp", (e.clientY / window.innerHeight).toFixed(2));
    };
    document.addEventListener("pointermove", sync);
    return () => document.removeEventListener("pointermove", sync);
  }, []);

  return (
    <div
      ref={cardRef}
      data-glow
      className={cn("relative rounded-3xl backdrop-blur-sm", className)}
      style={{
        "--base": base,
        "--spread": spread,
        "--radius": "20",
        "--border": "2",
        "--backdrop": "rgba(255,248,237,0.85)",
        "--backup-border": "rgba(244,184,193,0.25)",
        "--size": "220",
        "--outer": "1",
        "--border-size": "calc(var(--border, 2) * 1px)",
        "--spotlight-size": "calc(var(--size, 220) * 1px)",
        "--hue": "calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))",
        backgroundImage: `radial-gradient(
          var(--spotlight-size) var(--spotlight-size) at
          calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
          hsl(var(--hue, 30) 80% 70% / 0.08), transparent
        )`,
        backgroundColor: "var(--backdrop)",
        backgroundSize: "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
        backgroundPosition: "50% 50%",
        backgroundAttachment: "fixed",
        border: "var(--border-size) solid var(--backup-border)",
        position: "relative",
        touchAction: "none",
      } as React.CSSProperties}
    >
      <div ref={innerRef} data-glow className="absolute inset-0 rounded-3xl pointer-events-none" />
      {children}
    </div>
  );
};

export default GlowCard;
