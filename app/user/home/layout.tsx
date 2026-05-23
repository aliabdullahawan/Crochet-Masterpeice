import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home — Handmade Crochet",
  description:
    "Welcome to Crochet Masterpiece. Discover featured handmade crochet, custom orders, and stories from our studio in Pakistan.",
  alternates: { canonical: "/user/home" },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
