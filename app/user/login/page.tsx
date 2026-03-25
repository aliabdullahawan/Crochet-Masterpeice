"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { signInWithEmail, signInWithGoogle, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { startAdminSession, isAdminSessionValid, clearAdminSession } from "@/lib/adminSession";

/* =============================================
   INPUT FIELD
   ============================================= */
const InputField = ({ label, type, placeholder, value, onChange, icon, rightEl, error }: {
  label: string; type: string; placeholder: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode; rightEl?: React.ReactNode; error?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold tracking-widest uppercase text-ink-light/65 font-sans pl-1">{label}</label>
      <div className={cn("relative flex items-center rounded-2xl border-[1.5px] transition-all duration-300 overflow-hidden",
        focused ? "border-caramel bg-white shadow-[0_0_0_3px_rgba(200,149,108,0.18)]"
          : error ? "border-red-300 bg-cream-50"
          : "border-caramel/20 bg-cream-50/80 hover:border-caramel/45")}>
        <div className={cn("flex items-center pl-4 flex-shrink-0 transition-colors", focused ? "text-caramel" : "text-ink-light/45")}>{icon}</div>
        <input type={type} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-3.5 text-sm font-sans text-ink placeholder:text-ink-light/35 outline-none border-none" />
        {rightEl && <div className="pr-3">{rightEl}</div>}
      </div>
      {error && <p className="text-[11px] text-red-400 pl-1">{error}</p>}
    </div>
  );
};

/* =============================================
   GOOGLE BUTTON
   ============================================= */
const GoogleButton = ({ onClick, loading }: { onClick: () => void; loading: boolean }) => (
  <button onClick={onClick} disabled={loading}
    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-caramel/20 bg-white/80 text-sm font-sans font-semibold text-ink hover:bg-blush/8 hover:border-blush/40 active:scale-[0.98] transition-all duration-200 btn-bubble disabled:opacity-60">
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
        <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
    )}
    {loading ? "Connecting..." : "Continue with Google"}
  </button>
);

/* =============================================
   LOGIN PAGE
   ============================================= */
export default function LoginPage() {
  const { isLoggedIn } = useAuth();
  const searchParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : null;
  const [email, setEmail] = useState(searchParams?.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [phase, setPhase] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== "undefined" && isAdminSessionValid()) {
      window.location.href = "/admin/dashboard";
      return;
    }
    clearAdminSession();
    if (isLoggedIn) window.location.href = "/user/home";
    const t = setTimeout(() => setPhase(1), 80);
    return () => clearTimeout(t);
  }, [isLoggedIn]);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";
    if (mode === "password" && !password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    // Single-login behavior:
    // If credentials match the one admin account, route to admin dashboard.
    const ADMIN_EMAIL = "amnamubeen516@gmail.com";
    const ADMIN_PASSWORD = "Amnamubeen516@";
    if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      startAdminSession("Crochet Masterpiece", ADMIN_EMAIL);
      setLoading(false);
      window.location.href = "/admin/dashboard";
      return;
    }

    // Optional DB check for admin row (same behavior as admin login page fallback).
    try {
      const { data: adminData, error: adminErr } = await supabase
        .from("admins")
        .select("name, email")
        .eq("email", email.trim().toLowerCase())
        .eq("password_hash", password)
        .single();

      const admin = (adminData as { name: string; email: string } | null);

      if (!adminErr && admin) {
        startAdminSession(admin.name, admin.email);
        setLoading(false);
        window.location.href = "/admin/dashboard";
        return;
      }
    } catch {
      // Continue with normal user login when admin table check is unavailable.
    }

    const { error } = await signInWithEmail(email.trim(), password, rememberMe);
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed")) {
        setErrors({ general: "Email not confirmed — go to your Supabase dashboard → Auth → Providers → Email → disable Confirm email → Save." });
      } else if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("wrong")) {
        setErrors({ general: "Wrong email or password. Please check and try again." });
      } else if (msg.includes("too many") || msg.includes("rate")) {
        setErrors({ general: "Too many attempts. Please wait a minute and try again." });
      } else if (msg.includes("not found") || msg.includes("no user")) {
        setErrors({ general: "No account found. Please sign up first." });
      } else {
        setErrors({ general: `Login failed: ${error.message}` });
      }
    } else {
      window.location.href = "/user/home";
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Enter your email first" }); return;
    }
    setMagicLoading(true);
    // Send magic link / OTP email via Supabase
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/user/home` },
    });
    setMagicLoading(false);
    if (error) setErrors({ general: error.message });
    else setMagicSent(true);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { setErrors({ general: error.message }); setGoogleLoading(false); }
    // On success, Supabase redirects the browser — no need to reset loading
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 25% 35%, rgba(244,184,193,0.22) 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(201,160,220,0.15) 0%, transparent 50%), #FFF8ED" }}>

      {/* Background images */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img src="/images/bg-yarn-table.jpg" alt="" aria-hidden className="absolute top-0 left-0 w-1/2 h-full object-cover opacity-[0.06]" />
        <img src="/images/bg-crochet-pink.jpg" alt="" aria-hidden className="absolute top-0 right-0 w-1/2 h-full object-cover opacity-[0.06]" />
        <div className="absolute inset-0 bg-gradient-to-br from-cream-100/90 via-transparent to-cream-100/80" />
      </div>

      <div className={cn("w-full max-w-md relative z-10 transition-all duration-700",
        phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-soft ring-4 ring-blush/20 mb-3">
            <Image src="/images/logo.png" alt="Logo" width={64} height={64} className="object-cover" />
          </div>
          <p className="font-script text-caramel text-xl">Welcome back</p>
          <p className="font-display text-2xl font-semibold text-ink-dark -mt-1">Crochet Masterpiece</p>
        </div>

        <div className="glass rounded-3xl shadow-card border border-blush/20 overflow-hidden">
          {/* Mode tabs */}
          <div className="flex border-b border-blush/15">
            {(["password", "magic"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setErrors({}); setMagicSent(false); }}
                className={cn("flex-1 py-3.5 text-xs font-sans font-semibold transition-all",
                  mode === m ? "bg-caramel/10 text-caramel border-b-2 border-caramel" : "text-ink-light/55 hover:text-ink")}>
                {m === "password" ? "Email & Password" : "Magic Link / OTP"}
              </button>
            ))}
          </div>

          <div className="px-7 py-6 space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-xs text-red-600">{errors.general}</div>
            )}

            {magicSent ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blush/30 to-caramel/20 flex items-center justify-center mx-auto mb-4 text-3xl">
                  📧
                </div>
                <h3 className="font-display text-lg font-semibold text-ink-dark mb-2">Check your inbox!</h3>
                <p className="text-sm text-ink-light/65 font-sans">We sent a magic link to <strong>{email}</strong>. Click it to log in.</p>
                <button onClick={() => setMagicSent(false)} className="mt-4 text-xs text-caramel font-sans font-semibold hover:text-ink transition-colors">
                  Try again
                </button>
              </motion.div>
            ) : (
              <form onSubmit={mode === "password" ? handleLogin : (e) => { e.preventDefault(); handleMagicLink(); }} className="space-y-4">
                <InputField label="Email Address" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                  icon={<Mail className="w-4 h-4" />} error={errors.email} />

                {mode === "password" && (
                  <InputField label="Password" type={showPw ? "text" : "password"} placeholder="Your password"
                    value={password} onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                    icon={<Lock className="w-4 h-4" />} error={errors.password}
                    rightEl={
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="p-1 text-ink-light/40 hover:text-caramel transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    } />
                )}

                {mode === "password" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div onClick={() => setRememberMe(!rememberMe)}
                        className={cn("w-4.5 h-4.5 rounded-md border-[1.5px] flex items-center justify-center transition-all",
                          rememberMe ? "bg-caramel border-caramel" : "border-caramel/30 group-hover:border-caramel/60")}>
                        {rememberMe && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span className="text-xs font-sans text-ink-light/65">Remember me</span>
                    </label>
                    <Link href="/user/forgot-password" className="text-xs text-caramel hover:text-ink font-sans font-semibold transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                )}

                <button type="submit" disabled={loading || magicLoading}
                  className={cn("w-full py-3.5 rounded-2xl font-sans font-bold text-sm text-white",
                    "bg-gradient-to-r from-caramel via-rose to-blush",
                    "shadow-button hover:shadow-button-hover hover:-translate-y-0.5",
                    "transition-all duration-300 btn-bubble relative overflow-hidden group",
                    "flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed")}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {(loading || magicLoading) ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {mode === "magic" ? "Sending..." : "Signing in..."}</>
                  ) : mode === "magic" ? (
                    <><Sparkles className="w-4 h-4" /> Send Magic Link</>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Sign In</>
                  )}
                </button>
              </form>
            )}

            {!magicSent && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-caramel/15" />
                  <span className="text-[11px] text-ink-light/40 font-sans">or</span>
                  <div className="flex-1 h-px bg-caramel/15" />
                </div>
                <GoogleButton onClick={handleGoogle} loading={googleLoading} />
              </>
            )}
          </div>

          <div className="px-7 pb-5 text-center">
            <p className="text-xs font-sans text-ink-light/55">
              Don&apos;t have an account?{" "}
              <Link href="/user/signup" className="text-caramel font-semibold hover:text-ink transition-colors">Sign up</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-ink-light/35 font-sans mt-5">
          <Link href="/" className="hover:text-ink-light transition-colors flex items-center justify-center gap-1 group">
            <ArrowRight className="w-3 h-3 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Back to Crochet Masterpiece
          </Link>
        </p>
      </div>
    </div>
  );
}
