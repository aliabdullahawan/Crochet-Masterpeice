"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Plus, Pencil, Trash2, Save, X, Search,
  Tag, Sparkles, Star, ChevronDown, Check, Eye, EyeOff,
  Upload, ArrowUpDown, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

/* =============================================
   TYPES
   ============================================= */
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category_id: string | null;
  category_name: string;
  stock_quantity: number;
  average_rating: number;
  review_count: number;
  discount_type?: "percent" | "flat";
  discount_percent?: number;
  discount_active: boolean;
  is_featured: boolean;
  is_active: boolean;
  tags: string[];
  created_at: string;
}

const CATEGORIES: {id:string;name:string}[] = []; // Loaded from Supabase categories

const MOCK_PRODUCTS: Product[] = []; // Loaded from Supabase
/* =============================================
   AUTH GUARD
   ============================================= */
function useAdminAuth() {
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in"))
      window.location.href = "/admin/login";
  }, []);
}

/* =============================================
   PRODUCT FORM MODAL
   ============================================= */
interface ProductFormData {
  name: string; description: string; product_detail: string;
  price: string; original_price: string;
  category_id: string; stock_quantity: string;
  is_featured: boolean; is_active: boolean;
  discount_active: boolean;
  discount_type: "percent" | "flat";
  discount_value: string;
  tags: string;       // comma-separated, used internally
  image_url?: string; // primary image
  images?: string[];  // all images
}

const defaultForm: ProductFormData = {
  name: "", description: "", product_detail: "", price: "", original_price: "",
  category_id: "", stock_quantity: "",
  is_featured: false, is_active: true,
  discount_active: false,
  discount_type: "percent",
  discount_value: "",
  tags: "",
  image_url: "",
  images: [],
};

/* ── ProductField — defined OUTSIDE modal so it never re-creates on render ── */
/* This prevents cursor jumping/disappearing when typing in inputs            */
const ProductField = ({
  label, name, type = "text", placeholder, hint, form, errors, onChange,
}: {
  label: string;
  name: keyof ProductFormData;
  type?: string;
  placeholder?: string;
  hint?: string;
  form: ProductFormData;
  errors: Partial<Record<keyof ProductFormData, string>>;
  onChange: (name: keyof ProductFormData, value: string) => void;
}) => (
  <div>
    <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">{label}</label>
    <input
      type={type}
      value={String(form[name] ?? "")}
      onChange={(e) => {
        let v = e.target.value;
        if (type === "number" && v !== "" && Number(v) < 0) v = "0";
        onChange(name, v);
      }}
      placeholder={placeholder}
      min={type === "number" ? "0" : undefined}
      className={[
        "w-full px-3.5 py-2.5 rounded-2xl border text-sm font-sans text-ink",
        "placeholder:text-ink-light/35 outline-none transition-all",
        errors[name]
          ? "border-red-300 bg-red-50/50 focus:border-red-400"
          : "border-caramel/20 bg-cream-50/80 focus:border-caramel focus:shadow-[0_0_0_3px_rgba(200,149,108,0.15)]",
      ].join(" ")}
    />
    {errors[name] && <p className="text-[11px] text-red-500 mt-1">{errors[name]}</p>}
    {hint && !errors[name] && <p className="text-[11px] text-ink-light/40 mt-1">{hint}</p>}
  </div>
);

const ProductModal = ({
  product, onSave, onClose, categories, embedded = false,
}: {
  product?: Product;
  onSave: (data: ProductFormData) => void;
  onClose: () => void;
  categories: {id:string;name:string}[];
  embedded?: boolean;
}) => {
  const productMedia = product as (Product & { image_url?: string; images?: string[] }) | undefined;
  const initialImages = productMedia
    ? ((productMedia.images?.length ? productMedia.images : (productMedia.image_url ? [productMedia.image_url] : [])) ?? [])
    : [];

  const [form, setForm] = useState<ProductFormData>(product ? {
    name: product.name, description: product.description, product_detail: product.description,
    price: String(product.price), original_price: String(product.original_price ?? ""),
    category_id: product.category_id ?? "", stock_quantity: String(product.stock_quantity),
    is_featured: product.is_featured, is_active: product.is_active,
    discount_active: product.discount_active,
    discount_type: product.discount_type ?? "percent",
    discount_value: String(product.discount_percent ?? ""),
    tags: product.tags.join(", "),
    image_url: initialImages[0] ?? "",
    images: initialImages,
  } : defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [tab, setTab] = useState<"basic" | "pricing" | "extra">("basic");

  const set = (k: keyof ProductFormData) => (v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name required";
    if (!form.category_id) e.category_id = "Category required";
    const p = Number(form.price);
    if (!form.price || isNaN(p) || p < 0) e.price = "Valid price required";
    const op = Number(form.original_price);
    if (form.original_price && (isNaN(op) || op < 0)) e.original_price = "Must be ≥ 0";
    if (form.original_price && Number(form.original_price) <= p) e.original_price = "Must be greater than sale price";
    const sq = Number(form.stock_quantity);
    if (!form.stock_quantity || isNaN(sq) || sq < 0) e.stock_quantity = "Valid quantity required";
    if (form.discount_active) {
      const salePrice = Number(form.price);
      const originalPrice = Number(form.original_price);
      if (!form.original_price || isNaN(originalPrice) || originalPrice <= salePrice) {
        e.original_price = "For active discount, Original Price must be greater than Sale Price";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (validate()) onSave(form); };

  // Field is passed as prop to avoid re-creation on each render (which loses cursor focus)

  const Toggle = ({ label, name, sub }: { label: string; name: keyof ProductFormData; sub?: string }) => (
    <button type="button" onClick={() => set(name)(!form[name])}
      className={cn("flex items-center justify-between w-full px-4 py-3 rounded-2xl border transition-all btn-bubble",
        form[name] ? "border-caramel/40 bg-caramel/10" : "border-caramel/15 bg-white/60 hover:border-caramel/30")}>
      <div className="text-left">
        <p className="text-sm font-sans font-semibold text-ink-dark">{label}</p>
        {sub && <p className="text-[11px] text-ink-light/50 mt-0.5">{sub}</p>}
      </div>
      <div className={cn("w-10 h-5.5 rounded-full border-2 relative transition-all flex-shrink-0",
        form[name] ? "bg-caramel border-caramel" : "bg-white border-caramel/30")}>
        <div className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all",
          form[name] ? "left-[calc(100%-18px)]" : "left-0.5")} />
      </div>
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={embedded ? "w-full" : "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-dark/45 backdrop-blur-sm"}
      onClick={embedded ? undefined : onClose}>
      <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={embedded ? undefined : (e) => e.stopPropagation()}
        className={cn(
          "w-full glass rounded-3xl border border-caramel/25 shadow-card flex flex-col",
          embedded ? "max-h-none" : "max-w-lg max-h-[90vh]"
        )}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-caramel/10 flex-shrink-0">
          <h3 className="font-display text-lg font-semibold text-ink-dark">{product ? "Edit Product" : "New Product"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-caramel/10 text-ink-light btn-bubble"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-caramel/10 px-6 flex-shrink-0">
          {(["basic", "pricing", "extra"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-2.5 text-xs font-sans font-semibold border-b-2 transition-all capitalize",
                tab === t ? "border-caramel text-caramel" : "border-transparent text-ink-light/55 hover:text-ink")}>
              {t === "basic" ? "Basic Info" : t === "pricing" ? "Pricing" : "Extra"}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {tab === "basic" && (
            <>
              <ProductField label="Product Name" name="name" placeholder="e.g. Daisy Chain Cardigan"  form={form} errors={errors} onChange={(n, v) => { set(n as keyof ProductFormData)(v); setErrors(er => ({ ...er, [n]: undefined })); }} />
              <div>
                <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => set("description")(e.target.value)}
                  placeholder="Short card description (optional)…" rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-caramel/20 bg-cream-50/80 text-sm font-sans text-ink placeholder:text-ink-light/35 outline-none focus:border-caramel focus:shadow-[0_0_0_3px_rgba(200,149,108,0.15)] transition-all resize-none" />
              </div>
              <div>
                <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">Product Detail (Optional)</label>
                <textarea value={form.product_detail} onChange={(e) => set("product_detail")(e.target.value)}
                  placeholder="Long detail for product page (materials, size, notes)..." rows={5}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-caramel/20 bg-cream-50/80 text-sm font-sans text-ink placeholder:text-ink-light/35 outline-none focus:border-caramel focus:shadow-[0_0_0_3px_rgba(200,149,108,0.15)] transition-all resize-none" />
              </div>
              <div>
                <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">Category</label>
                <select value={form.category_id ?? ""} onChange={(e) => set("category_id")(e.target.value)}
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-2xl border bg-cream-50/80 text-sm font-sans text-ink outline-none transition-all",
                    errors.category_id
                      ? "border-red-300 focus:border-red-400"
                      : "border-caramel/20 focus:border-caramel"
                  )}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id || String(c.name)} value={c.id}>{c.name}</option>)}
                </select>
                {errors.category_id && <p className="text-[11px] text-red-500 mt-1">{errors.category_id}</p>}
              </div>
              {/* Multi-image upload */}
              <div>
                <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">
                  Product Images <span className="text-ink-light/40 font-normal normal-case">({(form.images ?? []).length} added — first is primary)</span>
                </label>
                {/* Existing images */}
                {(form.images ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(form.images ?? []).map((url, idx) => (
                      <div key={idx} className="relative w-20 h-16 rounded-xl overflow-hidden border-2 border-caramel/20 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-0.5 left-0.5 bg-caramel text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">Primary</span>
                        )}
                        <button type="button"
                          onClick={() => {
                            const imgs = [...(form.images ?? [])];
                            imgs.splice(idx, 1);
                            setForm(f => ({ ...f, images: imgs, image_url: imgs[0] ?? "" }));
                          }}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const imgs = [...(form.images ?? [])];
                              const [picked] = imgs.splice(idx, 1);
                              imgs.unshift(picked);
                              setForm((f) => ({ ...f, images: imgs, image_url: imgs[0] ?? "" }));
                            }}
                            className="absolute bottom-0.5 left-0.5 bg-caramel text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Cover
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Upload button */}
                <label className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-caramel/20 cursor-pointer hover:border-caramel/50 transition-colors">
                  <Upload className="w-4 h-4 text-caramel/50 flex-shrink-0" />
                  <span className="text-xs font-sans text-ink-light/60">Click to add images (multiple allowed)</span>
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (!files.length) return;
                      const newUrls: string[] = [];
                      for (const file of files) {
                        const ext = file.name.split(".").pop() ?? "jpg";
                        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                        const { error: upErr } = await supabase.storage
                          .from("images").upload(path, file, { upsert: true, contentType: file.type });
                        if (upErr) {
                          // fallback to base64
                          await new Promise<void>(resolve => {
                            const reader = new FileReader();
                            reader.onload = (ev) => { newUrls.push(ev.target?.result as string); resolve(); };
                            reader.readAsDataURL(file);
                          });
                        } else {
                          const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
                          newUrls.push(publicUrl);
                        }
                      }
                      setForm(f => {
                        const all = [...(f.images ?? []), ...newUrls];
                        return { ...f, images: all, image_url: all[0] ?? "" };
                      });
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </>
          )}

          {tab === "pricing" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <ProductField label="Sale Price (PKR)" name="price" type="number" placeholder="2800"  form={form} errors={errors} onChange={(n, v) => { set(n as keyof ProductFormData)(v); setErrors(er => ({ ...er, [n]: undefined })); }} />
                <ProductField label="Original Price (PKR)" name="original_price" type="number" placeholder="3500" hint="Leave empty if no discount"  form={form} errors={errors} onChange={(n, v) => { set(n as keyof ProductFormData)(v); setErrors(er => ({ ...er, [n]: undefined })); }} />
              </div>
              <ProductField label="Stock Quantity" name="stock_quantity" type="number" placeholder="10"  form={form} errors={errors} onChange={(n, v) => { set(n as keyof ProductFormData)(v); setErrors(er => ({ ...er, [n]: undefined })); }} />
              <Toggle label="Active Discount" name="discount_active" sub="Show discount badge on product" />
              {form.discount_active && (
                <p className="text-[11px] text-ink-light/45 font-sans bg-caramel/8 border border-caramel/15 rounded-xl px-3 py-2">
                  Discount will be auto-calculated from Original Price and Sale Price. No extra discount fields required.
                </p>
              )}
            </>
          )}

          {tab === "extra" && (
            <>
              <Toggle label="Featured Product" name="is_featured" sub="Shown in featured section on home page" />
              <Toggle label="Active / Visible" name="is_active" sub="Hidden from shop if turned off" />
              {/* Tag chip input */}
              <div>
                <label className="block text-xs font-sans font-semibold text-ink-light/65 uppercase tracking-wider mb-1.5">Tags</label>
                <div className="border border-caramel/20 bg-cream-50/80 rounded-2xl px-3 py-2 min-h-[44px] flex flex-wrap gap-1.5 focus-within:border-caramel focus-within:shadow-[0_0_0_3px_rgba(200,149,108,0.15)] transition-all">
                  {(form.tags || "").split(",").filter(t => t.trim()).map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 bg-caramel/15 text-caramel text-xs font-sans font-semibold px-2.5 py-1 rounded-full">
                      {tag.trim()}
                      <button type="button" onClick={() => {
                        const arr = (form.tags || "").split(",").filter(t => t.trim());
                        arr.splice(i, 1);
                        set("tags")(arr.join(","));
                      }} className="hover:text-red-400 transition-colors ml-0.5">×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={(form.tags || "").split(",").filter(t => t.trim()).length === 0 ? "Type a tag, press Enter" : "Add another..."}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm font-sans text-ink placeholder:text-ink-light/35 py-0.5"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (!val) return;
                        const existing = (form.tags || "").split(",").filter(t => t.trim());
                        if (!existing.includes(val)) {
                          set("tags")([...existing, val].join(","));
                        }
                        (e.target as HTMLInputElement).value = "";
                      }
                      if (e.key === "Backspace" && !(e.target as HTMLInputElement).value) {
                        const arr = (form.tags || "").split(",").filter(t => t.trim());
                        arr.pop();
                        set("tags")(arr.join(","));
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-ink-light/40 mt-1 font-sans">Press Enter or comma to add each tag</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-caramel/10 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl border border-caramel/20 text-ink font-sans font-semibold text-sm hover:bg-caramel/8 transition-all btn-bubble">Cancel</button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-caramel to-latte text-white font-sans font-bold text-sm shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> {product ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* =============================================
   PRODUCT ROW
   ============================================= */
const ProductRow = ({ product, onEdit, onDelete, onToggle, onToggleFeatured }: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onToggleFeatured: () => void;
}) => {
  const showDiscountPrice = Boolean(product.discount_active && product.original_price && product.original_price > product.price);
  const displayPrice = !product.discount_active && product.original_price ? product.original_price : product.price;

  return (
  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.22 }}
    className="px-4 sm:px-5 py-3.5 hover:bg-caramel/4 transition-colors border-b border-caramel/8 last:border-0 group">

    <div className="flex items-start gap-3">
      {/* Image or initial circle */}
      <div className={cn("w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-display text-sm font-semibold text-caramel/80 flex-shrink-0",
        "bg-gradient-to-br from-blush/30 to-mauve/20")}>
        {(product as Product & {image_url?:string}).image_url ? (
          <img src={(product as Product & {image_url?:string}).image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          product.name.charAt(0)
        )}
      </div>

      {/* Name + meta + mobile stats */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display text-sm font-semibold text-ink-dark truncate">{product.name}</p>
          {product.is_featured && (
            <span className="flex-shrink-0 text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-mauve/20 to-blush/15 text-mauve border border-mauve/20">Featured</span>
          )}
          {product.discount_active && product.discount_percent && (
            <span className="flex-shrink-0 text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-caramel/15 text-caramel border border-caramel/20">
              {product.discount_type === "flat" ? `-PKR ${product.discount_percent}` : `-${product.discount_percent}%`}
            </span>
          )}
        </div>
        <p className="text-[10px] text-ink-light/50 font-sans">{product.category_name} · Stock: {product.stock_quantity}</p>

        {/* Mobile info + actions */}
        <div className="mt-2 md:hidden space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-sm font-bold font-sans text-ink-dark">PKR {displayPrice.toLocaleString()}</p>
              {showDiscountPrice && (
                <p className="text-[10px] text-ink-light/40 font-sans line-through">PKR {Number(product.original_price ?? 0).toLocaleString()}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-caramel text-caramel" />
              <span className="text-xs font-sans font-semibold text-ink">{product.average_rating}</span>
              <span className="text-[10px] text-ink-light/40">({product.review_count})</span>
            </div>
            <span className={cn("text-[10px] font-sans font-bold px-2.5 py-1 rounded-full border text-center",
              product.is_active ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-400 border-red-200")}>
              {product.is_active ? "Active" : "Hidden"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={onToggleFeatured} title={product.is_featured ? "Unfeature" : "Feature"}
              className={cn("p-1.5 rounded-xl border transition-all btn-bubble",
                product.is_featured ? "border-mauve/30 bg-mauve/10 text-mauve" : "border-caramel/20 text-ink-light/50 hover:bg-mauve/8 hover:text-mauve hover:border-mauve/25")}>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button onClick={onToggle} title={product.is_active ? "Hide" : "Show"}
              className="p-1.5 rounded-xl border border-caramel/20 text-ink-light/50 hover:bg-caramel/8 hover:text-caramel transition-all btn-bubble">
              {product.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onEdit}
              className="p-1.5 rounded-xl border border-caramel/20 text-caramel hover:bg-caramel/10 transition-all btn-bubble">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete}
              className="p-1.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-all btn-bubble">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Desktop columns */}
    <div className="hidden md:grid md:[grid-template-columns:120px_80px_100px_130px] gap-4 items-center mt-3">
      {/* Price */}
      <div>
        <p className="text-sm font-bold font-sans text-ink-dark">PKR {displayPrice.toLocaleString()}</p>
        {showDiscountPrice && (
          <p className="text-[10px] text-ink-light/40 font-sans line-through">PKR {Number(product.original_price ?? 0).toLocaleString()}</p>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3 fill-caramel text-caramel" />
        <span className="text-xs font-sans font-semibold text-ink">{product.average_rating}</span>
        <span className="text-[10px] text-ink-light/40">({product.review_count})</span>
      </div>

      {/* Status */}
      <span className={cn("text-[10px] font-sans font-bold px-2.5 py-1 rounded-full border text-center",
        product.is_active ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-400 border-red-200")}>
        {product.is_active ? "Active" : "Hidden"}
      </span>

      {/* Actions */}
      <div className="flex gap-1.5 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button onClick={onToggleFeatured} title={product.is_featured ? "Unfeature" : "Feature"}
          className={cn("p-1.5 rounded-xl border transition-all btn-bubble",
            product.is_featured ? "border-mauve/30 bg-mauve/10 text-mauve" : "border-caramel/20 text-ink-light/50 hover:bg-mauve/8 hover:text-mauve hover:border-mauve/25")}>
          <Sparkles className="w-3.5 h-3.5" />
        </button>
        <button onClick={onToggle} title={product.is_active ? "Hide" : "Show"}
          className="p-1.5 rounded-xl border border-caramel/20 text-ink-light/50 hover:bg-caramel/8 hover:text-caramel transition-all btn-bubble">
          {product.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onEdit}
          className="p-1.5 rounded-xl border border-caramel/20 text-caramel hover:bg-caramel/10 transition-all btn-bubble">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete}
          className="p-1.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-all btn-bubble">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </motion.div>
  );
};

/* =============================================
   PRODUCTS PAGE
   ============================================= */
export default function AdminProductsPage() {
  useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const [catList, setCatList] = useState<{id:string;name:string}[]>([]);

  useEffect(() => {
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order")
      .then(({ data }) => { if (data) setCatList(data); });
  }, []);

  const loadProducts = async () => {
    try {
      const [productsRes, listingRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, description, price, original_price, category_id, stock_quantity, is_featured, is_active, average_rating, review_count, tags, image_url, images, created_at, categories(name)")
          .order("created_at", { ascending: false }),
        supabase.from("product_listing").select("id, active_discount_percent, discount_active"),
        supabase.from("categories").select("id, name"),
      ]);

      const categoryById = new Map<string, string>(
        ((categoriesRes.data ?? []) as Array<{ id: string; name: string }>).map((c) => [c.id, c.name])
      );

      const discountTypeByProduct = new Map<string, "percent" | "flat">();
      const modernDiscounts = await supabase
        .from("discounts")
        .select("target_id, applies_to, discount_type")
        .eq("active", true)
        .eq("applies_to", "product");

      if (!modernDiscounts.error && modernDiscounts.data) {
        (modernDiscounts.data as { target_id: string | null; discount_type: "percent" | "flat" | null }[]).forEach((row) => {
          if (row.target_id) {
            discountTypeByProduct.set(row.target_id, row.discount_type ?? "percent");
          }
        });
      } else {
        const legacyDiscounts = await supabase
          .from("discounts")
          .select("product_id, discount_type")
          .eq("active", true);
        if (!legacyDiscounts.error && legacyDiscounts.data) {
          (legacyDiscounts.data as { product_id: string | null; discount_type: "percent" | "flat" | null }[]).forEach((row) => {
            if (row.product_id) {
              discountTypeByProduct.set(row.product_id, row.discount_type ?? "percent");
            }
          });
        }
      }

      const listingMap = new Map(
        ((listingRes.data ?? []) as { id: string; active_discount_percent?: number | null; discount_active?: boolean | null }[])
          .map((r) => [r.id, r])
      );

      if (productsRes.data) {
        setProducts(productsRes.data.map((p: Record<string, unknown>) => {
          const discountRow = listingMap.get(String(p.id));
          const categoryId = (p.category_id as string | null) ?? null;
          const joinedCategory = (p.categories as {name:string}|null)?.name;
          return {
            ...p,
            category_name: joinedCategory ?? (categoryId ? categoryById.get(categoryId) : undefined) ?? "Uncategorised",
            discount_active: Boolean(discountRow?.discount_active),
            discount_type: discountTypeByProduct.get(String(p.id)) ?? "percent",
            discount_percent: discountRow?.active_discount_percent ?? undefined,
          };
        }) as Product[]);
      }
    } catch(e) { console.error(e); }
    finally { setDbLoading(false); }
  };

  useEffect(() => { loadProducts(); }, []);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "hidden" | "featured">("all");
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc" | "rating" | "newest">("newest");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>(undefined);
  const [delId, setDelId] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = products
    .filter(p => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.category_name.toLowerCase().includes(q)) return false;
      }
      if (filterCat && p.category_id !== filterCat) return false;
      if (filterStatus === "active" && !p.is_active) return false;
      if (filterStatus === "hidden" && p.is_active) return false;
      if (filterStatus === "featured" && !p.is_featured) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "rating") return b.average_rating - a.average_rating;
      return b.id.localeCompare(a.id);
    });

  const handleSave = async (data: ProductFormData) => {
    const cat = catList.find(c => c.id === data.category_id);
    const payload = {
      name: data.name.trim(),
      description: (data.product_detail || data.description || "").trim(),
      price: Math.max(0, Number(data.price)),
      original_price: data.original_price ? Math.max(0, Number(data.original_price)) : null,
      category_id: data.category_id || null,
      stock_quantity: Math.max(0, Number(data.stock_quantity)),
      is_featured: data.is_featured,
      is_active: data.is_active,
      tags: data.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      image_url: (data.images?.[0] ?? data.image_url) || null,
      images: data.images ?? [],
    };
    if (editing) {
      const { error } = await supabase.from("products").update(payload as unknown as never).eq("id", editing.id);
      if (error) { alert("Save failed: " + error.message); return; }

      const inferredDiscountValue = (() => {
        const sale = Number(data.price);
        const original = Number(data.original_price || 0);
        if (!original || original <= sale) return 0;
        return Math.max(1, Math.min(99, Math.round(((original - sale) / original) * 100)));
      })();
      const finalDiscountValue = inferredDiscountValue;

      if (data.discount_active && finalDiscountValue > 0) {
        const modernCheck = await supabase
          .from("discounts")
          .select("id")
          .eq("applies_to", "product")
          .eq("target_id", editing.id)
          .limit(1);

        if (!modernCheck.error) {
          const existingId = (modernCheck.data?.[0] as { id: string } | undefined)?.id;
          const modernPayload = {
            code: null,
            discount_type: "percent",
            discount_value: finalDiscountValue,
            applies_to: "product",
            target_id: editing.id,
            active: true,
            start_date: new Date().toISOString(),
            end_date: null,
          };

          if (existingId) {
            await supabase.from("discounts").update(modernPayload as unknown as never).eq("id", existingId);
          } else {
            await supabase.from("discounts").insert(modernPayload as unknown as never);
          }
        } else {
          const legacyCheck = await supabase.from("discounts").select("id").eq("product_id", editing.id).limit(1);
          const existingId = (legacyCheck.data?.[0] as { id: string } | undefined)?.id;
          const legacyPayload = {
            code: null,
            discount_type: "percent",
            discount_value: finalDiscountValue,
            product_id: editing.id,
            active: true,
            start_date: new Date().toISOString(),
            end_date: null,
          };
          if (existingId) {
            await supabase.from("discounts").update(legacyPayload as unknown as never).eq("id", existingId);
          } else {
            await supabase.from("discounts").insert(legacyPayload as unknown as never);
          }
        }
      } else {
        const modernDeactivate = await supabase
          .from("discounts")
          .update({ active: false } as unknown as never)
          .eq("applies_to", "product")
          .eq("target_id", editing.id);
        if (modernDeactivate.error) {
          await supabase.from("discounts").update({ active: false } as unknown as never).eq("product_id", editing.id);
        }
      }

      setProducts(p => p.map(pr => pr.id === editing.id
        ? {
            ...pr,
            ...payload,
            original_price: payload.original_price ?? undefined,
            category_name: cat?.name ?? pr.category_name,
            discount_active: data.discount_active,
            discount_type: "percent",
            discount_percent: data.discount_active ? finalDiscountValue : undefined,
          }
        : pr
      ));
    } else {
      const { data: inserted, error } = await supabase.from("products").insert(payload as unknown as never).select().single();
      if (error) { alert("Create failed: " + error.message); return; }
      const insertedRow = inserted as ({ id: string; original_price?: number | null } & Record<string, unknown>) | null;
      const inferredDiscountValue = (() => {
        const sale = Number(data.price);
        const original = Number(data.original_price || 0);
        if (!original || original <= sale) return 0;
        return Math.max(1, Math.min(99, Math.round(((original - sale) / original) * 100)));
      })();
      const finalDiscountValue = inferredDiscountValue;

      if (insertedRow && data.discount_active && finalDiscountValue > 0) {
        const modernInsert = await supabase.from("discounts").insert({
          code: null,
          discount_type: "percent",
          discount_value: finalDiscountValue,
          applies_to: "product",
          target_id: insertedRow.id,
          active: true,
          start_date: new Date().toISOString(),
          end_date: null,
        } as unknown as never);
        if (modernInsert.error) {
          await supabase.from("discounts").insert({
            code: null,
            discount_type: "percent",
            discount_value: finalDiscountValue,
            product_id: insertedRow.id,
            active: true,
            start_date: new Date().toISOString(),
            end_date: null,
          } as unknown as never);
        }
      }
      if (insertedRow) setProducts(p => [...p, {
        ...(insertedRow as unknown as Product), category_name: cat?.name ?? "",
        original_price: insertedRow.original_price ?? undefined,
        average_rating: 0, review_count: 0,
        discount_active: data.discount_active,
        discount_type: "percent",
        discount_percent: data.discount_active ? finalDiscountValue : undefined,
      }]);
    }
    setModal(false); setEditing(undefined);
    loadProducts();
  };

  const sortLabels: Record<typeof sortBy, string> = {
    newest: "Newest First", name: "Name A→Z",
    price_asc: "Price ↑", price_desc: "Price ↓", rating: "Top Rated",
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-dark">Products</h1>
            <p className="text-sm text-ink-light/55 font-sans mt-0.5">
              {filtered.length} of {products.length} products · {products.filter(p => p.is_active).length} active
            </p>
          </div>
          <button onClick={() => { setEditing(undefined); setModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-caramel to-latte text-white text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {modal && (
          <div className="mb-6">
            <ProductModal
              embedded
              product={editing}
              onSave={handleSave}
              onClose={() => { setModal(false); setEditing(undefined); }}
              categories={catList}
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-caramel/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-caramel/20 bg-white/80 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none focus:border-caramel focus:shadow-[0_0_0_3px_rgba(200,149,108,0.12)] transition-all" />
          </div>

          {/* Category filter */}
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-caramel/20 bg-white/80 text-sm font-sans text-ink outline-none focus:border-caramel transition-all">
            <option value="">All Categories</option>
            {catList.map(c => <option key={(c.id || String(Math.random()))} value={c.id}>{c.name}</option>)}
          </select>

          {/* Status filter */}
          <div className="flex rounded-2xl border border-caramel/20 overflow-hidden bg-white/80">
            {(["all", "active", "hidden", "featured"] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={cn("px-3 py-2 text-xs font-sans font-semibold capitalize transition-all",
                  filterStatus === s ? "bg-caramel/15 text-caramel" : "text-ink-light/60 hover:bg-caramel/8 hover:text-ink")}>
                {s}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div ref={sortRef} className="relative">
            <button onClick={() => setSortOpen(o => !o)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-caramel/20 bg-white/80 text-sm font-sans font-semibold text-ink hover:border-caramel/40 transition-all btn-bubble">
              <ArrowUpDown className="w-3.5 h-3.5 text-caramel" />
              <span className="hidden sm:block">{sortLabels[sortBy]}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-ink-light/40 transition-transform", sortOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-44 glass rounded-2xl shadow-card border border-caramel/20 overflow-hidden z-30">
                  {(Object.entries(sortLabels) as [typeof sortBy, string][]).map(([k, v]) => (
                    <button key={k} onClick={() => { setSortBy(k); setSortOpen(false); }}
                      className={cn("w-full flex items-center justify-between px-4 py-2.5 text-sm font-sans hover:bg-caramel/8 transition-colors",
                        sortBy === k ? "text-caramel font-semibold" : "text-ink")}>
                      {v} {sortBy === k && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-3xl border border-caramel/15 overflow-hidden">
          {/* Header */}
          <div className="md:hidden px-4 py-2.5 border-b border-caramel/10 bg-caramel/4">
            <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest">Products</p>
          </div>
          <div className="hidden md:grid px-5 py-3 border-b border-caramel/10 bg-caramel/4"
            style={{ gridTemplateColumns: "40px 1fr 120px 80px 100px 130px", gap: "1rem", alignItems: "center" }}>
            {["", "Product", "Price", "Rating", "Status", ""].map((h, i) => (
              <p key={i} className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest">{h}</p>
            ))}
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <ProductRow key={p.id} product={p}
                onEdit={() => { setEditing(p); setModal(true); }}
                onDelete={() => setDelId(p.id)}
                onToggle={async () => {
                  const newVal = !p.is_active;
                  const { error } = await supabase.from("products").update({ is_active: newVal } as unknown as never).eq("id", p.id);
                  if (!error) setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, is_active: newVal } : pr));
                  else alert("Update failed: " + error.message);
                }}
                onToggleFeatured={async () => {
                  const newVal = !p.is_featured;
                  const { error } = await supabase.from("products").update({ is_featured: newVal } as unknown as never).eq("id", p.id);
                  if (!error) setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, is_featured: newVal } : pr));
                  else alert("Update failed: " + error.message);
                }}
              />
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <Package className="w-8 h-8 text-caramel/30" />
              <p className="font-display text-base text-ink-dark">No products found</p>
              <button onClick={() => { setSearch(""); setFilterCat(""); setFilterStatus("all"); }}
                className="text-sm text-caramel font-sans font-semibold hover:text-ink transition-colors">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Delete confirm */}
      <AnimatePresence>
        {delId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-sm"
            onClick={() => setDelId(null)}>
            <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm glass rounded-3xl border border-red-200/60 shadow-card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-display text-base font-semibold text-ink-dark mb-1.5">Delete product?</h3>
              <p className="text-xs text-ink-light/60 font-sans mb-5">
                &ldquo;{products.find(p => p.id === delId)?.name}&rdquo; will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDelId(null)} className="flex-1 py-2.5 rounded-2xl border border-caramel/20 text-ink font-sans font-semibold text-sm btn-bubble">Cancel</button>
                <button onClick={() => { (async () => {
      const { error } = await supabase.from("products").delete().eq("id", delId!);
      if (error) { alert("Delete failed: " + error.message); return; }
      setProducts(p => p.filter(pr => pr.id !== delId));
    })(); setDelId(null); }}
                  className="flex-1 py-2.5 rounded-2xl bg-red-400 text-white font-sans font-bold text-sm hover:bg-red-500 transition-all btn-bubble">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
