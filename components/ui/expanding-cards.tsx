"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface CardItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  icon: React.ReactNode;
  linkHref: string;
}

interface ExpandingCardsProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CardItem[];
  defaultActiveIndex?: number;
}

export const ExpandingCards = React.forwardRef<HTMLUListElement, ExpandingCardsProps>(
  ({ className, items, defaultActiveIndex = 0, ...props }, ref) => {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = React.useState<number | null>(defaultActiveIndex);
    const [isDesktop, setIsDesktop] = React.useState(false);

    React.useEffect(() => {
      const handleResize = () => {
        setIsDesktop(window.innerWidth >= 768);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const gridStyle = React.useMemo(() => {
      if (activeIndex === null) return {};

      if (isDesktop) {
        const columns = items
          .map((_, index) => (index === activeIndex ? "5fr" : "1fr"))
          .join(" ");
        return { gridTemplateColumns: columns };
      }

      const rows = items
        .map((_, index) => (index === activeIndex ? "5fr" : "1fr"))
        .join(" ");
      return { gridTemplateRows: rows };
    }, [activeIndex, items, isDesktop]);

    const handleInteraction = (index: number) => {
      setActiveIndex(index);
    };

    return (
      <ul
        className={cn(
          "w-full max-w-6xl gap-3",
          "grid",
          "h-[700px] md:h-[500px]",
          "transition-[grid-template-columns,grid-template-rows] duration-500 ease-out",
          className
        )}
        style={{
          ...gridStyle,
          ...(isDesktop ? { gridTemplateRows: "1fr" } : { gridTemplateColumns: "1fr" }),
        }}
        ref={ref}
        {...props}
      >
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <li
              key={item.id}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl",
                "border-3 border-[#1a0a00] bg-card text-card-foreground",
                "transition-all duration-300",
                "md:min-w-[90px]",
                "min-h-0 min-w-0",
              )}
              style={{
                // 2D anime-style solid shadow: layered black + brown
                boxShadow: isActive
                  ? "5px 5px 0px 0px #1a0a00, 8px 8px 0px 0px #7a4a1e"
                  : "3px 3px 0px 0px #1a0a00, 5px 5px 0px 0px #7a4a1e",
                border: "2.5px solid #1a0a00",
                transform: isActive ? "translate(-2px, -2px)" : "translate(0, 0)",
              }}
              onMouseEnter={() => handleInteraction(index)}
              onFocus={() => handleInteraction(index)}
              onClick={() => {
                if (activeIndex === index) {
                  router.push(item.linkHref);
                  return;
                }
                handleInteraction(index);
              }}
              tabIndex={0}
              data-active={isActive}
            >
              <img
                src={item.imgSrc}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover transition-all duration-300 ease-out group-data-[active=true]:scale-100 group-data-[active=true]:grayscale-0 scale-110 grayscale"
              />
              {/* 2D anime style — stronger gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-[#1a0a00]/90 via-[#1a0a00]/40 to-transparent" />
              {/* Brown tinted border glow on active */}
              {isActive && (
                <div className="absolute inset-0 ring-2 ring-inset ring-[#C8956C]/50 rounded-2xl pointer-events-none" />
              )}

              <article className="absolute inset-0 flex flex-col justify-end gap-2 p-5">
                <h3 className="hidden origin-left rotate-90 text-sm font-bold uppercase tracking-wider text-white/80 opacity-100 transition-all duration-300 ease-out md:block group-data-[active=true]:opacity-0" style={{ textShadow: "1px 1px 0px #1a0a00" }}>
                  {item.title}
                </h3>

                <div className="text-white/90 opacity-0 transition-all duration-300 delay-75 ease-out group-data-[active=true]:opacity-100">
                  {item.icon}
                </div>

                <h3 className="text-2xl font-black text-white opacity-0 transition-all duration-300 delay-150 ease-out group-data-[active=true]:opacity-100" style={{ textShadow: "2px 2px 0px #1a0a00, 3px 3px 0px #7a4a1e" }}>
                  {item.title}
                </h3>

                <p className="w-full max-w-xs text-sm text-white/85 opacity-0 transition-all duration-300 delay-225 ease-out group-data-[active=true]:opacity-100">
                  {item.description}
                </p>

                <a
                  href={item.linkHref}
                  className={cn(
                    "w-fit mt-1 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest",
                    "text-[#1a0a00] bg-[#C8956C]",
                    "opacity-0 transition-all duration-300 delay-300 group-data-[active=true]:opacity-100",
                    "hover:bg-white",
                    "border-2 border-[#1a0a00]",
                  )}
                  style={{ boxShadow: "2px 2px 0px #1a0a00" }}
                  onClick={(e) => {
                    if (activeIndex !== index) {
                      e.preventDefault();
                    }
                  }}
                >
                  Browse category →
                </a>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }
);

ExpandingCards.displayName = "ExpandingCards";
