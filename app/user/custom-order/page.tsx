"use client";

import { supabase } from "@/lib/supabase";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  MessageCircle, ArrowRight, Scissors, Clock, Palette,
  User, Phone, Mail, MapPin, ChevronDown, Plus, X,
  Sparkles, Heart, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/* ============================================
   TYPES
   ============================================= */
interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  customCategory: string;
  description: string;
  priceMin: string;
  priceMax: string;
  timeframe: string;
}

/* ============================================
   PREDEFINED CATEGORIES
   ============================================= */
// Categories loaded from Supabase
type CatOption = { value: string; label: string; img: string };
const FALLBACK_IMGS = [
  "/images/crochet-1.jpg",
  "/images/crochet-2.jpg", 
  "/images/crochet-3.jpg",
  "/images/crochet-4.jpg",
];
const FALLBACK_IMG = (i: number) => FALLBACK_IMGS[i % FALLBACK_IMGS.length];

const TIMEFRAMES = [
  { value: "1-2w", label: "1–2 weeks" },
  { value: "3-4w", label: "3–4 weeks" },
  { value: "1-2m", label: "1–2 months" },
  { value: "no-rush", label: "No rush — take your time!" },
];

/* ============================================
   CATEGORY SELECTOR (visual grid)
   ============================================= */
const CategorySelector = ({
  value, onChange, categories,
}: { value: string; onChange: (v: string) => void; categories: {value:string;label:string;img:string}[] }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {categories.map((cat) => (
      <button
        key={cat.value || cat.label}
        type="button"
        onClick={() => onChange(cat.value)}
        className={cn(
          "relative flex flex-col items-end justify-end overflow-hidden rounded-2xl border text-left",
          "transition-all duration-300 btn-bubble h-20",
          value === cat.value
            ? "border-caramel/60 shadow-button scale-[0.98] ring-2 ring-caramel/30"
            : "border-caramel/15 hover:border-blush/50 hover:scale-[1.02]"
        )}
      >
        {/* Background image */}
        <Image
          src={cat.img}
          alt={cat.label}
          fill
          className="object-cover transition-transform duration-300 hover:scale-110"
          sizes="150px"
        />
        {/* Overlay */}
        <div className={cn(
          "absolute inset-0 transition-all duration-300",
          value === cat.value
            ? "bg-gradient-to-t from-caramel/80 to-caramel/20"
            : "bg-gradient-to-t from-ink-dark/60 to-ink-dark/10"
        )} />
        {/* Label */}
        <span className="relative z-10 text-[11px] font-sans font-bold text-white leading-tight px-2 pb-2 drop-shadow-sm">
          {cat.label}
        </span>
        {/* Selected check */}
        {value === cat.value && (
          <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-white flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="#C8956C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>
    ))}
  </div>
);

/* ============================================
   FLOATING LABEL INPUT
   ============================================= */
const FloatInput = ({
  label, value, onChange, type = "text", placeholder, icon, required, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; icon: React.ReactNode;
  required?: boolean; hint?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const hasVal = value.length > 0;
  return (
    <div className="space-y-1">
      <div className={cn(
        "relative flex items-center rounded-2xl border transition-all duration-300",
        focused
          ? "border-blush bg-white shadow-[0_0_0_3px_rgba(244,184,193,0.18)]"
          : "border-caramel/20 bg-white/70 hover:border-blush/40"
      )}>
        <div className={cn("pl-4 flex-shrink-0 transition-colors duration-300", focused ? "text-caramel" : "text-ink-light/40")}>
          {icon}
        </div>
        <div className="relative flex-1 px-3">
          <label className={cn(
            "absolute left-0 pointer-events-none font-sans transition-all duration-200",
            (focused || hasVal)
              ? "top-1.5 text-[10px] font-semibold tracking-widest uppercase text-caramel/80"
              : "top-1/2 -translate-y-1/2 text-sm text-ink-light/50"
          )}>
            {label}{required && " *"}
          </label>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={focused ? placeholder : ""}
            className="w-full bg-transparent pt-5 pb-2 text-sm font-sans text-ink outline-none"
          />
        </div>
      </div>
      {hint && <p className="text-[10px] text-ink-light/45 font-sans pl-1">{hint}</p>}
    </div>
  );
};

/* ============================================
   WHATSAPP MESSAGE BUILDER
   ============================================= */
function buildCustomOrderMessage(form: FormData, categories: {value:string;label:string;img:string}[]): string {
  const cat = categories.find((c) => c.value === form.category);
  const catLabel = form.category === "other" ? form.customCategory : cat?.label ?? form.category;
  const lines = [
    ` *Custom Order Request — Crochet Masterpiece*`,
    ``,
    ` *Name:* ${form.name}`,
    ` *Email:* ${form.email}`,
    ` *WhatsApp:* ${form.phone}`,
    ` *Address:* ${form.address}`,
    ``,
    ` *Category:* ${catLabel}`,
    ``,
    ` *Description:*`,
    form.description,
    ``,
    form.priceMin || form.priceMax
      ? ` *Budget:* PKR ${form.priceMin || "?"} – PKR ${form.priceMax || "?"}`
      : null,
    form.timeframe
      ? `⏰ *Needed by:* ${TIMEFRAMES.find((t) => t.value === form.timeframe)?.label ?? form.timeframe}`
      : null,
    ``,
    `_Sent from Crochet Masterpiece website_ `,
  ].filter((l) => l !== null);
  return encodeURIComponent(lines.join("\n"));
}

/* ============================================
   SUCCESS STATE
   ============================================= */
const SuccessState = ({ name, onReset }: { name: string; onReset: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 200 }}
    className="text-center py-16 px-8 space-y-6"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
      className="w-20 h-20 rounded-full bg-gradient-to-br from-blush/30 to-mauve/20 flex items-center justify-center text-4xl mx-auto"
    >
      
    </motion.div>
    <div>
      <h3 className="font-display text-2xl font-semibold text-ink-dark mb-2">
        Your message is on its way, {name.split(" ")[0]}!
      </h3>
      <p className="text-sm text-ink-light/70 font-sans leading-relaxed max-w-sm mx-auto">
        WhatsApp should have opened with your order details already filled in.
        Just hit send — I personally read every message and usually reply within a few hours.
      </p>
    </div>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <button onClick={onReset}
        className="px-6 py-3 rounded-2xl border border-caramel/25 text-caramel text-sm font-sans font-semibold hover:bg-caramel/8 transition-all btn-bubble">
        Place another order
      </button>
      <a href="/" className="px-6 py-3 rounded-2xl bg-gradient-to-r from-caramel to-rose text-white text-sm font-sans font-bold shadow-button hover:shadow-button-hover transition-all btn-bubble">
        Back to home
      </a>
    </div>
  </motion.div>
);

/* ============================================
   MAIN PAGE
   ============================================= */
export default function CustomOrderPage() {
  const [categories, setCategories] = useState<CatOption[]>([]);
  useEffect(() => {
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        const cats: CatOption[] = (data ?? []).map((d: {id:string;name:string}, idx: number) => ({
          value: d.id, label: d.name, img: FALLBACK_IMG(idx),
        }));
        setCategories([...cats, { value: "other", label: "Something else...", img: "/images/bg-crochet-items.jpg" }]);
      });
  }, []);

  const heroRef = useRef(null);
  const formRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const formInView = useInView(formRef, { once: true, margin: "-60px" });

  // Pre-fill from logged-in user session — replace with real Supabase auth context
  // When connected: const { user } = useSupabaseUser();
  // Then: name: user?.name ?? "", email: user?.email ?? "", etc.
  const LOGGED_IN_USER = null as null | { name: string; email: string; phone: string; address: string };

  const [form, setForm] = useState<FormData>({
    name: LOGGED_IN_USER?.name ?? "",
    email: LOGGED_IN_USER?.email ?? "",
    phone: LOGGED_IN_USER?.phone ?? "",
    address: LOGGED_IN_USER?.address ?? "",
    category: "", customCategory: "", description: "",
    priceMin: "", priceMax: "", timeframe: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const set = (field: keyof FormData) => (val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
    if (field === "description") setCharCount(val.length);
  };

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "We'd love to know your name";
    if (!form.phone.trim()) e.phone = "We need this for WhatsApp";
    if (!form.category) e.category = "Pick a category";
    if (!form.description.trim() || form.description.length < 20)
      e.description = "Give us a bit more detail — even a few sentences helps a lot!";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const msg = buildCustomOrderMessage(form, categories);
    window.open(`https://wa.me/923159202186?text=${msg}`, "_blank");
    setSubmitted(true);
  };

  const reset = () => {
    setForm({ name: "", email: "", phone: "", address: "", category: "", customCategory: "", description: "", priceMin: "", priceMax: "", timeframe: "" });
    setSubmitted(false);
    setErrors({});
    setCharCount(0);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      {/* ── Hero banner ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden pt-28 pb-16 px-4 sm:px-6 lg:px-8"
      >
        {/* 3-image background collage */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img src="/images/bg-crochet-items.jpg" alt="" aria-hidden="true"
            className="absolute top-0 left-0 w-2/5 h-full object-cover opacity-[0.08]" />
          <img src="/images/bg-crochet-pink.jpg" alt="" aria-hidden="true"
            className="absolute top-0 left-2/5 w-1/5 h-full object-cover opacity-[0.06]" />
          <img src="/images/bg-yarn-table.jpg" alt="" aria-hidden="true"
            className="absolute top-0 right-0 w-2/5 h-full object-cover opacity-[0.08]" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(201,160,220,0.12) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(244,184,193,0.15) 0%, transparent 50%), rgba(255,248,237,0.92)" }} />
        </div>
        {/* Floating decor */}
        {["", "", "", "🪡"].map((em, i) => (
          <motion.span key={`decor-${i}-${em || "empty"}`}
            className="absolute text-2xl pointer-events-none select-none opacity-15"
            style={{ left: `${8 + i * 24}%`, top: `${15 + (i % 2) * 55}%` }}
            animate={{ y: [0, -12, 0], rotate: [0, i % 2 ? 10 : -10, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
          >{em}</motion.span>
        ))}

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-blush/20 border border-blush/35 rounded-full px-4 py-1.5 mb-5"
          >
            <Scissors className="w-3.5 h-3.5 text-caramel" />
            <span className="text-xs font-sans font-semibold text-caramel tracking-widest uppercase">Custom Orders</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="font-display text-4xl sm:text-5xl font-semibold text-ink-dark mb-4 leading-tight"
          >
            Tell me what&apos;s in your head.<br />
            <span className="text-gradient-blush">I&apos;ll put it in your hands.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="text-base text-ink-light/70 font-sans leading-relaxed max-w-xl mx-auto mb-8"
          >
            Custom orders are my absolute favourite thing. Whether it&apos;s a specific colour palette,
            a gift for someone special, or something you dreamed up yourself — I want to make it for you.
            Fill in as much or as little as you like. We&apos;ll figure out the rest on WhatsApp. 
          </motion.p>

          {/* Quick trust signals */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: "", text: "No login needed" },
              { icon: "", text: "Fast WhatsApp reply" },
              { icon: "", text: "Made just for you" },
              { icon: "", text: "Any colour, any size" },
            ].map((t) => (
              <span key={t.text} className="flex items-center gap-1.5 text-xs font-sans text-ink-light/65 bg-white/60 border border-caramel/12 px-3 py-1.5 rounded-full">
                {t.icon} {t.text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Form ── */}
      <section ref={formRef} className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="glass rounded-3xl border border-blush/25 shadow-card">
                <SuccessState name={form.name || "friend"} onReset={reset} />
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 30 }}
              animate={formInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="glass rounded-3xl border border-blush/25 shadow-card overflow-hidden"
            >
              {/* Form header */}
              <div className="bg-gradient-to-r from-blush/20 via-cream-50 to-mauve/15 px-8 py-6 border-b border-blush/15">
                <h2 className="font-display text-xl font-semibold text-ink-dark">Your custom order request</h2>
                <p className="text-xs text-ink-light/55 font-sans mt-1">
                  Fill in what you can — we&apos;ll sort everything else on WhatsApp 
                </p>
              </div>

              <div className="px-8 py-7 space-y-7">

                {/* ── Section 1: About you ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-caramel to-rose text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                    <h3 className="font-sans font-semibold text-sm text-ink-dark">A little about you</h3>
                  </div>

                  <FloatInput label="Your name" value={form.name} onChange={set("name")}
                    placeholder="e.g. Sana" icon={<User className="w-4 h-4" />} required
                    hint="Just your first name is totally fine!" />
                  {errors.name && <p className="text-xs text-rose/80 font-sans -mt-2 pl-1">{errors.name}</p>}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <FloatInput label="WhatsApp number" value={form.phone} onChange={set("phone")}
                        type="tel" placeholder="+92 300 0000000" icon={<Phone className="w-4 h-4" />} required
                        hint="This is where I'll reply to you" />
                      {errors.phone && <p className="text-xs text-rose/80 font-sans mt-0.5 pl-1">{errors.phone}</p>}
                    </div>
                    <FloatInput label="Email (optional)" value={form.email} onChange={set("email")}
                      type="email" placeholder="yourname@email.com" icon={<Mail className="w-4 h-4" />}
                      hint="In case WhatsApp is unavailable" />
                  </div>

                  <div className="relative flex items-start rounded-2xl border border-caramel/20 bg-white/70 hover:border-blush/40 focus-within:border-blush focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(244,184,193,0.18)] transition-all duration-300">
                    <div className="pl-4 pt-3.5 text-ink-light/40 flex-shrink-0"><MapPin className="w-4 h-4" /></div>
                    <textarea value={form.address} onChange={(e) => set("address")(e.target.value)}
                      placeholder="Delivery address (optional — can share later)"
                      rows={2}
                      className="flex-1 bg-transparent px-3 py-3.5 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none resize-none" />
                  </div>
                </div>

                {/* Divider */}
                <div className="yarn-divider" />

                {/* ── Section 2: The order ── */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blush to-mauve text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
                    <h3 className="font-sans font-semibold text-sm text-ink-dark">What are you after?</h3>
                  </div>

                  <div>
                    <p className="text-xs font-sans font-semibold text-ink-light/55 uppercase tracking-widest mb-3">Pick a category *</p>
                    <CategorySelector value={form.category} onChange={set("category")} categories={categories} />
                    {errors.category && <p className="text-xs text-rose/80 font-sans mt-1 pl-1">{errors.category}</p>}
                  </div>

                  {/* Custom category if "other" */}
                  <AnimatePresence>
                    {form.category === "other" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                        <FloatInput label="What is it exactly?" value={form.customCategory} onChange={set("customCategory")}
                          placeholder="e.g. a wall hanging, plant hanger, phone pouch..." icon={<Sparkles className="w-4 h-4" />} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Description */}
                  <div>
                    <div className="relative rounded-2xl border border-caramel/20 bg-white/70 hover:border-blush/40 focus-within:border-blush focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(244,184,193,0.18)] transition-all duration-300 overflow-hidden">
                      <div className="px-4 pt-3.5 pb-1">
                        <p className="text-[10px] font-sans font-semibold tracking-widest uppercase text-caramel/70 mb-1">Describe your idea *</p>
                        <textarea
                          value={form.description}
                          onChange={(e) => { set("description")(e.target.value); }}
                          placeholder="Be as specific or as vague as you like! Colours, textures, who it's for, any inspo you've seen... I love all the details "
                          rows={5}
                          maxLength={800}
                          className="w-full bg-transparent pb-3 text-sm font-sans text-ink placeholder:text-ink-light/35 outline-none resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 bg-cream-50/60 border-t border-caramel/10">
                        <span className="text-[10px] text-ink-light/40 font-sans">The more detail, the better I can match your vision</span>
                        <span className={cn("text-[10px] font-sans font-semibold", charCount > 750 ? "text-rose/70" : "text-ink-light/35")}>
                          {charCount}/800
                        </span>
                      </div>
                    </div>
                    {errors.description && <p className="text-xs text-rose/80 font-sans mt-1 pl-1">{errors.description}</p>}
                  </div>
                </div>

                {/* Divider */}
                <div className="yarn-divider" />

                {/* ── Section 3: Budget & timing ── */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-mauve to-blush text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
                    <h3 className="font-sans font-semibold text-sm text-ink-dark">Budget & timing <span className="text-ink-light/40 font-normal">(totally optional)</span></h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-sans font-semibold text-ink-light/55 uppercase tracking-wider">Budget range (PKR)</p>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 flex items-center rounded-2xl border border-caramel/20 bg-white/70 focus-within:border-blush focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(244,184,193,0.18)] transition-all">
                          <span className="pl-3 text-xs text-ink-light/50 font-sans flex-shrink-0">Min</span>
                          <input type="number" value={form.priceMin} onChange={(e) => set("priceMin")(e.target.value)}
                            placeholder="e.g. 1500"
                            className="flex-1 bg-transparent px-2 py-3 text-sm font-sans text-ink outline-none w-full" />
                        </div>
                        <span className="text-ink-light/30 text-xs">—</span>
                        <div className="relative flex-1 flex items-center rounded-2xl border border-caramel/20 bg-white/70 focus-within:border-blush focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(244,184,193,0.18)] transition-all">
                          <span className="pl-3 text-xs text-ink-light/50 font-sans flex-shrink-0">Max</span>
                          <input type="number" value={form.priceMax} onChange={(e) => set("priceMax")(e.target.value)}
                            placeholder="e.g. 3000"
                            className="flex-1 bg-transparent px-2 py-3 text-sm font-sans text-ink outline-none w-full" />
                        </div>
                      </div>
                      <p className="text-[10px] text-ink-light/40 font-sans pl-1">Not sure? Leave blank — we&apos;ll discuss on WhatsApp</p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-sans font-semibold text-ink-light/55 uppercase tracking-wider">When do you need it?</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {TIMEFRAMES.map((tf) => (
                          <button key={tf.value} type="button" onClick={() => set("timeframe")(tf.value)}
                            className={cn(
                              "py-2 px-2 rounded-xl border text-[11px] font-sans font-semibold text-center transition-all btn-bubble",
                              form.timeframe === tf.value
                                ? "border-caramel/40 bg-caramel/10 text-caramel"
                                : "border-caramel/15 bg-white/60 text-ink/60 hover:border-blush/40"
                            )}>
                            {tf.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Submit ── */}
                <div className="pt-2 space-y-3">
                  <button type="submit"
                    className={cn(
                      "w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl",
                      "bg-[#25D366] text-white text-sm font-sans font-bold",
                      "shadow-button hover:shadow-button-hover hover:-translate-y-0.5",
                      "transition-all duration-300 btn-bubble relative overflow-hidden group"
                    )}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.799 9.799 0 0 1-5.003-1.374l-.358-.213-3.742.981.999-3.648-.235-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                    </svg>
                    Send my order request on WhatsApp
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                  <p className="text-center text-[11px] text-ink-light/40 font-sans">
                    This opens WhatsApp with your details already typed out — just hit send!
                    No account needed. 
                  </p>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      <Footer />
    </div>
  );
}
