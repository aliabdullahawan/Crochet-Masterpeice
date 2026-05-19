"use client";

import Link from "next/link";
import { Sparkles, Truck, Heart } from "lucide-react";

export function ShopHeroBanner() {
  return (
    <div className="relative overflow-hidden border-b border-caramel/15 bg-gradient-to-r from-cream-50 via-blush/20 to-mauve/10">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <img src="/images/crochet-3.jpg" alt="" className="absolute right-0 top-0 h-full w-1/3 object-cover" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-cream-100 via-cream-100/85 to-transparent" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-caramel mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Handmade collection
            </p>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-ink-dark">
              Every piece is crocheted with love — just for you
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-sans font-semibold text-ink-light/75">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-caramel/15">
              <Heart className="w-3.5 h-3.5 text-blush" /> Custom orders welcome
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-caramel/15">
              <Truck className="w-3.5 h-3.5 text-caramel" /> Pakistan-wide delivery
            </span>
            <Link
              href="/user/custom-order"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-caramel to-rose text-white shadow-button hover:opacity-95 transition"
            >
              Design yours →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
