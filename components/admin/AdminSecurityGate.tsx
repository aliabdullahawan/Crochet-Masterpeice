"use client";

import { useEffect, useState } from "react";
import { clearAdminSession, isAdminSessionValid } from "@/lib/adminSession";

export default function AdminSecurityGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
