"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdminSessionValid, clearAdminSession } from "@/lib/adminSession";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAdminSessionValid()) {
      router.replace("/admin/dashboard");
      return;
    }

    clearAdminSession();
    router.replace("/user/home");
  }, [router]);

  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center">
      <p className="text-sm font-sans text-ink-light/70">Loading...</p>
    </main>
  );
}
