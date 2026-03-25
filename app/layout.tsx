import type { Metadata } from "next";
import "./globals.css";
import { ShopProvider } from "@/lib/ShopContext";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Crochet Masterpiece — Just a Girl Who Loves Crochet",
  description: "Handcrafted crochet products made with love. Browse, order, and track — all in one place.",
  keywords: ["crochet","handmade","yarn","custom orders","Pakistan"],
  openGraph: {
    title: "Crochet Masterpiece",
    description: "Just a girl who loves crochet — handmade with heart.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.dicebear.com" />
      </head>
      <body className="antialiased min-h-screen bg-cream-100" suppressHydrationWarning>
        <div className="noise-overlay" aria-hidden="true" suppressHydrationWarning />
        <AuthProvider>
          <ShopProvider>
            {children}
          </ShopProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
