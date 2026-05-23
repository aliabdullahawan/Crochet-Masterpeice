"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Castle, Landmark, Mountain, Pyramid, TowerControl, Tag } from "lucide-react";
import { ExpandingCards, CardItem } from "@/components/ui/expanding-cards";
import { shopUrlWithDiscount } from "@/lib/shopDiscounts";

interface ActiveDiscount {
  id: string;
  code: string;
  label: string;
  value: number;
  discountType: "percent" | "flat";
  appliesTo: string;
  endsAt?: string;
}

export function CategoriesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [categories, setCategories] = useState<CardItem[]>([]);
  const [discounts, setDiscounts] = useState<ActiveDiscount[]>([]);

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
          .select("id, name, description, sort_order, image_url")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("products")
          .select("category_id")
          .eq("is_active", true),
      ]);

      const data = (catsRes.data ?? []) as Array<{
        id: string;
        name: string;
        description: string | null;
        sort_order: number;
        image_url: string | null;
      }>;
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
            imgSrc: cat.image_url?.trim() || fallbackImages[i % fallbackImages.length],
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

  const loadDiscounts = React.useCallback(async () => {
    try {
      const { data } = await supabase
        .from("discounts")
        .select("id, code, discount_value, discount_type, end_date, applies_to, target_id, product_id")
        .eq("active", true)
        .not("code", "is", null);

      if (!data?.length) { setDiscounts([]); return; }

      const now = new Date();
      const rows = (data as Array<{
        id: string; code: string; discount_value: number;
        discount_type: "percent" | "flat" | null;
        end_date: string | null;
        applies_to?: "all" | "product" | "category" | "cart" | null;
        target_id?: string | null; product_id?: string | null;
      }>).filter((d) => (!d.end_date || new Date(d.end_date) >= now) && d.applies_to !== "cart");

      const productIds = rows.filter((d) => d.applies_to === "product").map((d) => d.target_id ?? d.product_id).filter((id): id is string => Boolean(id));
      const categoryIds = rows.filter((d) => d.applies_to === "category").map((d) => d.target_id).filter((id): id is string => Boolean(id));

      const [productsRes, categoriesRes] = await Promise.all([
        productIds.length ? supabase.from("products").select("id, name").in("id", productIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
        categoryIds.length ? supabase.from("categories").select("id, name").in("id", categoryIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      ]);

      const productMap = new Map((productsRes.data ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
      const categoryMap = new Map((categoriesRes.data ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));

      setDiscounts(rows.map((d) => {
        const appliesTo = d.applies_to ?? "all";
        const targetId = d.target_id ?? d.product_id ?? null;
        const targetName = appliesTo === "product" ? (targetId ? productMap.get(targetId) : undefined) : appliesTo === "category" ? (targetId ? categoryMap.get(targetId) : undefined) : undefined;
        const label = appliesTo === "all" ? "all products" : targetName ?? (appliesTo === "product" ? "selected product" : "selected category");
        return {
          id: d.id,
          code: d.code.trim().toUpperCase(),
          label,
          value: d.discount_value,
          discountType: d.discount_type ?? "percent",
          appliesTo,
          endsAt: d.end_date ? new Date(d.end_date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : undefined,
        };
      }));
    } catch { setDiscounts([]); }
  }, []);

  useEffect(() => {
    loadCategories();
    loadDiscounts();
  }, [loadCategories, loadDiscounts]);

  useEffect(() => {
    const timer = setInterval(() => { loadCategories(); loadDiscounts(); }, 60000);
    const onVisible = () => {
      if (document.visibilityState === "visible") { loadCategories(); loadDiscounts(); }
    };

    window.addEventListener("focus", () => { loadCategories(); loadDiscounts(); });
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", loadCategories);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadCategories, loadDiscounts]);

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-baby-50/50">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Categories Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-sans font-semibold text-caramel/70 tracking-widest uppercase mb-2">
            Browse by Category
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink-dark">
            What are you looking for?
          </h2>
        </div>

        {categories.length > 0 ? (
          <ExpandingCards items={categories} defaultActiveIndex={0} className="max-w-none h-[700px] md:h-[520px]" />
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

        {/* Discounts Section */}
        {discounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20"
          >
            <div className="text-center mb-10">
              <p className="text-xs font-sans font-semibold text-caramel/70 tracking-widest uppercase mb-2 flex items-center justify-center gap-2">
                <Tag className="w-3 h-3" /> Active Offers
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink-dark">
                Special Discounts
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discounts.map((d) => {
                const valueLabel = d.discountType === "flat" ? `PKR ${d.value.toLocaleString()} off` : `${d.value}% off`;
                return (
                  <div
                    key={d.id}
                    className="relative rounded-2xl bg-white/90 p-5 overflow-hidden group"
                    style={{
                      border: "2px solid #1a0a00",
                      boxShadow: "4px 4px 0px 0px #1a0a00, 6px 6px 0px 0px #7a4a1e",
                    }}
                  >
                    {/* Decorative background */}
                    <div className="absolute inset-0 bg-linear-to-br from-blush/10 via-cream-100/60 to-mauve/10 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-flex items-center gap-1.5 bg-caramel/15 border border-caramel/25 text-caramel text-[10px] font-sans font-bold px-2 py-0.5 rounded-lg tracking-widest uppercase">
                            <Tag className="w-2.5 h-2.5" /> {d.code}
                          </span>
                        </div>
                        <span
                          className="text-2xl font-black text-caramel"
                          style={{ textShadow: "1px 1px 0px #1a0a00" }}
                        >
                          {valueLabel}
                        </span>
                      </div>
                      <p className="text-xs font-sans text-ink-light/65 mb-1">
                        Applies to: <span className="font-semibold text-ink">{d.label}</span>
                      </p>
                      {d.endsAt && (
                        <p className="text-[10px] font-sans text-ink-light/50 mb-4">Ends {d.endsAt}</p>
                      )}
                      {!d.endsAt && <div className="mb-4" />}
                      <Link
                        href={shopUrlWithDiscount(d.code)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all"
                        style={{
                          background: "linear-gradient(135deg, #C8956C, #E8A0A8)",
                          border: "2px solid #1a0a00",
                          boxShadow: "3px 3px 0px 0px #1a0a00",
                        }}
                      >
                        Shop Now →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
