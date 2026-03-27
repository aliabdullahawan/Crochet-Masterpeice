"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Castle, Landmark, Mountain, Pyramid, TowerControl } from "lucide-react";
import { ExpandingCards, CardItem } from "@/components/ui/expanding-cards";

export function CategoriesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [categories, setCategories] = useState<CardItem[]>([]);

  const fallbackImages = [
    "/images/crochet-1.jpg",
    "/images/crochet-2.jpg",
    "/images/crochet-4.jpg",
    "/images/crochet-5.jpg",
    "/images/crochet-6.jpg",
  ];
  const fallbackIcons = [
    <Pyramid key="pyramid" size={22} />,
    <Castle key="castle" size={22} />,
    <Mountain key="mountain" size={22} />,
    <TowerControl key="tower" size={22} />,
    <Landmark key="landmark" size={22} />,
  ];

  const loadCategories = React.useCallback(async () => {
    try {
      const [catsRes, productsRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, description, sort_order")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("products")
          .select("category_id")
          .eq("is_active", true),
      ]);

      const data = (catsRes.data ?? []) as Array<{ id: string; name: string; description: string | null; sort_order: number }>;
      const productRows = (productsRes.data ?? []) as Array<{ category_id: string | null }>;
      const usedCategoryIds = new Set(
        productRows
          .map((row) => row.category_id)
          .filter((id): id is string => Boolean(id))
      );

      if (data?.length) {
        setCategories(
          data
            .filter((cat) => usedCategoryIds.has(cat.id))
            .map((cat, i: number) => ({
            id: cat.id,
            title: cat.name,
            description: cat.description ?? "Handmade crochet pieces in this collection.",
            imgSrc: fallbackImages[i % fallbackImages.length],
            icon: fallbackIcons[i % fallbackIcons.length],
            linkHref: `/user/shop?category=${cat.id}`,
          }))
        );
        return;
      }

      setCategories([]);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const timer = setInterval(loadCategories, 60000);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadCategories();
    };

    window.addEventListener("focus", loadCategories);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", loadCategories);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadCategories]);

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-cream-100">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-sans font-semibold text-caramel/70 tracking-widest uppercase mb-2">
            Browse by Category
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink-dark">
            What are you looking for?
          </h2>
        </div>

        {categories.length > 0 ? (
          <ExpandingCards items={categories} defaultActiveIndex={0} className="max-w-none h-[560px] md:h-[420px]" />
        ) : (
          <div className="rounded-3xl border border-caramel/20 bg-white/70 p-10 text-center">
            <p className="text-sm font-sans text-ink-light/65">No active categories with products available yet.</p>
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/user/shop"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl border-2 border-caramel/25 text-caramel font-sans font-semibold text-sm hover:bg-caramel/8 hover:border-caramel/50 transition-all btn-bubble"
          >
            Browse all products →
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
