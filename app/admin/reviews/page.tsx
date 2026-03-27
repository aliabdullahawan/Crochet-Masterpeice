"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { EyeOff, Eye, Trash2, RefreshCw, Star, ExternalLink } from "lucide-react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { cn } from "@/lib/utils";

type ReviewRow = {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  comment: string;
  admin_reply?: string | null;
  created_at: string;
  is_hidden: boolean;
};

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews?includeHidden=true", { cache: "no-store" });
      const body = await res.json();
      if (res.ok && Array.isArray(body?.reviews)) {
        setRows(body.reviews as ReviewRow[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const hideReview = async (reviewId: string) => {
    setProcessingId(reviewId);
    try {
      await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, hide: true }),
      });
      await loadReviews();
    } finally {
      setProcessingId(null);
    }
  };

  const unhideReview = async (reviewId: string) => {
    setProcessingId(reviewId);
    try {
      await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, hide: false }),
      });
      await loadReviews();
    } finally {
      setProcessingId(null);
    }
  };

  const deleteReview = async (reviewId: string) => {
    const ok = window.confirm("Delete this review permanently?");
    if (!ok) return;

    setProcessingId(reviewId);
    try {
      await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      await loadReviews();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminNavbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-dark">Review Moderation</h1>
            <p className="text-sm text-ink-light/55 font-sans">Hide or delete any review</p>
          </div>
          <button
            onClick={() => { void loadReviews(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-caramel/25 text-caramel text-sm font-sans font-semibold hover:bg-caramel/10 transition-all btn-bubble"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="glass rounded-3xl border border-caramel/15 overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-caramel border-t-transparent animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-ink-light/55 font-sans">No reviews found.</div>
          ) : (
            <div className="divide-y divide-caramel/10">
              {rows.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("p-4 sm:p-5 cursor-pointer", r.is_hidden && "opacity-55")}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("button, a")) return;
                    window.location.href = `/user/shop/${r.product_id}?review=${r.id}#review-${r.id}`;
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-sans font-semibold text-ink-dark">{r.user_name}</p>
                        <span className="text-xs text-ink-light/45">on</span>
                        <Link href={`/user/shop/${r.product_id}`} className="text-sm text-caramel hover:text-ink transition-colors font-sans font-semibold inline-flex items-center gap-1">
                          {r.product_name}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        {r.is_hidden && (
                          <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">Hidden</span>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={cn("w-3 h-3", i <= r.rating ? "fill-caramel text-caramel" : "text-caramel/20")} />
                        ))}
                        <span className="ml-2 text-[11px] text-ink-light/50 font-sans">
                          {new Date(r.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-ink/80 font-sans">{r.comment}</p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {!r.is_hidden ? (
                        <button
                          disabled={processingId === r.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void hideReview(r.id);
                          }}
                          className="px-3 py-2 rounded-xl border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-sans font-bold transition-all btn-bubble disabled:opacity-60"
                        >
                          <span className="flex items-center gap-1"><EyeOff className="w-3.5 h-3.5" /> Hide</span>
                        </button>
                      ) : (
                        <button
                          disabled={processingId === r.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void unhideReview(r.id);
                          }}
                          className="px-3 py-2 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-sans font-bold transition-all btn-bubble disabled:opacity-60"
                        >
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Unhide</span>
                        </button>
                      )}
                      <button
                        disabled={processingId === r.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteReview(r.id);
                        }}
                        className="px-3 py-2 rounded-xl border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 text-xs font-sans font-bold transition-all btn-bubble disabled:opacity-60"
                      >
                        <span className="flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
