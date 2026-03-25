"use client";

import { supabase, sendPasswordReset, updatePassword } from "@/lib/supabase";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Send, CheckCircle2, Loader2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/* =============================================
   STEP INDICATOR
   ============================================= */
const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {Array.from({ length: total }, (_, i) => (
      <React.Fragment key={i}>
        <div
          className={cn(
            "rounded-full transition-all duration-500 font-sans text-xs font-semibold flex items-center justify-center",
            i + 1 < current
              ? "w-7 h-7 bg-caramel text-white shadow-button"
              : i + 1 === current
              ? "w-8 h-8 bg-gradient-to-br from-blush to-mauve text-white shadow-glow-blush"
              : "w-7 h-7 bg-cream-200 text-ink-light/40 border border-caramel/10"
          )}
        >
          {i + 1 < current ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            i + 1
          )}
        </div>
        {i < total - 1 && (
          <div
            className={cn(
              "h-px w-8 transition-all duration-500",
              i + 1 < current ? "bg-caramel" : "bg-caramel/15"
            )}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

/* =============================================
   OTP INPUT ROW
   ============================================= */
const OTPInput = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (val: string[]) => void;
}) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, val: string) => {
    const newVal = [...value];
    const digit = val.replace(/\D/, "").slice(-1);
    newVal[index] = digit;
    onChange(newVal);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newVal = [...value];
    pasted.split("").forEach((char, i) => { newVal[i] = char; });
    onChange(newVal);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center my-2">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            "otp-input transition-all duration-300",
            digit ? "border-caramel/60 bg-blush/10 text-ink-dark" : ""
          )}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

/* =============================================
   MAIN FORGOT PASSWORD PAGE
   ============================================= */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password, 4: success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [animationPhase, setAnimationPhase] = useState(0);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationPhase(1), 100);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email"); return; }
    setIsLoading(true);
    // Send password reset email via Supabase (uses configured email provider)
    const { error } = await sendPasswordReset(email.trim());
    setIsLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCountdown(60);
    setStep(2);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const otpString = otp.join("");
    if (otpString.length !== 6) { setError("Please enter the complete 6-digit code"); return; }
    setIsLoading(true);
    try {
      // Verify the OTP token sent by Supabase to the user's email
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpString,
        type: "recovery",
      });
      if (error) {
        setError("Invalid or expired code. Please request a new one.");
        setIsLoading(false);
        return;
      }
      setStep(3);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newPassword) { setError("Please enter a new password"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setIsLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
      setStep(4);
    } catch {
      setError("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = [
    { title: "Reset Password", sub: "Enter your email and we'll send a verification code" },
    { title: "Verify Code", sub: `We sent a 6-digit code to ${email}` },
    { title: "New Password", sub: "Create a strong new password" },
    { title: "All Done! ", sub: "Your password has been updated successfully" },
  ];

  const { title, sub } = stepTitles[step - 1];

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-12 left-8 opacity-10 animate-float-slow pointer-events-none">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="35" stroke="#C8956C" strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="40" cy="40" r="20" stroke="#F4B8C1" strokeWidth="1.5" fill="rgba(244,184,193,0.1)" />
        </svg>
      </div>
      <div className="absolute bottom-16 right-8 opacity-10 animate-float pointer-events-none">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M30 5 L35 22 L52 22 L38 33 L43 50 L30 39 L17 50 L22 33 L8 22 L25 22 Z" fill="#C9A0DC" />
        </svg>
      </div>

      {/* Card */}
      <div
        className={cn(
          "w-full max-w-md relative z-10 transition-all duration-700",
          animationPhase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        <div className="glass rounded-3xl shadow-card border border-blush/30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blush/30 via-cream-100 to-mauve-100/30 px-8 pt-8 pb-6 border-b border-blush/20 text-center relative">
            {/* Back button */}
            <Link
              href="/user/login"
              className="absolute left-6 top-6 flex items-center gap-1.5 text-xs text-ink-light/60 hover:text-caramel transition-colors duration-200 font-sans group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to Login
            </Link>

            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-soft ring-4 ring-blush/25">
                <Image src="/images/logo.png" alt="Logo" width={64} height={64} className="object-cover" />
              </div>
            </div>

            <StepIndicator current={step} total={3} />

            <h1 className="font-display text-xl font-semibold text-ink-dark">{title}</h1>
            <p className="text-xs text-ink-light/70 font-sans mt-1">{sub}</p>
          </div>

          {/* Form body */}
          <div className="px-8 py-7">
            {/* STEP 1: Email */}
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-4 animate-morph-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-widest uppercase text-ink-light/80 font-sans">
                    Email Address
                  </label>
                  <div className={cn(
                    "relative flex items-center rounded-2xl transition-all duration-300",
                    "border-[1.5px] border-caramel/20 bg-cream-50/80",
                    "focus-within:border-blush focus-within:bg-white",
                    "focus-within:shadow-[0_0_0_3px_rgba(244,184,193,0.2)]"
                  )}>
                    <div className="pl-4 text-ink-light/40">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="yourname@example.com"
                      className="flex-1 bg-transparent px-3 py-3.5 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-400 font-sans animate-slide-down">{error}</p>
                )}

                <ActionButton loading={isLoading} label="Send Verification Code" icon={<Send className="w-4 h-4" />} />
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-5 animate-morph-in">
                <div className="text-center space-y-1">
                  <p className="text-sm text-ink-light font-sans">
                    Check your inbox for a 6-digit code
                  </p>
                  <p className="text-xs text-ink-light/50 font-sans">
                    Didn&apos;t receive it? Check your spam folder.
                  </p>
                </div>

                <OTPInput value={otp} onChange={setOtp} />

                {error && (
                  <p className="text-xs text-red-400 text-center font-sans animate-slide-down">{error}</p>
                )}

                {/* Resend */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-ink-light/50 font-sans">
                      Resend code in <span className="text-caramel font-semibold">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setCountdown(60); }}
                      className="text-xs text-caramel hover:text-ink font-semibold font-sans transition-colors duration-200 underline decoration-blush/50"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <ActionButton loading={isLoading} label="Verify Code" icon={<CheckCircle2 className="w-4 h-4" />} />
              </form>
            )}

            {/* STEP 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4 animate-morph-in">
                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-widest uppercase text-ink-light/80 font-sans">
                    New Password
                  </label>
                  <div className="relative flex items-center rounded-2xl border-[1.5px] border-caramel/20 bg-cream-50/80 focus-within:border-blush focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(244,184,193,0.2)] transition-all duration-300">
                    <div className="pl-4 text-ink-light/40"><Lock className="w-4 h-4" /></div>
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="flex-1 bg-transparent px-3 py-3.5 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="pr-3 text-ink-light/40 hover:text-caramel transition-colors duration-200">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength */}
                  {newPassword && (
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 h-1 rounded-full transition-all duration-300",
                            newPassword.length >= i * 3
                              ? i <= 1 ? "bg-red-300" : i <= 2 ? "bg-caramel/60" : i <= 3 ? "bg-blush" : "bg-mauve"
                              : "bg-caramel/10"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-widest uppercase text-ink-light/80 font-sans">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center rounded-2xl border-[1.5px] border-caramel/20 bg-cream-50/80 focus-within:border-blush focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(244,184,193,0.2)] transition-all duration-300">
                    <div className="pl-4 text-ink-light/40"><Lock className="w-4 h-4" /></div>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="flex-1 bg-transparent px-3 py-3.5 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="pr-3 text-ink-light/40 hover:text-caramel transition-colors duration-200">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-400 font-sans">Passwords don&apos;t match</p>
                  )}
                </div>

                {error && (
                  <p className="text-xs text-red-400 font-sans animate-slide-down">{error}</p>
                )}

                <ActionButton loading={isLoading} label="Update Password" icon={<Lock className="w-4 h-4" />} />
              </form>
            )}

            {/* STEP 4: Success */}
            {step === 4 && (
              <div className="text-center space-y-6 animate-morph-in py-4">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blush/30 to-mauve/30 flex items-center justify-center shadow-glow-blush animate-bloom">
                    <CheckCircle2 className="w-10 h-10 text-caramel" />
                  </div>
                </div>

                <div>
                  <p className="font-display text-lg text-ink-dark font-medium">Password Updated!</p>
                  <p className="text-sm text-ink-light/70 font-sans mt-1">
                    You can now sign in with your new password.
                  </p>
                </div>

                <Link
                  href="/user/login"
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl",
                    "bg-gradient-to-r from-caramel via-rose to-blush",
                    "text-white text-sm font-semibold font-sans tracking-wide",
                    "transition-all duration-300 hover:shadow-button-hover hover:-translate-y-0.5",
                    "btn-bubble"
                  )}
                >
                  Go to Login
                </Link>
              </div>
            )}
          </div>
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

/* =============================================
   REUSABLE ACTION BUTTON
   ============================================= */
const ActionButton = ({
  loading,
  label,
  icon,
}: {
  loading: boolean;
  label: string;
  icon: React.ReactNode;
}) => (
  <button
    type="submit"
    disabled={loading}
    className={cn(
      "w-full py-3.5 px-6 rounded-2xl font-sans font-bold text-sm",
      "bg-gradient-to-r from-caramel via-rose to-blush",
      "text-white tracking-wide",
      "relative overflow-hidden",
      "transition-all duration-300",
      "hover:shadow-button-hover hover:-translate-y-0.5",
      "active:scale-[0.98] active:translate-y-0",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      "btn-bubble flex items-center justify-center gap-2"
    )}
  >
    {loading ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        Please wait...
      </>
    ) : (
      <>
        {icon}
        {label}
      </>
    )}
  </button>
);
