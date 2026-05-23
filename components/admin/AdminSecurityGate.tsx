"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminSession, isAdminSessionValid } from "@/lib/adminSession";

function AdminSkeletonLoader() {
  return (
    <div className="min-h-screen bg-cream-100 animate-pulse">
      {/* Navbar skeleton */}
      <div className="sticky top-0 z-100 w-full bg-cream-100/95 border-b border-caramel/10 py-3">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-caramel/15" />
            <div className="hidden sm:flex flex-col gap-1">
              <div className="h-3.5 w-16 bg-caramel/15 rounded-md" />
              <div className="h-3 w-20 bg-caramel/10 rounded-md" />
            </div>
          </div>
          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[80, 64, 56, 72, 80, 56, 64, 56, 72].map((w, i) => (
              <div key={i} className="px-3 py-2 rounded-xl">
                <div className="h-4 bg-caramel/12 rounded-lg" style={{ width: w }} />
              </div>
            ))}
          </div>
          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block h-8 w-20 bg-caramel/10 rounded-xl" />
            <div className="w-9 h-9 bg-caramel/12 rounded-xl" />
            <div className="h-8 w-24 bg-caramel/12 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Page content skeleton */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-caramel/15 rounded-xl mb-2" />
            <div className="h-4 w-64 bg-caramel/10 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-caramel/15 rounded-xl" />
        </div>

        {/* Stats cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/80 rounded-2xl border border-caramel/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-24 bg-caramel/12 rounded-lg" />
                <div className="w-9 h-9 bg-caramel/10 rounded-xl" />
              </div>
              <div className="h-8 w-20 bg-caramel/20 rounded-xl mb-1" />
              <div className="h-3 w-32 bg-caramel/8 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Main content area */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Table/list skeleton */}
          <div className="bg-white/80 rounded-2xl border border-caramel/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-caramel/10 flex items-center justify-between">
              <div className="h-5 w-32 bg-caramel/15 rounded-lg" />
              <div className="h-8 w-24 bg-caramel/10 rounded-xl" />
            </div>
            <div className="divide-y divide-caramel/8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-caramel/12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-caramel/12 rounded-lg" style={{ width: `${55 + (i * 13) % 35}%` }} />
                    <div className="h-3 bg-caramel/8 rounded-lg" style={{ width: `${35 + (i * 17) % 30}%` }} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-6 w-16 bg-caramel/10 rounded-lg" />
                    <div className="h-8 w-8 bg-caramel/10 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar widget skeleton */}
          <div className="space-y-4">
            <div className="bg-white/80 rounded-2xl border border-caramel/10 p-5">
              <div className="h-5 w-28 bg-caramel/15 rounded-lg mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-caramel/12 rounded-xl shrink-0" />
                    <div className="flex-1">
                      <div className="h-3.5 bg-caramel/12 rounded-lg mb-1" style={{ width: `${60 + i * 10}%` }} />
                      <div className="h-3 bg-caramel/8 rounded-lg w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/80 rounded-2xl border border-caramel/10 p-5">
              <div className="h-5 w-24 bg-caramel/15 rounded-lg mb-4" />
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-3.5 bg-caramel/10 rounded-lg" style={{ width: "45%" }} />
                    <div className="h-4 w-16 bg-caramel/12 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSecurityGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (pathname === "/user/login") {
      setReady(true);
      return;
    }

    const verify = () => {
      if (!isAdminSessionValid()) {
        clearAdminSession();
        router.replace("/user/login");
        return false;
      }
      return true;
    };

    if (verify()) setReady(true);

    const timer = setInterval(() => {
      if (!verify()) clearInterval(timer);
    }, 60000);

    const onStorage = () => {
      verify();
    };

    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [pathname]);

  if (!ready) {
    return <AdminSkeletonLoader />;
  }
  return <>{children}</>;
}
