"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/user/HeroSection";
import { FeaturedProducts } from "@/components/user/FeaturedProducts";
import { AboutSection } from "@/components/user/AboutSection";
import { CustomOrderBanner } from "@/components/user/CustomOrderBanner";
import { ReviewsSection } from "@/components/user/ReviewsSection";
import { CategoriesSection } from "@/components/user/CategoriesSection";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { BusinessFeature } from "@/components/user/BusinessFeature";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-cream-100" suppressHydrationWarning />;
  }

  return (
    <>
      <LoadingScreen isLoading={loading} onComplete={() => setLoading(false)} minDuration={1800} />
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <main>
          {/* 1. Hero */}
          <HeroSection />
          {/* 1b. Business feature — full photo overview like crochet.com */}
          <BusinessFeature />
          {/* 2. Featured products */}
          <FeaturedProducts />
          {/* 3. About/story */}
          <AboutSection />
          {/* 4. Categories — just above WhatsApp order section */}
          <CategoriesSection />
          {/* 5. Custom order CTA */}
          <CustomOrderBanner />
          {/* 6. Reviews */}
          <ReviewsSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
