"use client";

import React, { useState, useEffect } from "react";
import { Component as LumaSpin } from "@/components/ui/luma-spin";

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setLoading(false);
    } else {
      // Show the splash screen for exactly 2 seconds
      const timer = setTimeout(() => {
        sessionStorage.setItem("hasSeenSplash", "true");
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-pink-100">
        <LumaSpin />
        <p className="mt-4 font-script text-ink-dark text-2xl animate-pulse">Loading masterpiece...</p>
      </div>
    );
  }

  return <>{children}</>;
}
