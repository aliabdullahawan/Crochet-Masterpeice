import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crochet Masterpiece | Handmade Crochet from Pakistan",
  description: "Made with hands, sent with heart. Shop beautiful handmade crochet sweaters, tops, bags, and amigurumi. Order custom crochet items directly from Pakistan's favourite maker.",
  openGraph: {
    title: "Crochet Masterpiece",
    description: "Handmade crochet originals in Pakistan. Shop our collection or request custom designs.",
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
