"use client";

import { signUpWithEmail, signInWithGoogle } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, ArrowRight, Loader2, Heart, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* =============================================
   AVATAR PICKER
   ============================================= */
const PREDEFINED_AVATARS = [
  { id: 1, from: "#F4B8C1", to: "#E8A0A8" },
  { id: 2, from: "#C8956C", to: "#D4A890" },
  { id: 3, from: "#C9A0DC", to: "#F4B8C1" },
  { id: 4, from: "#E8A0A8", to: "#C9A0DC" },
  { id: 5, from: "#B8A0DC", to: "#9B6ED4" },
  { id: 6, from: "#F4D08C", to: "#C8956C" },
  { id: 7, from: "#C9A0DC", to: "#D4A890" },
  { id: 8, from: "#F4B8C1", to: "#C8956C" },
];

const AvatarPicker = ({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (id: number) => void;
}) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold tracking-widest uppercase text-ink-light/80 font-sans">
      Choose Your Avatar
    </label>
    <div className="flex flex-wrap gap-2">
      {PREDEFINED_AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onSelect(avatar.id)}
          style={{
            background: `linear-gradient(135deg, ${avatar.from}, ${avatar.to})`,
            outline: selected === avatar.id ? `2px solid #C8956C` : "none",
            outlineOffset: selected === avatar.id ? "2px" : "0",
            transform: selected === avatar.id ? "scale(1.1)" : "scale(1)",
            opacity: selected === avatar.id ? 1 : 0.75,
          }}
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 hover:opacity-100 hover:scale-105"
          aria-label={`Avatar colour ${avatar.id}`}
        >
          {/* Subtle inner glow dot */}
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.35)", display: "block" }} />
        </button>
      ))}
    </div>
    <p className="text-[10px] text-ink-light/45 font-sans">Your avatar colour is used across the site</p>
  </div>
);

/* =============================================
   FIELD COMPONENT (reusable for this page)
   ============================================= */
const Field = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold tracking-widest uppercase text-ink-light/80 font-sans">{label}</label>
    <div className="relative flex items-center rounded-2xl border-[1.5px] border-caramel/20 bg-cream-50/80 focus-within:border-blush focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(244,184,193,0.2)] transition-all duration-300">
      <div className="pl-4 text-ink-light/40">{icon}</div>
      {children}
    </div>
  </div>
);

/* =============================================
   MAIN SIGNUP PAGE
   ============================================= */
export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    phone: "",
  });
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [animationPhase, setAnimationPhase] = useState(0);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimationPhase(1), 100),
      setTimeout(() => setAnimationPhase(2), 300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const update = (field: string, val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Min. 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    if (!form.address.trim()) errs.address = "Address is required for delivery";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!agreed) errs.agreed = "Please agree to terms";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const { data, error } = await signUpWithEmail(
        form.email.trim(),
        form.password,
        form.name.trim(),
        form.phone || undefined
      );
      if (error) {
        const msg = error.message;
        if (msg.includes("already") || msg.includes("registered") || msg.includes("User already registered")) {
          // Auto-redirect to login after 2 seconds
          setErrors({ email: "✓ This email is already registered. Redirecting to login..." });
          setTimeout(() => { window.location.href = "/user/login?email=" + encodeURIComponent(form.email.trim()); }, 1800);
        } else if (msg.includes("password")) {
          setErrors({ confirmPassword: "Password must be at least 6 characters." });
        } else if (msg.includes("rate") || msg.includes("too many")) {
          setErrors({ email: "Too many attempts. Please wait a moment and try again." });
        } else {
          setErrors({ email: `Signup error: ${msg}` });
        }
        return;
      }
      // data.session exists → email confirmation is OFF → logged in immediately
      if (data?.session) {
        window.location.href = "/user/home";
      } else {
        // Email confirmation is ON → tell user to check email
        setErrors({ email: "✓ Account created! Check your email inbox for a confirmation link, then sign in. (Check spam too.)" });
      }
    } catch (err) {
      console.error("Signup error:", err);
      setErrors({ email: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "flex-1 bg-transparent px-3 py-3.5 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none";

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blush/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-mauve/10 blur-3xl pointer-events-none" />

      <div
        className={cn(
          "w-full max-w-lg relative z-10 transition-all duration-700",
          animationPhase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        <div className="glass rounded-3xl shadow-card border border-blush/30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-mauve/20 via-cream-100 to-blush/20 px-8 pt-8 pb-6 border-b border-blush/20 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full overflow-hidden shadow-soft ring-4 ring-blush/25">
                <Image src="/images/logo.png" alt="Logo" width={56} height={56} className="object-cover" />
              </div>
            </div>
            <p className="font-script text-caramel text-base">Join the family</p>
            <h1 className="font-display text-xl font-semibold text-ink-dark">Create Your Account</h1>
            <p className="text-xs text-ink-light/60 font-sans mt-1 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 fill-blush text-blush" />
              Start your crochet journey with us
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {/* Avatar */}
            <div
              className={cn(
                "transition-all duration-500 delay-100",
                animationPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <AvatarPicker selected={selectedAvatar} onSelect={setSelectedAvatar} />
            </div>

            {/* Name */}
            <div className={cn("transition-all duration-500 delay-200", animationPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              <Field label="Full Name" icon={<User className="w-4 h-4" />}>
                <input type="text" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your full name" className={inputClass} />
              </Field>
              {errors.name && <p className="text-xs text-red-400 mt-1 pl-1 font-sans">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className={cn("transition-all duration-500 delay-300", animationPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              <Field label="Email Address" icon={<Mail className="w-4 h-4" />}>
                <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="yourname@example.com" className={inputClass} />
              </Field>
              {errors.email && <p className="text-xs text-red-400 mt-1 pl-1 font-sans">{errors.email}</p>}
            </div>

            {/* Password row */}
            <div className={cn("grid grid-cols-2 gap-3 transition-all duration-500 delay-400", animationPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              <div>
                <Field label="Password" icon={<Lock className="w-4 h-4" />}>
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} placeholder="Min. 8 chars" className={`${inputClass} pr-2`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="pr-3 text-ink-light/40 hover:text-caramel transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>
                {errors.password && <p className="text-xs text-red-400 mt-1 font-sans">{errors.password}</p>}
              </div>
              <div>
                <Field label="Confirm" icon={<Lock className="w-4 h-4" />}>
                  <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} placeholder="Repeat" className={`${inputClass} pr-2`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="pr-3 text-ink-light/40 hover:text-caramel transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1 font-sans">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Phone */}
            <div className={cn("transition-all duration-500 delay-500", animationPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              <Field label="WhatsApp / Phone Number" icon={<Phone className="w-4 h-4" />}>
                <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+92 300 1234567" className={inputClass} />
              </Field>
              {errors.phone && <p className="text-xs text-red-400 mt-1 pl-1 font-sans">{errors.phone}</p>}
              <p className="text-xs text-ink-light/40 font-sans mt-1 pl-1">Used for WhatsApp orders and delivery updates</p>
            </div>

            {/* Address */}
            <div className={cn("transition-all duration-500 delay-[600ms]", animationPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-widest uppercase text-ink-light/80 font-sans">Delivery Address</label>
                <div className="relative flex items-start rounded-2xl border-[1.5px] border-caramel/20 bg-cream-50/80 focus-within:border-blush focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(244,184,193,0.2)] transition-all duration-300">
                  <div className="pl-4 pt-3.5 text-ink-light/40"><MapPin className="w-4 h-4" /></div>
                  <textarea
                    value={form.address}
                    onChange={e => update("address", e.target.value)}
                    placeholder="House no., street, city, province..."
                    rows={2}
                    className="flex-1 bg-transparent px-3 py-3.5 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none resize-none"
                  />
                </div>
              </div>
              {errors.address && <p className="text-xs text-red-400 mt-1 pl-1 font-sans">{errors.address}</p>}
            </div>

            {/* Terms */}
            <div className={cn("transition-all duration-500 delay-700", animationPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              <label className="flex items-start gap-3 cursor-pointer group">
                <button
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-lg border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-300",
                    agreed
                      ? "bg-gradient-to-br from-blush to-caramel border-transparent shadow-button"
                      : "border-caramel/25 bg-cream-50 group-hover:border-blush/60"
                  )}
                >
                  {agreed && <CheckCircle2 className="w-3 h-3 text-white" />}
                </button>
                <span className="text-xs text-ink-light/70 font-sans leading-relaxed">
                  I agree to the{" "}
                  <span className="text-caramel underline decoration-blush/50 cursor-pointer">Terms of Service</span>{" "}
                  and{" "}
                  <span className="text-caramel underline decoration-blush/50 cursor-pointer">Privacy Policy</span>
                </span>
              </label>
              {errors.agreed && <p className="text-xs text-red-400 mt-1 pl-1 font-sans">{errors.agreed}</p>}
            </div>

            {/* Submit */}
            <div className={cn("pt-1 transition-all duration-500 delay-800", animationPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3.5 px-6 rounded-2xl font-sans font-bold text-sm",
                  "bg-gradient-to-r from-caramel via-rose to-blush",
                  "text-white tracking-wide",
                  "relative overflow-hidden",
                  "transition-all duration-300",
                  "hover:shadow-button-hover hover:-translate-y-0.5",
                  "active:scale-[0.98]",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  "btn-bubble flex items-center justify-center gap-2"
                )}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Creating your account...</>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {/* Login link */}
            <div className="text-center pt-1">
              <p className="text-sm text-ink-light font-sans">
                Already have an account?{" "}
                <Link href="/user/login" className="text-caramel font-semibold hover:text-ink transition-colors duration-200 relative group">
                  Sign in
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-blush origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-ink-light/40 font-sans">
            © 2025 Crochet Masterpiece · Made with{" "}
            <Heart className="w-3 h-3 inline fill-blush text-blush" /> in Pakistan
          </p>
        </div>
      </div>
    </div>
  );
}
