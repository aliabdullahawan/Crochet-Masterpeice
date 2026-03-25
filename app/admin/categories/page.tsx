"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3X3, Plus, Pencil, Trash2, Save, X, ChevronDown, ChevronUp, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

interface Category {
  id: string; name: string; description: string;
  product_count: number; active: boolean; sort_order: number;
  image_url?: string; // base64 data URL or Supabase URL when connected
}

interface CategoryForm {
  name: string;
  description: string;
  active: boolean;
  sort_order: number;
  image_url: string;
}

// Categories loaded from Supabase

function useAdminAuth() {
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in"))
      window.location.href = "/admin/login";
  }, []);
}

const FieldInput = ({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) => (
  <div>
    <label className="block text-xs font-sans font-semibold text-ink-light/70 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-rose ml-0.5">*</span>}
    </label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-2xl border border-caramel/20 bg-cream-50/80 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none focus:border-caramel focus:shadow-[0_0_0_3px_rgba(200,149,108,0.15)] transition-all" />
  </div>
);

export default function AdminCategoriesPage() {
  useAdminAuth();
  const [cats, setCats] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);

  // Load categories from Supabase
  useEffect(() => {
    supabase.from("categories")
      .select("id, name, description, image_url, is_active, sort_order")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCats(data.map((d:{id:string;name:string;description:string|null;image_url:string|null;is_active:boolean;sort_order:number}) => ({
          id: d.id,
          name: d.name,
          description: d.description ?? "",
          image_url: d.image_url ?? undefined,
          product_count: 0,
          active: d.is_active,
          sort_order: d.sort_order,
        })));
        setCatsLoading(false);
      });
  }, []);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>({ name: "", description: "", active: true, sort_order: 99, image_url: "" });
  const [err, setErr] = useState("");

  const openNew = () => { setEditing(null); setForm({ name: "", description: "", active: true, sort_order: cats.length + 1, image_url: "" }); setErr(""); setModal(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description, active: c.active, sort_order: c.sort_order, image_url: c.image_url ?? "" }); setErr(""); setModal(true); };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { setErr("Category name is required."); return; }
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      is_active: form.active,
      sort_order: Math.max(1, form.sort_order),
      image_url: form.image_url || null,
    };

    if (editing) {
      const { error } = await supabase.from("categories").update(payload as unknown as never).eq("id", editing.id);
      if (error) { setErr(error.message); setSaving(false); return; }
      setCats((p) => p.map((c) => c.id === editing.id ? { ...c, ...form, sort_order: Math.max(1, form.sort_order) } : c));
    } else {
      const { data, error } = await supabase.from("categories").insert(payload as unknown as never).select().single();
      if (error) { setErr(error.message); setSaving(false); return; }
      if (data) {
        const inserted = data as {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
        };
        setCats((p) => [...p, {
          id: inserted.id,
          name: inserted.name,
          description: inserted.description ?? "",
          image_url: inserted.image_url ?? undefined,
          active: inserted.is_active,
          sort_order: inserted.sort_order,
          product_count: 0,
        }]);
      }
    }
    setSaving(false);
    setModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products in it will become uncategorised.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) setCats(p => p.filter(c => c.id !== id));
    else alert("Delete failed: " + error.message);
  };

  const move = (i: number, dir: -1 | 1) => {
    setCats((p) => {
      const a = [...p];
      const j = i + dir;
      if (j < 0 || j >= a.length) return p;
      [a[i], a[j]] = [a[j], a[i]];
      return a.map((c, idx) => ({ ...c, sort_order: idx + 1 }));
    });
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-dark">Categories</h1>
            <p className="text-sm text-ink-light/55 font-sans mt-0.5">{cats.length} categories · {cats.filter(c => c.active).length} active</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-caramel to-latte text-white text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble">
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>

        {modal && (
          <div className="glass rounded-3xl border border-caramel/25 shadow-card p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink-dark">{editing ? "Edit Category" : "New Category"}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-xl hover:bg-caramel/10 text-ink-light btn-bubble"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {err && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{err}</p>}
              <FieldInput label="Category Name" value={form.name} onChange={(v) => { setForm(f => ({ ...f, name: v })); setErr(""); }} placeholder="e.g. Cardigans & Tops" required />
              {/* Category Photo */}
              <div>
                <label className="block text-xs font-sans font-semibold text-ink-light/70 uppercase tracking-wider mb-1.5">Category Photo</label>
                <div className="flex gap-3 items-start">
                  {form.image_url && (
                    <div className="w-20 h-16 rounded-xl overflow-hidden border border-caramel/20 flex-shrink-0">
                      <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className={`flex-1 flex flex-col items-center justify-center px-3 py-3 rounded-2xl border-2 border-dashed cursor-pointer transition-colors hover:border-caramel/50 ${form.image_url ? "border-caramel/25" : "border-caramel/20"}`}>
                    <span className="text-xs font-sans text-ink-light/60">
                      {form.image_url ? "Change photo" : "Upload category photo"}
                    </span>
                    <span className="text-[10px] text-ink-light/35 mt-0.5">JPG, PNG · Shown on user site</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const ext = file.name.split(".").pop() ?? "jpg";
                        const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                        const { error: upErr } = await supabase.storage
                          .from("images")
                          .upload(path, file, { upsert: true, contentType: file.type });
                        if (upErr) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setForm(f => ({ ...f, image_url: ev.target?.result as string }));
                          reader.readAsDataURL(file);
                          alert("Image saved locally. To store permanently, create the 'images' bucket in Supabase Storage.");
                          return;
                        }
                        const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
                        setForm(f => ({ ...f, image_url: publicUrl }));
                      }}
                    />
                  </label>
                  {form.image_url && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                      className="p-1.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-all btn-bubble flex-shrink-0 mt-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-ink-light/70 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description…" rows={3}
                  className="w-full px-4 py-2.5 rounded-2xl border border-caramel/20 bg-cream-50/80 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none focus:border-caramel transition-all resize-none" />
              </div>
              <div className="flex gap-4">
                <FieldInput label="Sort Order" type="number" value={form.sort_order}
                  onChange={(v) => setForm(f => ({ ...f, sort_order: Math.max(1, Number(v)) }))} />
                <div>
                  <label className="block text-xs font-sans font-semibold text-ink-light/70 uppercase tracking-wider mb-1.5">Status</label>
                  <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                    className={cn("h-10 px-4 rounded-2xl border text-xs font-sans font-bold transition-all btn-bubble",
                      form.active ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-500")}>
                    {form.active ? "Active" : "Hidden"}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-2xl border border-caramel/20 text-ink font-sans font-semibold text-sm hover:bg-caramel/8 transition-all btn-bubble">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-caramel to-latte text-white font-sans font-bold text-sm shadow-button hover:shadow-button-hover hover:-translate-y-0.5 transition-all btn-bubble flex items-center justify-center gap-2">
                <Save className="w-3.5 h-3.5" /> {editing ? "Save" : "Create"}
              </button>
            </div>
          </div>
        )}

        <div className="glass rounded-3xl border border-caramel/15 overflow-hidden">
          <div className="md:hidden px-4 py-2.5 border-b border-caramel/10 bg-caramel/4">
            <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest">Categories</p>
          </div>
          <div className="hidden md:grid px-5 py-3 border-b border-caramel/10 bg-caramel/4 grid-cols-[28px_40px_1fr_80px_120px] gap-4 items-center">
            <div /><div />
            <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest">Name</p>
            <p className="text-[10px] font-sans font-bold text-ink-light/50 uppercase tracking-widest text-center">Products</p>
            <div />
          </div>
          <AnimatePresence mode="popLayout">
            {cats.map((cat, i) => (
              <motion.div key={cat.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.22 }}
                className="grid grid-cols-[28px_40px_1fr] md:grid-cols-[28px_40px_1fr_80px_120px] gap-3 md:gap-4 items-center px-4 md:px-5 py-3.5 hover:bg-caramel/4 transition-colors border-b border-caramel/8 last:border-0 group">
                {/* Sort */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-0.5 text-ink-light/30 hover:text-caramel disabled:opacity-20 transition-colors btn-bubble"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === cats.length - 1} className="p-0.5 text-ink-light/30 hover:text-caramel disabled:opacity-20 transition-colors btn-bubble"><ChevronDown className="w-3.5 h-3.5" /></button>
                </div>
                {/* Icon / Image */}
                <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-caramel/15">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-caramel/15 to-blush/10 flex items-center justify-center">
                      <Grid3X3 className="w-4 h-4 text-caramel" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-semibold text-ink-dark truncate">{cat.name}</p>
                    <span className={cn("flex-shrink-0 text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded-full border",
                      cat.active ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-400 border-red-200")}>
                      {cat.active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs text-ink-light/50 font-sans truncate">{cat.description || "—"}</p>
                  <div className="md:hidden flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs font-sans text-ink-light/60">
                      <Package className="w-3.5 h-3.5" />{cat.product_count}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setCats(p => p.map(c => c.id === cat.id ? { ...c, active: !c.active } : c))}
                        className={cn("px-2.5 py-1 rounded-xl text-[10px] font-sans font-bold border transition-all btn-bubble",
                          cat.active ? "bg-red-50 border-red-200 text-red-400 hover:bg-red-100" : "bg-green-50 border-green-200 text-green-600")}>
                        {cat.active ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => openEdit(cat)} className="p-1.5 rounded-xl border border-caramel/20 text-caramel hover:bg-caramel/10 transition-all btn-bubble"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDelId(cat.id)} className="p-1.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-all btn-bubble"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
                {/* Count */}
                <div className="hidden md:flex items-center justify-center gap-1 text-xs font-sans text-ink-light/60">
                  <Package className="w-3.5 h-3.5" />{cat.product_count}
                </div>
                {/* Actions */}
                <div className="hidden md:flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                  <button onClick={() => setCats(p => p.map(c => c.id === cat.id ? { ...c, active: !c.active } : c))}
                    className={cn("px-2.5 py-1 rounded-xl text-[10px] font-sans font-bold border transition-all btn-bubble",
                      cat.active ? "bg-red-50 border-red-200 text-red-400 hover:bg-red-100" : "bg-green-50 border-green-200 text-green-600")}>
                    {cat.active ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-xl border border-caramel/20 text-caramel hover:bg-caramel/10 transition-all btn-bubble"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDelId(cat.id)} className="p-1.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-all btn-bubble"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {cats.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <Grid3X3 className="w-8 h-8 text-caramel/30" />
              <p className="font-display text-base text-ink-dark">No categories yet</p>
              <button onClick={openNew} className="text-sm text-caramel font-sans font-semibold">Create your first →</button>
            </div>
          )}
        </div>
        <p className="text-xs text-ink-light/35 font-sans text-center mt-4">Reorder with arrows · Syncs to Supabase when connected</p>
      </main>

      {/* Delete confirm */}
      <AnimatePresence>
        {delId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-sm" onClick={() => setDelId(null)}>
            <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm glass rounded-3xl border border-red-200/60 shadow-card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-display text-base font-semibold text-ink-dark mb-1.5">Delete category?</h3>
              <p className="text-xs text-ink-light/60 font-sans mb-5">
                {cats.find(c => c.id === delId)?.product_count ?? 0} products will become uncategorised.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDelId(null)} className="flex-1 py-2.5 rounded-2xl border border-caramel/20 text-ink font-sans font-semibold text-sm btn-bubble">Cancel</button>
                <button onClick={() => { if(delId) handleDelete(delId); setDelId(null); }}
                  className="flex-1 py-2.5 rounded-2xl bg-red-400 text-white font-sans font-bold text-sm hover:bg-red-500 transition-all btn-bubble">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
