"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Skeleton } from "@/components/ui/Skeleton";
import LoadingWrapper from "@/components/ui/LoadingWrapper";
import { Scissors, X } from "lucide-react";

type CustomOrderRow = {
  id: string;
  linked_order_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  category: string;
  description: string;
  timeframe: string | null;
  price_min: number | null;
  price_max: number | null;
  quoted_price: number | null;
  pricing_status: string | null;
  created_at: string;
};

export default function AdminCustomOrdersPage() {
  const [rows, setRows] = useState<CustomOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/custom-orders", { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(body?.customOrders)) {
      setRows(body.customOrders as CustomOrderRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("cm_admin_logged_in")) {
      window.location.href = "/admin/login";
      return;
    }
    void load();
  }, []);

  const awaiting = rows.filter((r) => (r.pricing_status ?? "awaiting_quote") === "awaiting_quote");

  const submitQuote = async () => {
    if (!quoteId) return;
    const quotedPrice = Number(priceInput);
    if (!Number.isFinite(quotedPrice) || quotedPrice <= 0) {
      setMessage("Enter a valid price in PKR.");
      return;
    }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/custom-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: quoteId, action: "quote", quotedPrice }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage(String(body?.error ?? "Could not save quote."));
      return;
    }
    setMessage("Price set. Customer notified. Order moved to main orders list.");
    setQuoteId(null);
    setPriceInput("");
    void load();
  };

  const reject = async (id: string) => {
    if (!confirm("Reject this custom order request?")) return;
    await fetch("/api/admin/custom-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "reject" }),
    });
    void load();
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-dark flex items-center gap-2">
              <Scissors className="w-6 h-6 text-caramel" /> Custom order pricing
            </h1>
            <p className="text-sm text-ink-light/60 font-sans mt-1">
              Set a price before custom orders appear in the main queue with a total.
            </p>
          </div>
          <Link href="/admin/orders" className="text-sm font-semibold text-caramel hover:text-ink">
            ← All orders
          </Link>
        </div>

        {message && (
          <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2 font-sans">
            {message}
          </p>
        )}

        <p className="text-xs font-sans text-ink-light/60 mb-4">
          <strong className="text-caramel">{awaiting.length}</strong> awaiting quote
        </p>

        <LoadingWrapper loading={loading} skeleton={
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        }>
          {awaiting.length === 0 ? (
            <div className="glass rounded-3xl border border-caramel/15 py-16 text-center">
              <p className="font-display text-lg text-ink-dark">No custom orders waiting for a price</p>
            </div>
          ) : (
            <div className="space-y-4">
              {awaiting.map((row) => (
              <div key={row.id} className="glass rounded-2xl border border-caramel/15 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-sans font-semibold text-ink-dark">{row.customer_name}</p>
                    <p className="text-xs text-ink-light/60">{row.customer_phone}</p>
                    {row.customer_email && <p className="text-xs text-ink-light/55">{row.customer_email}</p>}
                  </div>
                  {row.linked_order_id && (
                    <Link
                      href={`/admin/orders`}
                      className="text-xs font-bold text-caramel bg-caramel/10 px-2 py-1 rounded-lg"
                    >
                      Order #{row.linked_order_id.slice(0, 6).toUpperCase()}
                    </Link>
                  )}
                </div>
                <p className="text-sm text-ink-dark font-semibold">{row.category}</p>
                <p className="text-xs text-ink-light/70 mt-1 line-clamp-3">{row.description}</p>
                {row.timeframe && <p className="text-[11px] text-ink-light/50 mt-1">Timeline: {row.timeframe}</p>}
                {(row.price_min || row.price_max) && (
                  <p className="text-[11px] text-caramel mt-1">
                    Customer budget: PKR {row.price_min?.toLocaleString() ?? "?"} – {row.price_max?.toLocaleString() ?? "?"}
                  </p>
                )}

                {quoteId === row.id ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="Your quoted price (PKR)"
                      className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border border-caramel/25 text-sm"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={submitQuote}
                      className="px-4 py-2 rounded-xl bg-caramel text-white text-sm font-semibold disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Confirm price"}
                    </button>
                    <button type="button" onClick={() => setQuoteId(null)} className="p-2 rounded-xl hover:bg-caramel/10">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuoteId(row.id);
                        setPriceInput("");
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-caramel to-rose text-white text-sm font-semibold"
                    >
                      Set price
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(row.id)}
                      className="px-4 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </LoadingWrapper>
      </main>
    </div>
  );
}
