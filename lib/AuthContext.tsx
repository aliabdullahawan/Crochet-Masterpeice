"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoggedIn: boolean;
  displayName: string;
  avatarUrl: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true,
  isLoggedIn: false, displayName: "", avatarUrl: null,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function getAvatarUrl(seed: string, style: "lorelei" | "bottts" | "avataaars" | "micah" = "lorelei") {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffd5dc,ffdfbf,d1d4f9,c0aede&radius=50`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = (u: User | null) => {
    if (typeof window === "undefined") return;
    if (u) {
      localStorage.setItem("cm_user_logged_in", "true");
      localStorage.setItem("cm_user_id",    u.id);
      localStorage.setItem("cm_user_email", u.email ?? "");
      localStorage.setItem("cm_user_name",  u.user_metadata?.name ?? u.email ?? "");
    } else {
      ["cm_user_logged_in","cm_user_name","cm_user_email","cm_user_id"]
        .forEach(k => localStorage.removeItem(k));
    }
  };

  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    syncUser(user);
  };

  useEffect(() => {
    // ── Restore session from localStorage on page load ──────
    // Supabase does this automatically with persistSession: true
    // This call just reads from localStorage (no network request)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      syncUser(session?.user ?? null);
    });

    // ── Listen for all auth events ───────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        syncUser(session?.user ?? null);

        // When user signs in via Google, create/update their profile row
        if (event === "SIGNED_IN" && session?.user) {
          const u = session.user;
          if (u.app_metadata?.provider === "google") {
            try {
              await supabase.from("users").upsert({
                id: u.id,
                email: u.email!,
                name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email ?? "User",
                avatar_url: u.user_metadata?.avatar_url ?? null,
              } as unknown as never, { onConflict: "id" });
            } catch { /* users table may not exist yet */ }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const isLoggedIn  = !!user;
  const displayName = user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "";
  const avatarUrl   = user?.user_metadata?.avatar_url
    ?? (user ? getAvatarUrl(user.email ?? user.id, "lorelei") : null);

  return (
    <AuthContext.Provider value={{ user, session, loading, isLoggedIn, displayName, avatarUrl, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
