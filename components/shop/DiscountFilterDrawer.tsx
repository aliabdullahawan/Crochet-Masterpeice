"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShopDiscount } from "@/lib/shopDiscounts";
import { discountScopeLabel } from "@/lib/shopDiscounts";

type Props = {
  open: boolean;
  onClose: () => void;
  discounts: ShopDiscount[];
  selectedCodes: string[];
  onToggleCode: (code: string) => void;
  onClear: () => void;
};

export function DiscountFilterDrawer({
  open,
  onClose,
  discounts,
  selectedCodes,
  onToggleCode,
  onClear,
}: Props) {
  const groups: { key: string; title: string; items: ShopDiscount[] }[] = [
    { key: "all", title: "All products", items: discounts.filter((d) => d.appliesTo === "all") },
    { key: "category", title: "Category discounts", items: discounts.filter((d) => d.appliesTo === "category") },
    { key: "product", title: "Product discounts", items: discounts.filter((d) => d.appliesTo === "product") },
    { key: "cart", title: "Cart only (checkout)", items: discounts.filter((d) => d.appliesTo === "cart") },
  ].filter((g) => g.items.length > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="discount-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink-dark/40 z-40 backdrop-blur-xs"
          />
          <motion.aside
            key="discount-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed top-0 left-0 bottom-0 w-[min(100vw-2rem,22rem)] glass z-50 border-r border-blush/25 flex flex-col shadow-card"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-caramel/12">
              <h2 className="font-display text-lg font-semibold text-ink-dark flex items-center gap-2">
                <Tag className="w-4 h-4 text-caramel" /> Discounts
              </h2>
              <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-blush/10 text-ink-light">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {groups.map((group) => (
                <div key={group.key}>
                  <p className="text-[10px] font-sans font-semibold text-ink-light/55 uppercase tracking-widest mb-2">
                    {group.title}
                  </p>
                  <div className="space-y-1.5">
                    {group.items.map((d) => {
                      const isCartOnly = d.appliesTo === "cart";
                      const selected = !isCartOnly && selectedCodes.includes(d.code);
                      const valueLabel =
                        d.discountType === "flat"
                          ? `PKR ${d.percent.toLocaleString()}`
                          : `-${d.percent}%`;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          disabled={isCartOnly}
                          onClick={() => {
                            if (!isCartOnly) {
                              onToggleCode(d.code);
                              onClose();
                            }
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-xl border text-xs font-sans transition-all",
                            selected
                              ? "bg-caramel/12 border-caramel/35 text-caramel"
                              : "border-caramel/15 bg-white/70 text-ink hover:border-caramel/30",
                            isCartOnly && "opacity-55 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={cn(
                                "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                                selected ? "bg-caramel border-caramel" : "border-caramel/25"
                              )}
                            >
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold">{d.code}</span>
                              <span className="text-caramel ml-1.5">{valueLabel}</span>
                              <p className="text-[10px] text-ink-light/55 mt-0.5">{discountScopeLabel(d)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {discounts.length === 0 && (
                <p className="text-sm text-ink-light/60 font-sans">No active discount codes right now.</p>
              )}
            </div>
            {selectedCodes.length > 0 && (
              <div className="px-5 py-3 border-t border-caramel/12">
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    onClose();
                  }}
                  className="w-full py-2 rounded-xl border border-caramel/25 text-xs font-semibold text-caramel hover:bg-caramel/8"
                >
                  Clear selected discounts
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
