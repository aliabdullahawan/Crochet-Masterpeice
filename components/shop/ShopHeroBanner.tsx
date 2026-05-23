"use client";

import Link from "next/link";
import { Sparkles, Truck, Heart } from "lucide-react";

export function ShopHeroBanner() {
  return (
    <div className="relative overflow-hidden border-b border-blush/20 bg-linear-to-r from-baby-50 via-cream-100 to-blush/20">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 15% 50%, rgba(255,228,239,0.5) 0%, transparent 45%)",
        }}
      />
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
              href="/user/shop?filter=featured"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/80 border border-blush/30 text-ink hover:bg-blush/10 transition"
            >
              Shop Featured →
            </Link>
            <Link
              href="/user/custom-order"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-linear-to-r from-caramel to-rose text-white shadow-button hover:opacity-95 transition"
            >
              Design yours →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
