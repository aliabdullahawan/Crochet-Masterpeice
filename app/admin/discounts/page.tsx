"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag, Plus, Pencil, Trash2, Save, X, Check, Copy,
  Calendar, Package, Grid3X3, Percent, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

/* =============================================
   TYPES
   ============================================= */
interface Discount {
  id: string;
  code: string | null;          // null = no code needed, just a badge
  discount_type: "percent" | "flat";
  discount_value: number;
  applies_to: "all" | "product" | "category" | "cart";
  target_id?: string;           // product or category id
  target_name?: string;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  hidden_from_banner?: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

const HIDDEN_BANNER_IDS_KEY = "hidden_discount_banner_ids";

const PRODUCTS_LIST: { id: string; name: string }[] = []; // Cleared — loaded from Supabase // Loaded from Supabase categories // Loaded from Supabase when connected

const MOCK_DISCOUNTS: Discount[] = []; // Loaded from Supabase discounts table // Replace: await supabase.from("discounts").select("*, products(name), categories(name)") = []

function useAdminAuth() {
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in"))
      window.location.href = "/admin/login";
  }, []);
}

/* =============================================
   DISCOUNT FORM
   ============================================= */
interface DiscountForm {
  code: string;
  discount_type: "percent" | "flat";
  discount_value: string;
  applies_to: "all" | "product" | "category" | "cart";
  target_id: string;
  max_uses: string;
  active: boolean;
  start_date: string;
  end_date: string;
  no_code: boolean; // badge-only discount
}

const defaultForm: DiscountForm = {
  code: "", discount_type: "percent", discount_value: "",
  applies_to: "all", target_id: "",
  max_uses: "", active: true,
  start_date: new Date().toISOString().split("T")[0],
  end_date: "", no_code: false,
};

const DiscountModal = ({ discount, onSave, onClose, productsList = [], categoriesList = [], embedded = false }: {
  discount?: Discount;
  onSave: (f: DiscountForm) => void;
  onClose: () => void;
  productsList?: {id:string;name:string}[];
  categoriesList?: {id:string;name:string}[];
  embedded?: boolean;
}) => {
  const [form, setForm] = useState<DiscountForm>(discount ? {
    code: discount.code ?? "",
    discount_type: discount.discount_type,
    discount_value: String(discount.discount_value),
    applies_to: discount.applies_to,
    target_id: discount.target_id ?? "",
    max_uses: discount.max_uses ? String(discount.max_uses) : "",
    active: discount.active,
    start_date: discount.start_date,
    end_date: discount.end_date ?? "",
    no_code: !discount.code,
  } : defaultForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const set = (k: keyof DiscountForm) => (v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.no_code && !form.code.trim()) e.code = "Code required (or toggle 'Badge only')";
    const v = Number(form.discount_value);
    if (!form.discount_value || isNaN(v) || v < 1) e.value = "Value must be ≥ 1";
    if (form.discount_type === "percent" && v > 99) e.value = "Percent must be 1–99";
    if ((form.applies_to === "product" || form.applies_to === "category") && !form.target_id) e.target = "Select a target";
    if (form.max_uses && (isNaN(Number(form.max_uses)) || Number(form.max_uses) < 1)) e.max_uses = "Must be ≥ 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (validate()) onSave(form); };

  const Field = ({ label, name, type = "text", placeholder, hint }: { label: string; name: keyof DiscountForm; type?: string; placeholder?: string; hint?: string }) => (
    <div>
      <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={String(form[name] ?? "")}
        onChange={(e) => {
          let v = e.target.value;
          if (type === "number") v = String(Math.max(0, Number(v)));
          setForm(f => ({ ...f, [name]: v } as DiscountForm));
          setErrors(er => ({ ...er, [name]: undefined }));
        }}
        min={type === "number" ? "0" : undefined}
        placeholder={placeholder}
        className={cn("w-full px-3.5 py-2.5 rounded-2xl border text-sm font-sans text-ink placeholder:text-ink-light/35 outline-none transition-all",
          errors[name] ? "border-red-300 bg-red-50/50" : "border-caramel/20 bg-cream-50/80 focus:border-caramel focus:shadow-[0_0_0_3px_rgba(200,149,108,0.15)]")} />
      {errors[name] && <p className="text-[11px] text-red-500 mt-1">{errors[name]}</p>}
      {hint && !errors[name] && <p className="text-[11px] text-ink-light/40 mt-1">{hint}</p>}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={embedded ? "w-full" : "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-dark/45 backdrop-blur-sm"}
      onClick={embedded ? undefined : onClose}>
      <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={embedded ? undefined : (e) => e.stopPropagation()}
        className={cn(
          "w-full glass rounded-3xl border border-caramel/25 shadow-card flex flex-col overflow-hidden",
          embedded ? "max-h-none" : "max-w-md max-h-[90vh]"
        )}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-caramel/10 flex-shrink-0">
          <h3 className="font-display text-lg font-semibold text-ink-dark">{discount ? "Edit Discount" : "New Discount"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-caramel/10 text-ink-light btn-bubble"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Coupon Code */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider">Coupon Code</label>
              <button type="button" onClick={() => set("no_code")(!form.no_code)}
                className={cn("flex items-center gap-1.5 text-[11px] font-sans font-bold px-2.5 py-1 rounded-xl border transition-all btn-bubble",
                  form.no_code ? "bg-caramel/15 border-caramel/30 text-caramel" : "border-caramel/15 text-ink-light/60")}>
                {form.no_code ? <Check className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                Badge only (no code)
              </button>
            </div>
            {!form.no_code && (
              <input value={form.code} onChange={(e) => { setForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setErrors(er => ({...er, code: undefined})); }}
                placeholder="e.g. YARN20"
                className={cn("w-full px-3.5 py-2.5 rounded-2xl border text-sm font-sans font-mono text-ink placeholder:text-ink-light/35 outline-none transition-all tracking-widest",
                  errors.code ? "border-red-300 bg-red-50/50" : "border-caramel/20 bg-cream-50/80 focus:border-caramel focus:shadow-[0_0_0_3px_rgba(200,149,108,0.15)]")} />
            )}
            {form.no_code && <p className="text-[11px] text-ink-light/45 mt-1">Discount shows as badge on product — no code needed to apply</p>}
            {errors.code && <p className="text-[11px] text-red-500 mt-1">{errors.code}</p>}
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">Type</label>
              <div className="flex rounded-2xl border border-caramel/20 overflow-hidden bg-cream-50/80">
                {(["percent", "flat"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => set("discount_type")(t)}
                    className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-sans font-semibold transition-all",
                      form.discount_type === t ? "bg-caramel/20 text-caramel" : "text-ink-light/60 hover:bg-caramel/8")}>
                    {t === "percent" ? <><Percent className="w-3 h-3" /> %</> : <><DollarSign className="w-3 h-3" /> PKR</>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">
                {form.discount_type === "percent" ? "Percent Off" : "Flat PKR Off"}
              </label>
              <input type="number" min="1" max={form.discount_type === "percent" ? "99" : "99999"} value={form.discount_value}
                onChange={(e) => { setForm(f => ({ ...f, discount_value: String(Math.max(1, Number(e.target.value))) })); setErrors(er => ({...er, value: undefined})); }}
                placeholder={form.discount_type === "percent" ? "20" : "100"}
                className={cn("w-full px-3.5 py-2.5 rounded-2xl border text-sm font-sans text-ink outline-none transition-all",
                  errors.value ? "border-red-300 bg-red-50/50" : "border-caramel/20 bg-cream-50/80 focus:border-caramel")} />
              {errors.value && <p className="text-[11px] text-red-500 mt-1">{errors.value}</p>}
            </div>
          </div>

          {/* Applies to */}
          <div>
            <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">Applies To</label>
            <div className="flex gap-2">
              {(["all", "product", "category", "cart"] as const).map((t) => (
                <button key={t} type="button" onClick={() => { set("applies_to")(t); setForm(f => ({ ...f, applies_to: t, target_id: "" })); }}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-sans font-semibold transition-all btn-bubble",
                    form.applies_to === t ? "bg-caramel/15 border-caramel/35 text-caramel" : "border-caramel/15 text-ink-light/60 hover:border-caramel/30")}>
                  {t === "all" ? "All Products" : t === "product" ? <><Package className="w-3 h-3" /> Product</> : t === "category" ? <><Grid3X3 className="w-3 h-3" /> Category</> : "Cart Total"}
                </button>
              ))}
            </div>
          </div>

          {/* Target selector */}
          {(form.applies_to === "product" || form.applies_to === "category") && (
            <div>
              <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">
                Select {form.applies_to === "product" ? "Product" : "Category"}
              </label>
              <select value={form.target_id} onChange={(e) => { setForm(f => ({ ...f, target_id: e.target.value })); setErrors(er => ({...er, target: undefined})); }}
                className={cn("w-full px-3.5 py-2.5 rounded-2xl border text-sm font-sans text-ink outline-none transition-all",
                  errors.target ? "border-red-300 bg-red-50/50" : "border-caramel/20 bg-cream-50/80 focus:border-caramel")}>
                <option value="">Select {form.applies_to === "product" ? "a product" : "a category"}…</option>
                {(form.applies_to === "product" ? productsList : categoriesList).map(item => (
                  <option key={(item.id || String(Math.random()))} value={item.id}>{item.name}</option>
                ))}
              </select>
              {errors.target && <p className="text-[11px] text-red-500 mt-1">{errors.target}</p>}
            </div>
          )}

          {/* Dates + max uses */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date" name="start_date" type="date" />
            <Field label="End Date" name="end_date" type="date" hint="Leave blank for no expiry" />
          </div>
          <Field label="Max Uses" name="max_uses" type="number" placeholder="Leave blank for unlimited" hint="Blank = unlimited" />

          {/* Active toggle */}
          <button type="button" onClick={() => set("active")(!form.active)}
            className={cn("w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all btn-bubble",
              form.active ? "border-green-200 bg-green-50/50" : "border-caramel/15 bg-white/60")}>
            <p className="text-sm font-sans font-semibold text-ink-dark">
              {form.active ? "Active — discount is live" : "Inactive — discount is hidden"}
            </p>
            <div className={cn("w-10 h-5 rounded-full border-2 relative transition-all flex-shrink-0",
              form.active ? "bg-green-500 border-green-500" : "bg-white border-caramel/30")}>
              <div className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all",
                form.active ? "left-[calc(100%-18px)]" : "left-0.5")} />
            </div>
          </button>
        </div>

        <div className="px-6 py-4 border-t border-caramel/10 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl border border-caramel/20 text-ink font-sans font-semibold text-sm hover:bg-caramel/8 transition-all btn-bubble">Cancel</button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-caramel to-latte text-white font-sans font-bold text-sm shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> {discount ? "Save Changes" : "Create Discount"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* =============================================
   DISCOUNT ROW
   ============================================= */
const DiscountRow = ({ d, onEdit, onDelete, onToggle, onToggleBanner, onCopy }: {
  d: Discount; onEdit: () => void; onDelete: () => void; onToggle: () => void; onToggleBanner: () => void; onCopy: () => void;
}) => {
  const isExpired = d.end_date && new Date(d.end_date) < new Date();
  const isFull = d.max_uses !== null && d.uses_count >= d.max_uses;
  const toggleLabel = d.active && !isExpired ? "Deactivate" : (isExpired ? "Make Active" : "Activate");
  const toggleClass = d.active && !isExpired
    ? "bg-red-50 border-red-200 text-red-400 hover:bg-red-100"
    : "bg-green-50 border-green-200 text-green-600 hover:bg-green-100";
  const statusColor = !d.active ? "bg-red-50 text-red-400 border-red-200"
    : isExpired ? "bg-amber-50 text-amber-600 border-amber-200"
    : isFull ? "bg-purple-50 text-purple-600 border-purple-200"
    : "bg-green-50 text-green-600 border-green-200";
  const statusLabel = !d.active ? "Inactive" : isExpired ? "Expired" : isFull ? "Used Up" : "Active";

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
      className="px-4 sm:px-5 py-4 border-b border-caramel/8 last:border-0 hover:bg-caramel/4 transition-colors group">

      {/* Mobile layout */}
      <div className="md:hidden space-y-2">
        <div>
          <div className="flex items-center gap-2">
            {d.code ? (
              <span className="font-mono text-sm font-bold text-caramel bg-caramel/10 px-2.5 py-0.5 rounded-lg border border-caramel/20 tracking-wider">{d.code}</span>
            ) : (
              <span className="text-xs font-sans font-semibold text-ink-light/55 bg-caramel/8 px-2 py-0.5 rounded-lg border border-caramel/15">Badge only</span>
            )}
            {d.code && (
              <button onClick={onCopy} className="p-1 rounded-md text-ink-light/30 hover:text-caramel transition-colors btn-bubble" title="Copy code">
                <Copy className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-ink-light/55 font-sans mt-0.5">
            {d.applies_to === "all" ? "All products" : d.applies_to === "product" ? `Product: ${d.target_name}` : d.applies_to === "category" ? `Category: ${d.target_name}` : "Cart total (once per order)"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-base font-bold font-display text-ink-dark">{d.discount_value}</span>
            <span className="text-xs text-ink-light/50 font-sans">{d.discount_type === "percent" ? "%" : "PKR"} off</span>
          </div>

          <span className={cn("text-[10px] font-sans font-bold px-2.5 py-1 rounded-full border w-fit", statusColor)}>
            {statusLabel}
          </span>

          <div>
            <p className="text-xs font-sans font-semibold text-ink-dark">{d.uses_count} used</p>
            {d.max_uses && <p className="text-[10px] text-ink-light/40 font-sans">of {d.max_uses}</p>}
            {!d.max_uses && <p className="text-[10px] text-ink-light/40 font-sans">unlimited</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-1">
          <button onClick={onToggle}
            className={cn("px-2.5 py-1.5 rounded-xl border text-[11px] font-sans font-bold transition-all btn-bubble",
              toggleClass)}>
            {toggleLabel}
          </button>
          <button onClick={onToggleBanner}
            className={cn("px-2.5 py-1.5 rounded-xl border text-[11px] font-sans font-bold transition-all btn-bubble",
              d.hidden_from_banner ? "bg-caramel/12 border-caramel/30 text-caramel hover:bg-caramel/20" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100")}>
            {d.hidden_from_banner ? "Show Bar" : "Hide Bar"}
          </button>
          <button onClick={onEdit} className="p-2 rounded-xl border border-caramel/20 text-caramel hover:bg-caramel/10 transition-all btn-bubble" title="Edit discount"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-2 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-all btn-bubble" title="Delete discount"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid gap-4 items-center" style={{ gridTemplateColumns: "1fr 90px 110px 100px 90px 260px" }}>

        {/* Code + target */}
        <div>
        <div className="flex items-center gap-2">
          {d.code ? (
            <span className="font-mono text-sm font-bold text-caramel bg-caramel/10 px-2.5 py-0.5 rounded-lg border border-caramel/20 tracking-wider">{d.code}</span>
          ) : (
            <span className="text-xs font-sans font-semibold text-ink-light/55 bg-caramel/8 px-2 py-0.5 rounded-lg border border-caramel/15">Badge only</span>
          )}
          {d.code && (
            <button onClick={onCopy} className="p-1 rounded-md text-ink-light/30 hover:text-caramel transition-colors btn-bubble" title="Copy code">
              <Copy className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink-light/55 font-sans mt-0.5">
          {d.applies_to === "all" ? "All products" : d.applies_to === "product" ? `Product: ${d.target_name}` : d.applies_to === "category" ? `Category: ${d.target_name}` : "Cart total (once per order)"}
        </p>
        </div>

        {/* Value */}
        <div className="flex items-center gap-1">
        <span className="text-base font-bold font-display text-ink-dark">{d.discount_value}</span>
        <span className="text-xs text-ink-light/50 font-sans">{d.discount_type === "percent" ? "%" : "PKR"} off</span>
        </div>

        {/* Usage */}
        <div>
        <p className="text-xs font-sans font-semibold text-ink-dark">{d.uses_count} used</p>
        {d.max_uses && (
          <>
            <div className="h-1 bg-blush/20 rounded-full mt-1 overflow-hidden w-20">
              <div className="h-full bg-caramel rounded-full" style={{ width: `${Math.min(100, (d.uses_count / d.max_uses) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-ink-light/40 font-sans">of {d.max_uses}</p>
          </>
        )}
        {!d.max_uses && <p className="text-[10px] text-ink-light/40 font-sans">unlimited</p>}
        </div>

        {/* Expiry */}
        <div>
        {d.end_date ? (
          <>
            <p className="text-xs font-sans text-ink-dark flex items-center gap-1">
              <Calendar className="w-3 h-3 text-caramel/60" />{d.end_date}
            </p>
            <p className={cn("text-[10px] font-sans mt-0.5", isExpired ? "text-red-400" : "text-ink-light/40")}>
              {isExpired ? "Expired" : "Active"}
            </p>
          </>
        ) : (
          <p className="text-xs font-sans text-ink-light/45">No expiry</p>
        )}
        </div>

        {/* Status */}
        <span className={cn("text-[10px] font-sans font-bold px-2.5 py-1 rounded-full border w-fit", statusColor)}>
          {statusLabel}
        </span>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2">
        <button onClick={onToggle}
          className={cn("px-3 py-1.5 min-w-[94px] rounded-xl border text-[11px] font-sans font-bold transition-all btn-bubble whitespace-nowrap",
            toggleClass)}>
          {toggleLabel}
        </button>
        <button onClick={onToggleBanner}
          className={cn("px-3 py-1.5 min-w-[86px] rounded-xl border text-[11px] font-sans font-bold transition-all btn-bubble whitespace-nowrap",
            d.hidden_from_banner ? "bg-caramel/12 border-caramel/30 text-caramel hover:bg-caramel/20" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100")}>
          {d.hidden_from_banner ? "Show Bar" : "Hide Bar"}
        </button>
        <button onClick={onEdit} className="p-2 rounded-xl border border-caramel/20 text-caramel hover:bg-caramel/10 transition-all btn-bubble" title="Edit discount"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="p-2 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-all btn-bubble" title="Delete discount"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </motion.div>
  );
};

/* =============================================
   DISCOUNTS PAGE
   ============================================= */
export default function AdminDiscountsPage() {
  useAdminAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [productsList, setProductsList] = useState<{id:string;name:string}[]>([]);
  const [categoriesList, setCategoriesList] = useState<{id:string;name:string}[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [productsRes, categoriesRes, discountsRes, hiddenBannerIds] = await Promise.all([
          supabase.from("products").select("id, name").eq("is_active", true).order("name"),
          supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
          supabase.from("discounts").select("*").order("created_at", { ascending: false }),
          readHiddenBannerIds(),
        ]);

        const products = (productsRes.data ?? []) as { id: string; name: string }[];
        const categories = (categoriesRes.data ?? []) as { id: string; name: string }[];
        setProductsList(products);
        setCategoriesList(categories);

        const productMap = new Map(products.map((p) => [p.id, p.name]));
        const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

        const rows = (discountsRes.data ?? []) as Array<{
          id: string;
          code: string | null;
          discount_type: "percent" | "flat";
          discount_value: number;
          applies_to?: "all" | "product" | "category" | "cart" | null;
          target_id?: string | null;
          product_id?: string | null;
          max_uses: number | null;
          uses_count: number;
          active: boolean;
          start_date: string;
          end_date: string | null;
          created_at: string;
        }>;

        setDiscounts(rows.map((d) => {
          const applies = d.applies_to ?? (d.product_id ? "product" : "all");
          const targetId = d.target_id ?? d.product_id ?? undefined;
          const targetName = applies === "product"
            ? (targetId ? productMap.get(targetId) : undefined) ?? "Product"
            : applies === "category"
              ? (targetId ? categoryMap.get(targetId) : undefined) ?? "Category"
              : applies === "cart"
                ? "Cart Total"
              : "All Products";

          return {
            id: d.id,
            code: d.code,
            discount_type: d.discount_type,
            discount_value: d.discount_value,
            applies_to: applies,
            target_id: targetId,
            target_name: targetName,
            max_uses: d.max_uses,
            uses_count: d.uses_count,
            active: d.active,
            hidden_from_banner: hiddenBannerIds.has(d.id),
            start_date: d.start_date?.split("T")[0] ?? "",
            end_date: d.end_date?.split("T")[0] ?? null,
            created_at: d.created_at?.split("T")[0] ?? "",
          } as Discount;
        }));
      } catch(e) { console.error(e); }
      finally { setDbLoading(false); }
    };
    load();
  }, []);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Discount | undefined>(undefined);
  const [delId, setDelId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "inactive">("all");

  const readHiddenBannerIds = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", HIDDEN_BANNER_IDS_KEY)
      .maybeSingle();

    try {
      const parsed = JSON.parse((data as { value?: string } | null)?.value ?? "[]");
      return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []);
    } catch {
      return new Set<string>();
    }
  };

  const writeHiddenBannerIds = async (ids: Set<string>) => {
    const payload = JSON.stringify(Array.from(ids));
    await supabase
      .from("site_settings")
      .upsert({ key: HIDDEN_BANNER_IDS_KEY, value: payload } as unknown as never, { onConflict: "key" });
  };

  const handleSave = async (form: DiscountForm) => {
    const targetList = form.applies_to === "product" ? productsList : form.applies_to === "category" ? categoriesList : [];
    const target = targetList.find(t => t.id === form.target_id);
    const discount: Discount = {
      id: editing?.id ?? String(Date.now()),
      code: form.no_code ? null : form.code.trim().toUpperCase() || null,
      discount_type: form.discount_type,
      discount_value: Math.max(1, Number(form.discount_value)),
      applies_to: form.applies_to,
      target_id: form.target_id || undefined,
      target_name: form.applies_to === "all" ? "All Products" : (target?.name ?? ""),
      max_uses: form.max_uses ? Math.max(1, Number(form.max_uses)) : null,
      uses_count: editing?.uses_count ?? 0,
      active: form.active,
      start_date: form.start_date,
      end_date: form.end_date || null,
      created_at: editing?.created_at ?? new Date().toISOString().split("T")[0],
    };
    // Write to Supabase
    const dbPayload = {
      code: discount.code,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      applies_to: discount.applies_to,
      target_id: discount.target_id ?? null,
      max_uses: discount.max_uses,
      active: discount.active,
      start_date: discount.start_date,
      end_date: discount.end_date,
    };
    if (editing) {
      const { error } = await supabase.from("discounts").update(dbPayload as unknown as never).eq("id", editing.id);
      if (error) { alert("Save failed: " + error.message); return; }
      setDiscounts(p => p.map(d => d.id === editing.id ? discount : d));
    } else {
      const { data: ins, error } = await supabase.from("discounts").insert(dbPayload as unknown as never).select().single();
      if (error) { alert("Create failed: " + error.message); return; }
      if (ins) {
        const inserted = ins as { id: string };
        setDiscounts(p => [...p, { ...discount, id: inserted.id }]);
      }
    }
    setModal(false); setEditing(undefined);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => { setCopied(code); setTimeout(() => setCopied(null), 2000); });
  };

  const now = new Date().toISOString().split("T")[0];
  const filtered = discounts.filter(d => {
    if (filter === "active") return d.active && (!d.end_date || d.end_date >= now);
    if (filter === "expired") return d.active && d.end_date && d.end_date < now;
    if (filter === "inactive") return !d.active;
    return true;
  });

  const stats = {
    total: discounts.length,
    active: discounts.filter(d => d.active && (!d.end_date || d.end_date >= now)).length,
    totalUses: discounts.reduce((s, d) => s + d.uses_count, 0),
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-dark">Discounts & Coupons</h1>
            <p className="text-sm text-ink-light/55 font-sans mt-0.5">
              {stats.total} total · {stats.active} active · {stats.totalUses} total uses
            </p>
          </div>
          <button onClick={() => { setEditing(undefined); setModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-caramel to-latte text-white text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble">
            <Plus className="w-4 h-4" /> New Discount
          </button>
        </div>

        {modal && (
          <div className="mb-6">
            <DiscountModal
              embedded
              discount={editing}
              onSave={handleSave}
              onClose={() => { setModal(false); setEditing(undefined); }}
              productsList={productsList}
              categoriesList={categoriesList}
            />
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Active Discounts", value: stats.active, color: "from-green-50 to-emerald-50/50 border-green-200/60", icon: <Tag className="w-5 h-5 text-green-600" /> },
            { label: "Total Uses",       value: stats.totalUses, color: "from-caramel/10 to-blush/10 border-caramel/20",   icon: <Check className="w-5 h-5 text-caramel" /> },
            { label: "Total Discounts",  value: stats.total,  color: "from-blush/10 to-mauve/8 border-blush/25",           icon: <Percent className="w-5 h-5 text-mauve" /> },
          ].map((s) => (
            <div key={s.label} className={cn("glass rounded-2xl border p-4 bg-gradient-to-br", s.color)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center">{s.icon}</div>
                <div>
                  <p className="font-display text-xl font-semibold text-ink-dark">{s.value}</p>
                  <p className="text-[11px] text-ink-light/60 font-sans">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {(["all","active","expired","inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-1.5 rounded-xl text-xs font-sans font-semibold capitalize border transition-all btn-bubble",
                filter === f ? "bg-caramel/15 border-caramel/40 text-caramel" : "border-caramel/15 text-ink-light/60 hover:border-caramel/30 bg-white/70")}>
              {f}
            </button>
          ))}
        </div>

        {/* Copied toast */}
        <AnimatePresence>
          {copied && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-ink-dark text-white text-sm font-sans font-semibold px-5 py-3 rounded-2xl shadow-card">
              <Check className="w-4 h-4 text-green-400" /> Copied: {copied}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="glass rounded-3xl border border-caramel/15 overflow-hidden">
          <div className="md:hidden px-4 py-2.5 border-b border-caramel/10 bg-caramel/4">
            <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest">Discounts</p>
          </div>
          <div className="hidden md:grid px-5 py-3 border-b border-caramel/10 bg-caramel/4"
            style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 100px 90px 260px", gap: "1rem" }}>
            {["Code / Target", "Value", "Uses", "Expiry", "Status", ""].map((h) => (
              <p key={h} className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest">{h}</p>
            ))}
          </div>
          <AnimatePresence mode="popLayout">
            {filtered.map(d => (
              <DiscountRow key={d.id} d={d}
                onEdit={() => { setEditing(d); setModal(true); }}
                onDelete={() => setDelId(d.id)}
                onToggle={async () => {
                  const isExpired = Boolean(d.end_date && new Date(d.end_date) < new Date());
                  const shouldActivate = !d.active || isExpired;
                  const payload = shouldActivate
                    ? ({ active: true, ...(isExpired ? { end_date: null } : {}) })
                    : ({ active: false });

                  await supabase
                    .from("discounts")
                    .update(payload as unknown as never)
                    .eq("id", d.id);

                  setDiscounts((p) =>
                    p.map((di) =>
                      di.id === d.id
                        ? {
                            ...di,
                            active: shouldActivate,
                            end_date: shouldActivate && isExpired ? null : di.end_date,
                          }
                        : di
                    )
                  );
                }}
                onToggleBanner={async () => {
                  const ids = await readHiddenBannerIds();
                  if (d.hidden_from_banner) ids.delete(d.id);
                  else ids.add(d.id);
                  await writeHiddenBannerIds(ids);
                  setDiscounts((p) => p.map((di) => di.id === d.id ? { ...di, hidden_from_banner: !d.hidden_from_banner } : di));
                }}
                onCopy={() => d.code && copyCode(d.code)}
              />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <Tag className="w-8 h-8 text-caramel/30" />
              <p className="font-display text-base text-ink-dark">No discounts found</p>
              <button onClick={() => setModal(true)} className="text-sm text-caramel font-sans font-semibold">Create your first discount →</button>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {delId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-sm" onClick={() => setDelId(null)}>
            <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm glass rounded-3xl border border-red-200/60 shadow-card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-display text-base font-semibold text-ink-dark mb-1.5">Delete discount?</h3>
              <p className="text-xs text-ink-light/60 font-sans mb-5">
                Code &ldquo;{discounts.find(d => d.id === delId)?.code ?? "Badge"}&rdquo; will be removed permanently.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDelId(null)} className="flex-1 py-2.5 rounded-2xl border border-caramel/20 text-ink font-sans font-semibold text-sm btn-bubble">Cancel</button>
                <button onClick={() => { (async () => {
          const { error } = await supabase.from("discounts").delete().eq("id", delId!);
          if (error) { alert("Delete failed: " + error.message); return; }
          setDiscounts(p => p.filter(d => d.id !== delId)); setDelId(null);
        })() }}
                  className="flex-1 py-2.5 rounded-2xl bg-red-400 text-white font-sans font-bold text-sm hover:bg-red-500 transition-all btn-bubble">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
