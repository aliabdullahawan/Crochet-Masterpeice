"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* =============================================
   LUMA-SPIN ADAPTED FOR CROCHET THEME
   ============================================= */
const CrochetSpinner = () => (
  <div className="relative w-[52px] aspect-square">
    <span
      className="absolute rounded-[50px]"
      style={{
        boxShadow: "inset 0 0 0 3px #C8956C",
        animation: "crochetLoaderAnim 2.5s infinite",
      }}
    />
    <span
      className="absolute rounded-[50px]"
      style={{
        boxShadow: "inset 0 0 0 3px #F4B8C1",
        animation: "crochetLoaderAnim 2.5s infinite",
        animationDelay: "-1.25s",
      }}
    />
    <style>{`
      @keyframes crochetLoaderAnim {
        0%    { inset: 0 28px 28px 0; }
        12.5% { inset: 0 28px 0 0; }
        25%   { inset: 28px 28px 0 0; }
        37.5% { inset: 28px 0 0 0; }
        50%   { inset: 28px 0 0 28px; }
        62.5% { inset: 0 0 0 28px; }
        75%   { inset: 0 0 28px 28px; }
        87.5% { inset: 0 0 28px 0; }
        100%  { inset: 0 28px 28px 0; }
      }
    `}</style>
  </div>
);

/* =============================================
   YARN UNWIND PROGRESS BAR
   ============================================= */
const YarnProgress = ({ progress }: { progress: number }) => (
  <div className="w-48 h-1.5 rounded-full bg-blush/20 overflow-hidden">
    <motion.div
      className="h-full rounded-full bg-gradient-to-r from-caramel via-rose to-blush"
      initial={{ width: "0%" }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    />
  </div>
);

/* =============================================
   FLOATING YARN BALLS
   ============================================= */
const FloatingYarnBalls = () => (
  <>
    {[
      { emoji: "", x: "15%", y: "20%", delay: 0, size: "text-2xl" },
      { emoji: "", x: "80%", y: "15%", delay: 0.6, size: "text-xl" },
      { emoji: "", x: "75%", y: "75%", delay: 1.2, size: "text-lg" },
      { emoji: "", x: "10%", y: "70%", delay: 0.4, size: "text-xl" },
      { emoji: "🪡", x: "50%", y: "10%", delay: 0.9, size: "text-lg" },
    ].map((item, i) => (
      <motion.span
        key={i}
        className={cn("absolute pointer-events-none select-none opacity-20", item.size)}
        style={{ left: item.x, top: item.y }}
        animate={{ y: [0, -12, 0], rotate: [0, 8, -8, 0] }}
        transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: item.delay }}
      >
        {item.emoji}
      </motion.span>
    ))}
  </>
);

/* =============================================
   LOADING MESSAGES — cycle through these
   ============================================= */
const LOADING_MSGS = [
  "Unwinding the yarn…",
  "Picking up the hook…",
  "Each stitch takes a moment…",
  "Almost ready…",
];

/* =============================================
   MAIN LOADING SCREEN
   ============================================= */
interface LoadingScreenProps {
  isLoading: boolean;
  onComplete?: () => void;
  minDuration?: number; // ms — minimum time to show loading screen
}

export const LoadingScreen = ({
  isLoading,
  onComplete,
  minDuration = 1800,
}: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    // Animate progress bar
    const intervals = [
      setTimeout(() => setProgress(25), 200),
      setTimeout(() => setProgress(55), 500),
      setTimeout(() => setProgress(80), 900),
      setTimeout(() => setProgress(95), 1400),
    ];

    // Cycle messages
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MSGS.length);
    }, 700);

    // Hide after minDuration (even if isLoading is still true)
    const hideTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setShouldShow(false);
        onComplete?.();
      }, 300);
    }, minDuration);

    return () => {
      intervals.forEach(clearTimeout);
      clearInterval(msgTimer);
      clearTimeout(hideTimer);
    };
  }, [minDuration, onComplete]);

  // Also hide when isLoading becomes false (after minDuration)
  useEffect(() => {
    if (!isLoading && progress >= 80) {
      setProgress(100);
      const t = setTimeout(() => {
        setShouldShow(false);
        onComplete?.();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isLoading, progress, onComplete]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(244,184,193,0.25) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(201,160,220,0.18) 0%, transparent 50%), #FFF8ED",
          }}
        >
          <FloatingYarnBalls />

          {/* Centre content */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo animation */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center gap-2"
            >
              {/* Circular logo placeholder / emoji */}
              <div className="relative">
                <motion.div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-blush/40 to-mauve/30 flex items-center justify-center text-4xl shadow-glow-blush"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                </motion.div>
                {/* Yarn ball emoji sitting still in centre */}
                <div className="absolute inset-0 flex items-center justify-center text-3xl select-none">
                  
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-center"
              >
                <p className="font-script text-caramel text-xl tracking-wide">Crochet</p>
                <p className="font-display text-2xl font-semibold text-ink-dark -mt-1">Masterpiece</p>
              </motion.div>
            </motion.div>

            {/* Spinner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <CrochetSpinner />
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center gap-2"
            >
              <YarnProgress progress={progress} />
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs font-sans text-ink-light/50 tracking-wide"
                >
                  {LOADING_MSGS[msgIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Bottom tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 font-script text-caramel/50 text-base"
          >
            Just a girl who loves crochet 
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* =============================================
   HOOK — useLoadingScreen
   Usage: const { loading, done } = useLoadingScreen()
   ============================================= */
export const useLoadingScreen = (delay = 1800) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return loading;
};

export default LoadingScreen;
