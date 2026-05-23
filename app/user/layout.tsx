import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Crochet Masterpiece — Handmade Crochet Shop Pakistan",
    template: "%s | Crochet Masterpiece",
  },
  description:
    "Shop handmade crochet bags, accessories, and custom gifts. Order online, track delivery, and request custom crochet designs in Pakistan.",
  keywords: [
    "crochet shop Pakistan",
    "handmade crochet",
    "custom crochet order",
    "crochet bags",
    "crochet gifts",
    "yarn crafts",
    "Crochet Masterpiece",
  ],
  alternates: {
    canonical: "/user/home",
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: `${siteUrl}/user/home`,
    siteName: "Crochet Masterpiece",
    title: "Crochet Masterpiece — Handmade Crochet",
    description: "Handcrafted crochet with love. Shop featured pieces or order something custom.",
    images: [{ url: "/images/logo.png", width: 512, height: 512, alt: "Crochet Masterpiece logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crochet Masterpiece",
    description: "Handmade crochet products and custom orders.",
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return children;
}
