"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Instagram, Facebook, Users, MessageCircle, TrendingUp, Eye, ShoppingBag, Shield, Mail, Check, Edit2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { supabase } from "@/lib/supabase";

function useAdminAuth() {
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in"))
      window.location.href = "/admin/login";
  }, []);
}

const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.2 8.2 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.003-1.374l-.36-.213-3.74.981 1-3.648-.236-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
  </svg>
);

export default function AdminProfilePage() {
  useAdminAuth();
  const [adminName, setAdminName] = useState("Crochet Masterpiece");
  const [statsLive, setStatsLive] = useState({ orders: 0, products: 0, custom: 0 });
  useEffect(() => {
    // Fetch real stats from Supabase
    Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("custom_orders").select("id", { count: "exact", head: true }),
    ]).then(([orders, products, custom]) => {
      setStatsLive({
        orders:   orders.count  ?? 0,
        products: products.count ?? 0,
        custom:   custom.count  ?? 0,
      });
    }).catch(() => {});
  }, []);
  const [adminEmail, setAdminEmail] = useState("");
  const [counts, setCounts] = useState({ instagram: 5800, facebook: 3100, tiktok: 9200, whatsapp: 2400 });
  const [registeredUsers, setRegisteredUsers] = useState(0);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAdminName(localStorage.getItem("cm_admin_name") ?? "Crochet Masterpiece");
      setAdminEmail(localStorage.getItem("cm_admin_email") ?? "");
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: settings } = await supabase.from("site_settings").select("key,value")
        .in("key", ["instagram_count_manual","facebook_count_manual","tiktok_count_manual","whatsapp_count_manual"]);
      if (settings?.length) {
        const map = Object.fromEntries(settings.map((s: {key:string;value:string}) => [s.key.replace("_count_manual",""), Number(s.value)]));
        setCounts(c => ({ ...c, ...map }));
      }
      const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
      setRegisteredUsers(count ?? 0);
    } catch (e) { console.error(e); }
  };

  const startEdit = (key: string) => { setEditingKey(key); };

  const saveCount = async (key: string) => {
    const raw = counts[key as keyof typeof counts];
    const val = Math.max(0, Number(raw) || 0);
    try {
      const response = await fetch("/api/admin/social-counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: key, value: val }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Failed to save");

      setCounts(c => ({ ...c, [key]: val }));
      setEditingKey(null);
      setSaved(key);
      setSaveMessage({ type: "success", text: `${key} followers saved.` });
      setTimeout(() => setSaved(null), 2000);
      setTimeout(() => setSaveMessage(null), 2500);
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Could not save follower count" });
    }
  };

  const saveAllCounts = async () => {
    setSavingAll(true);
    setSaveMessage(null);
    const keys = ["instagram", "facebook", "tiktok", "whatsapp"] as const;
    try {
      await Promise.all(keys.map(async (key) => {
        const value = Math.max(0, Number(counts[key]) || 0);
        const response = await fetch("/api/admin/social-counts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: key, value }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body?.error || `Failed to save ${key}`);
      }));
      setSaveMessage({ type: "success", text: "All follower counts saved successfully." });
      setEditingKey(null);
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save social counts" });
    } finally {
      setSavingAll(false);
    }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0) + registeredUsers;

  const platforms = [
    { key: "instagram", label: "Instagram", icon: <Instagram className="w-4 h-4" />, color: "bg-gradient-to-br from-[#E1306C] to-[#833AB4]", bar: "from-[#E1306C] to-[#833AB4]" },
    { key: "facebook",  label: "Facebook",  icon: <Facebook className="w-4 h-4" />,  color: "bg-[#1877F2]", bar: "from-[#1877F2] to-blue-400" },
    { key: "tiktok",    label: "TikTok",    icon: <TikTokIcon />,                    color: "bg-ink-dark", bar: "from-ink-dark to-ink/60" },
    { key: "whatsapp",  label: "WhatsApp",  icon: <WhatsAppIcon />,                  color: "bg-[#25D366]", bar: "from-[#25D366] to-green-400" },
  ];

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Profile header */}
        <div className="glass rounded-3xl border border-caramel/15 p-6 flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-caramel/20 shadow-card">
              <img
                src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(adminEmail || "admin")}&backgroundColor=ffd5dc,ffdfbf,c0aede&radius=50`}
                alt={adminName} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-gradient-to-br from-caramel to-latte flex items-center justify-center shadow-button">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-semibold text-ink-dark">{adminName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-3.5 h-3.5 text-ink-light/40" />
              <p className="text-sm text-ink-light/55 font-sans truncate">{adminEmail}</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-sans font-bold text-white bg-gradient-to-r from-caramel to-latte px-2.5 py-1 rounded-lg tracking-wider uppercase shadow-button">Admin</span>
              <span className="text-[10px] font-sans text-ink-light/40">Full access · Crochet Masterpiece</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="font-display text-3xl font-semibold text-caramel">{total.toLocaleString()}</p>
            <p className="text-xs text-ink-light/50 font-sans">total community</p>
          </div>
        </div>

        {/* Reach bars */}
        <div className="glass rounded-3xl border border-caramel/15 p-6">
          <h2 className="font-display text-base font-semibold text-ink-dark mb-5">Community Reach</h2>
          <div className="space-y-3.5">
            {[...platforms.map(p => ({ ...p, value: counts[p.key as keyof typeof counts] })),
              { key: "users", label: "Site Users", value: registeredUsers, bar: "from-caramel to-rose" }
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-xs font-sans text-ink-light/60 w-28 flex-shrink-0">{item.label}</span>
                <div className="flex-1 h-2.5 bg-blush/15 rounded-full overflow-hidden">
                  <motion.div className={cn("h-full rounded-full bg-gradient-to-r", item.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: total > 0 ? `${Math.min(100, (item.value / total) * 100)}%` : "0%" }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
                </div>
                <span className="text-xs font-sans font-bold text-ink-dark w-16 text-right">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social count management */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-ink-dark">Update Follower Counts</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-ink-light/40 font-sans">Click edit icon to update manually</p>
              <button
                onClick={saveAllCounts}
                disabled={savingAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-caramel/15 border border-caramel/25 text-caramel text-xs font-bold hover:bg-caramel/25 transition-all disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" /> {savingAll ? "Saving..." : "Save All"}
              </button>
            </div>
          </div>
          {saveMessage && (
            <div className={cn(
              "mb-4 rounded-xl border px-3 py-2 text-xs font-sans flex items-center gap-2",
              saveMessage.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            )}>
              {saveMessage.type === "success" ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{saveMessage.text}</span>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((p) => {
              const count = counts[p.key as keyof typeof counts];
              const isEditing = editingKey === p.key;
              const isSaved = saved === p.key;
              return (
                <div key={p.key} className="glass rounded-2xl border border-caramel/15 p-5 hover:shadow-card transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white", p.color)}>{p.icon}</div>
                    <div className="flex items-center gap-1.5">
                      {isSaved && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-lg border border-green-200">
                          <Check className="w-2.5 h-2.5" /> Saved
                        </motion.span>
                      )}
                      <button onClick={() => isEditing ? setEditingKey(null) : startEdit(p.key)}
                        className="p-1.5 rounded-xl hover:bg-caramel/10 text-ink-light/50 hover:text-caramel transition-all btn-bubble">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="font-display text-2xl font-semibold text-ink-dark">{count.toLocaleString()}</p>
                  <p className="text-xs text-ink-light/55 font-sans mt-0.5">{p.label} followers</p>
                  {isEditing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={String(counts[p.key as keyof typeof counts])}
                        onChange={(e) => {
                          const next = Math.max(0, Number(e.target.value) || 0);
                          setCounts((prev) => ({ ...prev, [p.key]: next }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCount(p.key);
                        }}
                        className="flex-1 px-2.5 py-2 rounded-xl border border-caramel/20 bg-cream-50/80 text-sm font-sans text-ink outline-none focus:border-caramel transition-all" />
                      <button onClick={() => saveCount(p.key)}
                        className="px-3 py-2 rounded-xl bg-caramel/15 border border-caramel/25 text-caramel text-xs font-bold hover:bg-caramel/25 transition-all btn-bubble">
                        <span className="flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Save</span>
                      </button>
                    </motion.div>
                  )}
                  <p className="text-[10px] text-ink-light/30 font-sans mt-2">Manual · auto-sync when API configured</p>
                </div>
              );
            })}
          </div>

          {/* Site users live card */}
          <div className="mt-4 glass rounded-2xl border border-green-200/50 bg-green-50/30 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-caramel/15 to-blush/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-caramel" />
            </div>
            <div className="flex-1">
              <p className="font-display text-xl font-semibold text-ink-dark">{registeredUsers.toLocaleString()}</p>
              <p className="text-xs text-ink-light/55 font-sans">Registered site users · live from Supabase</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-sans font-bold bg-green-100 px-3 py-1.5 rounded-xl border border-green-200">
              <TrendingUp className="w-3 h-3" /> Live count
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <ShoppingBag className="w-5 h-5 text-caramel" />,     label: "Total Orders",    value: String(statsLive.orders),   bg: "admin-card-caramel" },
            { icon: <Eye className="w-5 h-5 text-mauve" />,               label: "Products Live",   value: String(statsLive.products), bg: "admin-card-mauve" },
            { icon: <MessageCircle className="w-5 h-5 text-caramel" />,   label: "Custom Requests", value: String(statsLive.custom),   bg: "admin-card-blush" },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-2xl border p-4 glass", s.bg)}>
              <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center mb-3">{s.icon}</div>
              <p className="font-display text-2xl font-semibold text-ink-dark">{s.value}</p>
              <p className="text-xs text-ink-light/55 font-sans">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Security note */}
        <div className="glass rounded-2xl border border-caramel/15 p-5">
          <h3 className="font-display text-sm font-semibold text-ink-dark mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-caramel" /> Account Security
          </h3>
          <p className="text-xs text-ink-light/55 font-sans">
            Admin credentials are stored in your Supabase <code className="bg-caramel/10 px-1.5 py-0.5 rounded text-caramel text-[11px]">admins</code> table.
            To change the password, update the <code className="bg-caramel/10 px-1.5 py-0.5 rounded text-caramel text-[11px]">password_hash</code> field directly in Supabase.
          </p>
        </div>
      </main>
    </div>
  );
}
