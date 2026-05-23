"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminSession, isAdminSessionValid } from "@/lib/adminSession";

export default function AdminSecurityGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }

    const verify = () => {
      if (!isAdminSessionValid()) {
        clearAdminSession();
        router.replace("/admin/login");
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
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <p className="text-sm font-sans text-ink-light/60">Checking admin session...</p>
      </div>
    );
  }
  return <>{children}</>;
}
