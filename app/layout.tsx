import type { Metadata } from "next";
import "./globals.css";
import { ShopProvider } from "@/lib/ShopContext";
import { AuthProvider } from "@/lib/AuthContext";
import WhatsAppFloatingButton from "@/components/ui/WhatsAppFloatingButton";
import SplashScreen from "@/components/ui/SplashScreen";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Crochet Masterpiece — Handmade Crochet Shop",
    template: "%s | Crochet Masterpiece",
  },
  description:
    "Handcrafted crochet products made with love. Browse the shop, place orders, track delivery, and request custom designs.",
  keywords: [
    "crochet",
    "handmade",
    "yarn",
    "custom orders",
    "Pakistan",
    "crochet shop",
    "handmade gifts",
  ],
  authors: [{ name: "Crochet Masterpiece" }],
  creator: "Crochet Masterpiece",
  icons: {
    icon: [{ url: "/images/logo.png", type: "image/png" }],
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "Crochet Masterpiece",
    description: "Just a girl who loves crochet — handmade with heart.",
    type: "website",
    url: siteUrl,
    siteName: "Crochet Masterpiece",
    locale: "en_PK",
    images: [{ url: "/images/logo.png", width: 512, height: 512, alt: "Crochet Masterpiece" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crochet Masterpiece",
    description: "Handmade crochet products and custom orders.",
    images: ["/images/logo.png"],
  },
  verification: {
    // Add when you have them: google: "your-google-verification-code",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PK" suppressHydrationWarning>
      <head>
        <SiteJsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.dicebear.com" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="antialiased min-h-screen bg-cream-100 relative" suppressHydrationWarning>
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-caramel/15 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-mauve/15 blur-[150px]" />
          <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] rounded-full bg-pink-300/10 blur-[100px]" />
        </div>
        <AuthProvider>
          <ShopProvider>
            <SplashScreen>
              {children}
              <WhatsAppFloatingButton />
            </SplashScreen>
          </ShopProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
