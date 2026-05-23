import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Handmade Crochet",
  description:
    "Browse handmade crochet products — bags, accessories, gifts, and more. Filter by category and order online.",
  alternates: { canonical: "/user/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
