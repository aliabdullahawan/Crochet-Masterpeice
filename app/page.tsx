"use client";

import { useEffect } from "react";
import { isAdminSessionValid, clearAdminSession } from "@/lib/adminSession";

export default function RootPage() {
  useEffect(() => {
    if (isAdminSessionValid()) {
      window.location.href = "/admin/dashboard";
      return;
    }

    clearAdminSession();
    window.location.href = "/user/home";
  }, []);

  return null;
}
