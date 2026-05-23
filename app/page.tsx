"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAdminSessionValid, clearAdminSession } from "@/lib/adminSession";

function RootRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storePreview = searchParams.get("store") === "1";

  useEffect(() => {
    if (storePreview) {
      router.replace("/user/home");
      return;
    }

    if (isAdminSessionValid()) {
      router.replace("/admin/dashboard");
      return;
    }

    clearAdminSession();
    router.replace("/user/home");
  }, [router, storePreview]);

  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center">
      <p className="text-sm font-sans text-ink-light/70">Loading...</p>
    </main>
  );
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cream-100 flex items-center justify-center">
          <p className="text-sm font-sans text-ink-light/70">Loading...</p>
        </main>
      }
    >
      <RootRedirect />
    </Suspense>
  );
}
