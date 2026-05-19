"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { clearAdminSession, isAdminSessionValid } from "@/lib/adminSession";

export default function AdminSecurityGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
        window.location.href = "/admin/login";
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

  if (!ready) return null;
  return <>{children}</>;
}
