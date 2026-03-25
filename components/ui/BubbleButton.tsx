"use client";

import React, { useRef, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* =============================================
   BUBBLE PARTICLE
   ============================================= */
interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  velocity: number;
}

const BUBBLE_COLORS = [
  "rgba(244,184,193,0.9)",  // blush
  "rgba(201,160,220,0.8)",  // mauve
  "rgba(200,149,108,0.85)", // caramel
  "rgba(232,160,168,0.8)",  // rose
  "rgba(255,255,255,0.9)",  // white sparkle
];

/* =============================================
   BUBBLE BUTTON WRAPPER
   Wraps any button/element with a popping bubble
   effect on click. Keeps all existing styling.
   ============================================= */
interface BubbleButtonProps {
  children: ReactNode;
  className?: string;
  as?: "button" | "div" | "a";
  href?: string;
  target?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
}

export const BubbleButton = ({
  children,
  className,
  as: Tag = "button",
  href,
  onClick,
  disabled,
  type = "button",
  ...rest
}: BubbleButtonProps) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const spawnBubbles = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const count = 8 + Math.floor(Math.random() * 6); // 8-13 bubbles

    const newBubbles: Bubble[] = Array.from({ length: count }, (_, i) => ({
      id: nextId.current++,
      x: cx,
      y: cy,
      size: 4 + Math.random() * 10,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      angle: (360 / count) * i + Math.random() * 30,
      velocity: 30 + Math.random() * 55,
    }));

    setBubbles((prev) => [...prev, ...newBubbles]);

    // Clean up after animation
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => !newBubbles.find((nb) => nb.id === b.id)));
    }, 700);

    onClick?.(e);
  }, [disabled, onClick]);

  const props = {
    ref: containerRef as React.RefObject<HTMLDivElement>,
    className: cn("relative overflow-visible", className),
    onClick: spawnBubbles,
    ...(Tag === "button" && { type, disabled }),
    ...(Tag === "a" && { href }),
    ...rest,
  };

  return (
    // @ts-expect-error dynamic tag
    <Tag {...props}>
      {children}

      {/* Bubble particles */}
      <AnimatePresence>
        {bubbles.map((bubble) => {
          const rad = (bubble.angle * Math.PI) / 180;
          const tx = Math.round(Math.cos(rad) * bubble.velocity * 100) / 100;
          const ty = Math.round(Math.sin(rad) * bubble.velocity * 100) / 100;
          return (
            <motion.span
              key={bubble.id}
              className="absolute pointer-events-none rounded-full z-50"
              style={{
                left: bubble.x,
                top: bubble.y,
                width: bubble.size,
                height: bubble.size,
                background: bubble.color,
                boxShadow: `0 0 ${bubble.size}px ${bubble.color}`,
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
              animate={{
                scale: [1, 1.3, 0],
                opacity: [1, 0.8, 0],
                x: tx,
                y: ty,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          );
        })}
      </AnimatePresence>

      {/* Shockwave ring */}
      <AnimatePresence>
        {bubbles.length > 0 && bubbles.slice(-1).map((b) => (
          <motion.span
            key={`ring-${b.id}`}
            className="absolute pointer-events-none rounded-full z-40 border-2 border-blush/50"
            style={{ left: b.x, top: b.y, translateX: "-50%", translateY: "-50%" }}
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 60, height: 60, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </Tag>
  );
};

/* =============================================
   HOOK — useBubbleEffect
   For when you can't wrap in BubbleButton
   Use: const { ref, BubbleLayer } = useBubbleEffect()
   ============================================= */
export const useBubbleEffect = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const ref = useRef<HTMLElement>(null);
  const nextId = useRef(0);

  const trigger = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const count = 8;

    const newBubbles: Bubble[] = Array.from({ length: count }, (_, i) => ({
      id: nextId.current++,
      x: cx, y: cy,
      size: 4 + Math.random() * 8,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      angle: (360 / count) * i + Math.random() * 20,
      velocity: 25 + Math.random() * 40,
    }));

    setBubbles((prev) => [...prev, ...newBubbles]);
    setTimeout(() => setBubbles((prev) => prev.filter((b) => !newBubbles.find((nb) => nb.id === b.id))), 700);
  }, []);

  const BubbleLayer = () => (
    <AnimatePresence>
      {bubbles.map((bubble) => {
        const rad = (bubble.angle * Math.PI) / 180;
        return (
          <motion.span key={bubble.id} className="absolute pointer-events-none rounded-full z-50"
            style={{ left: bubble.x, top: bubble.y, width: bubble.size, height: bubble.size,
              background: bubble.color, translateX: "-50%", translateY: "-50%" }}
            initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
            animate={{ scale: [1, 1.2, 0], opacity: [1, 0.7, 0],
              x: Math.round(Math.cos(rad) * bubble.velocity * 100)/100, y: Math.round(Math.sin(rad) * bubble.velocity * 100)/100 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        );
      })}
    </AnimatePresence>
  );

  return { ref, trigger, BubbleLayer };
};
