"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CategoryCardItem {
  id: string;
  title: string;
  description: string;
  bgColor: string; // tailwind gradient classes
  href: string;
  count?: number;
  image_url?: string; // from admin upload or Supabase
}

interface ExpandingCategoryCardsProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CategoryCardItem[];
  defaultActiveIndex?: number;
}

export const ExpandingCategoryCards = React.forwardRef<
  HTMLUListElement,
  ExpandingCategoryCardsProps
>(({ className, items, defaultActiveIndex = 0, ...props }, ref) => {
  const [activeIndex, setActiveIndex] = React.useState<number>(defaultActiveIndex);
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const gridStyle = React.useMemo(() => {
    if (isDesktop) {
      const cols = items.map((_, i) => (i === activeIndex ? "4fr" : "1fr")).join(" ");
      return { gridTemplateColumns: cols };
    } else {
      const rows = items.map((_, i) => (i === activeIndex ? "4fr" : "1fr")).join(" ");
      return { gridTemplateRows: rows };
    }
  }, [activeIndex, items.length, isDesktop]);

  return (
    <ul
      ref={ref}
      className={cn(
        "w-full gap-2.5 grid",
        "h-[420px] md:h-[260px]",
        "transition-[grid-template-columns,grid-template-rows] duration-500 ease-out",
        className
      )}
      style={{
        ...gridStyle,
        ...(isDesktop ? { gridTemplateRows: "1fr" } : { gridTemplateColumns: "1fr" }),
      }}
      {...props}
    >
      {items.map((item, index) => {
        const isActive = activeIndex === index;
        return (
          <li
            key={item.id}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-300",
              "md:min-w-[60px] min-h-0 min-w-0",
              isActive
                ? "border-caramel/40 shadow-card"
                : "border-blush/20 hover:border-blush/50 shadow-soft"
            )}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(index)}
            tabIndex={0}
            onFocus={() => setActiveIndex(index)}
          >
            {/* Background gradient */}
            <div className={cn("absolute inset-0 bg-gradient-to-br transition-opacity duration-300", item.bgColor,
              isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70")} />

            {/* Noise overlay */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

            {/* Content */}
            <Link href={item.href} className="absolute inset-0 flex flex-col justify-end p-4" onClick={(e) => !isActive && e.preventDefault()}>
              {/* Collapsed: rotated title (desktop) */}
              <h3 className={cn(
                "hidden origin-left rotate-90 text-xs font-semibold uppercase tracking-widest text-ink/60 transition-all duration-300 md:block",
                isActive ? "opacity-0 scale-0" : "opacity-100"
              )}>
                {item.title}
              </h3>

              {/* Active content */}
              <div className={cn("transition-all duration-300", isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110">
                  {item.emoji}
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink-dark leading-tight">{item.title}</h3>
                    <p className="text-xs text-ink-light/65 font-sans mt-0.5 max-w-[180px] leading-snug">{item.description}</p>
                  </div>
                  {item.count !== undefined && (
                    <span className="flex-shrink-0 text-xs font-sans font-bold text-caramel bg-white/60 px-2 py-1 rounded-xl border border-caramel/20 mb-0.5">
                      {item.count}+
                    </span>
                  )}
                </div>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 mt-2.5 text-xs font-sans font-bold text-caramel hover:text-ink transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Browse →
                </Link>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
});
ExpandingCategoryCards.displayName = "ExpandingCategoryCards";
