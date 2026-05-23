import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Products | Crochet Masterpiece",
  description: "Browse our entire collection of handmade crochet items, from warm sweaters to beautiful custom accessories. Order directly from Crochet Masterpiece.",
  openGraph: {
    title: "Shop Crochet Masterpiece",
    description: "Browse our entire collection of handmade crochet items.",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
