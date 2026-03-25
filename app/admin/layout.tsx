import type { Metadata } from "next";
import AdminSecurityGate from "@/components/admin/AdminSecurityGate";

export const metadata: Metadata = {
  title: "Admin — Crochet Masterpiece",
  description: "Admin dashboard for Crochet Masterpiece",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminSecurityGate>{children}</AdminSecurityGate>;
}
