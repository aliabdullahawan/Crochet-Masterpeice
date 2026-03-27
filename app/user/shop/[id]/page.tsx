"use client";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ShoppingCart, Star, ChevronLeft, ChevronRight,
  Plus, Minus, Tag, MessageCircle, Package, ArrowRight,
  X, Check, ShoppingBag, Loader2, Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/lib/ShopContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getHiddenReviewIdSet, isReviewHiddenByModeration } from "@/lib/reviewModeration";

/* =============================================
   TYPES
   ============================================= */
interface Review {
  id: string;
  product_id?: string;
  user_id?: string | null;
  user_name: string;
  avatar_emoji: string;
  rating: number;
  comment: string;
  date: string;
  created_at?: string;
  admin_reply?: string;
}

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category_id?: string;
  category_name: string;
  discount_percent?: number;
  discount_active?: boolean;
  discount_end_date?: string;
  average_rating: number;
  review_count: number;
  is_featured?: boolean;
  tags?: string[];
  images: string[];   // base64 or placeholder labels
  stock_quantity: number;
}

/* =============================================
   MOCK — replace with Supabase
   ============================================= */
// Product loaded from Supabase — empty placeholder (page fetches by ID)
const MOCK_PRODUCT: ProductDetail | null = null;

const MOCK_REVIEWS: Review[] = []; // Loaded from Supabase reviews table

/* =============================================
   IMAGE GALLERY
   ============================================= */
const ImageGallery = ({ images, productName }: { images: string[]; productName: string }) => {
  const [active, setActive] = useState(0);
  const safeImages = images.length ? images : ["/images/crochet-1.jpg"];

  const toImageSrc = (value: string) => {
    if (!value) return "/images/crochet-1.jpg";
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/") || value.startsWith("data:")) {
      return value;
    }
    return `data:image/jpeg;base64,${value}`;
  };

  useEffect(() => {
    if (active >= safeImages.length) {
      setActive(0);
    }
  }, [active, safeImages.length]);

  const activeSrc = toImageSrc(safeImages[active]);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-cream-50 to-blush/15 border border-blush/20 shadow-card">
        <AnimatePresence mode="wait">
          <motion.div key={activeSrc}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0">
            <img
              src={activeSrc}
              alt={`${productName} image ${active + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/crochet-1.jpg";
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Arrow controls */}
        <button onClick={() => setActive((a) => (a - 1 + safeImages.length) % safeImages.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl glass border border-blush/25 flex items-center justify-center text-ink hover:bg-blush/20 transition-all btn-bubble shadow-soft">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={() => setActive((a) => (a + 1) % safeImages.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl glass border border-blush/25 flex items-center justify-center text-ink hover:bg-blush/20 transition-all btn-bubble shadow-soft">
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {safeImages.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={cn("rounded-full transition-all duration-300",
                i === active ? "w-5 h-2 bg-caramel" : "w-2 h-2 bg-caramel/25 hover:bg-caramel/50")} />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2">
        {safeImages.map((img, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={cn("aspect-square rounded-2xl overflow-hidden",
              "bg-gradient-to-br from-cream-50 to-blush/10 border transition-all duration-200",
              i === active ? "border-caramel/50 shadow-button scale-[0.97]" : "border-blush/15 hover:border-blush/40 hover:scale-[0.98]")}>
            <img
              src={toImageSrc(img)}
              alt={`${productName} thumbnail ${i + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/crochet-1.jpg";
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

/* =============================================
   ORDER POPUP
   ============================================= */
const OrderPopup = ({
  product, quantity, coupon, onClose,
}: {
  product: ProductDetail;
  quantity: number;
  coupon: string;
  onClose: () => void;
}) => {
  const { isLoggedIn } = useAuth();
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryMsg, setQueryMsg] = useState("");
  const total = product.price * quantity;
  const whatsappMsg = encodeURIComponent(
    `🧶 *New Order — Crochet Masterpiece*\n\n` +
    `📦 *Product:* ${product.name}\n` +
    `🔢 *Quantity:* ${quantity}\n` +
    `💰 *Price:* PKR ${total.toLocaleString()}\n` +
    (coupon ? `🎟 *Coupon:* ${coupon}\n` : "") +
    `\n_Sent from Crochet Masterpiece website_ ✨`
  );
  const waNumber = "923159202186"; // replace from env
  const whatsappUrl = `https://wa.me/${waNumber}?text=${whatsappMsg}`;

  const formatOrderId = (id: string) => `#${id.slice(0, 6).toUpperCase()}`;

  const createOrderAndNotify = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const activeUser = authData.user;
    if (!activeUser) throw new Error("Login required");

    const res = await fetch("/api/orders/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: activeUser.id,
        customerName: activeUser.user_metadata?.full_name ?? activeUser.user_metadata?.name ?? activeUser.email ?? "User",
        customerEmail: activeUser.email ?? "",
        customerPhone: activeUser.user_metadata?.phone ?? "",
        source: "website",
        items: [
          {
            productId: product.id,
            name: product.name,
            quantity,
            unitPrice: product.price,
          },
        ],
        totalAmount: total,
        discountAmount: 0,
        couponCode: coupon || null,
        note: "Customer sent a website order query and continued on WhatsApp.",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Order create failed");
    }

    if (typeof data?.orderId === "string") {
      const orderId = data.orderId;
      return formatOrderId(orderId);
    }
    return null;
  };

  const sendQueryAndContinueWhatsApp = async () => {
    if (!isLoggedIn) {
      setQueryMsg("Please log in to send a query.");
      return;
    }

    setQueryLoading(true);
    setQueryMsg("");
    try {
      await createOrderAndNotify();
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setQueryMsg("Query sent and WhatsApp opened.");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send query right now. Please try again.";
      setQueryMsg(message);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleWhatsAppOnly = () => {
    if (!isLoggedIn) {
      window.alert("No query will be sent. Send Query is available only after login.");
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const alsoSendQuery = window.confirm(
      "No query will be sent to the website if you continue with WhatsApp only. If you want admin to see your order in site, click OK to send query now."
    );

    if (alsoSendQuery) {
      void sendQueryAndContinueWhatsApp();
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/50 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm glass rounded-3xl border border-blush/30 shadow-card p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-blush/10 text-ink-light transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blush/30 to-mauve/20 flex items-center justify-center text-3xl mx-auto mb-3">🛒</div>
          <h3 className="font-display text-lg font-semibold text-ink-dark">How would you like to order?</h3>
          <p className="text-xs text-ink-light/60 font-sans mt-1">{product.name} × {quantity}</p>
        </div>

        <div className="space-y-3">
          {/* Website query */}
          {isLoggedIn ? (
            <button
              onClick={() => { void sendQueryAndContinueWhatsApp(); }}
              disabled={queryLoading}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-blush/25",
                "bg-gradient-to-r from-blush/10 to-mauve/10 text-ink",
                "hover:border-caramel/40 hover:bg-blush/15 transition-all duration-200 btn-bubble text-left disabled:opacity-70"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blush to-mauve flex items-center justify-center text-white flex-shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-sans font-semibold text-ink-dark">Send Query to Admin</p>
                <p className="text-[11px] text-ink-light/60">Confirm order, then WhatsApp opens automatically</p>
              </div>
            </button>
          ) : (
            <div className="w-full rounded-2xl border border-caramel/20 bg-cream-50/70 px-4 py-3 text-left">
              <p className="text-sm font-sans font-semibold text-ink-dark">Send Query to Admin</p>
              <p className="text-[11px] text-ink-light/60">Unavailable for guest users. Please log in first.</p>
            </div>
          )}
          {queryMsg && (
            <p className={cn("text-xs font-sans", queryMsg.includes("sent") ? "text-green-600" : "text-red-500")}>{queryMsg}</p>
          )}

          {/* WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppOnly}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl",
              "bg-[#25D366] text-white",
              "hover:brightness-110 transition-all duration-200 btn-bubble shadow-button"
            )}>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.799 9.799 0 0 1-5.003-1.374l-.358-.213-3.742.981.999-3.648-.235-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-sans font-bold">Order via WhatsApp</p>
              <p className="text-[11px] text-white/70">Message opens pre-filled ✓</p>
            </div>
          </button>
        </div>

        {coupon && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-caramel/10 border border-caramel/20">
            <Tag className="w-3.5 h-3.5 text-caramel" />
            <span className="text-xs font-sans text-caramel font-semibold">Coupon <strong>{coupon}</strong> will be included in the message</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* =============================================
   MORE PRODUCTS — replace with Supabase query
   ============================================= */
const MORE_PRODUCTS: {id:string;name:string;price:number;original?:number;category:string;rating:number;initial:string;gradient:string}[] = []; // Replace: fetch related products from Supabase

/* =============================================
   ADD-TO-CART BUTTON with success flash
   ============================================= */
const AddToCartButton = ({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) => {
  const [added, setAdded] = useState(false);
  const handle = () => {
    if (disabled) return;
    onClick();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <button onClick={handle} disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-sans font-semibold transition-all duration-300 btn-bubble",
        disabled && "opacity-60 cursor-not-allowed",
        added
          ? "border-green-300 bg-green-50 text-green-700 shadow-[0_0_0_3px_rgba(134,239,172,0.2)]"
          : "border-caramel/25 bg-white/70 text-ink hover:border-blush/50 hover:bg-blush/5"
      )}>
      {disabled ? <><Package className="w-4 h-4" /> Out of Stock</> : added ? <><Check className="w-4 h-4" /> Added!</> : <><ShoppingCart className="w-4 h-4 text-caramel" /> Add to Cart</>}
    </button>
  );
};

/* =============================================
   MAIN PRODUCT DETAIL PAGE
   ============================================= */
export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, displayName } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSort, setReviewSort] = useState<"newest" | "lowest" | "highest">("newest");
  const [showMyReviewsOnly, setShowMyReviewsOnly] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const { addToCart, addToWishlist, removeFromWishlist, isWishlisted, setAppliedCoupon, cartItems } = useShop();

  useEffect(() => {
    const id = typeof params.id === "string" ? params.id : params.id?.[0];
    if (!id) { setPageLoading(false); return; }

    // Fetch product (primary source: product_listing, fallback: products)
    const loadProduct = async () => {
      const { data, error } = await supabase
        .from("product_listing")
        .select("*")
        .eq("id", id)
        .single();

      if (data && !error) {
        const listing = data as {
          id: string;
          name?: string | null;
          description?: string | null;
          price?: number | null;
          original_price?: number | null;
          category_id?: string | null;
          category_name?: string | null;
          active_discount_percent?: number | null;
          discount_active?: boolean | null;
          discount_end_date?: string | null;
          average_rating?: number | null;
          review_count?: number | null;
          is_featured?: boolean | null;
          tags?: string[] | null;
          stock_quantity?: number | null;
          image_url?: string | null;
          images?: string[] | null;
        };

        setProduct({
          id: listing.id,
          name: listing.name ?? "Product",
          description: listing.description ?? "Handmade crochet product.",
          price: listing.price ?? 0,
          original_price: listing.original_price ?? undefined,
          category_id: listing.category_id ?? undefined,
          category_name: (listing.category_name ?? "").trim() || "Uncategorised",
          discount_percent: listing.active_discount_percent ?? undefined,
          discount_active: listing.discount_active ?? false,
          discount_end_date: listing.discount_end_date ?? undefined,
          average_rating: listing.average_rating ?? 0,
          review_count: listing.review_count ?? 0,
          is_featured: listing.is_featured ?? false,
          tags: listing.tags ?? [],
          images: listing.images?.length ? listing.images : (listing.image_url ? [listing.image_url] : []),
          stock_quantity: listing.stock_quantity ?? 0,
        } as ProductDetail);
        setPageLoading(false);
        return;
      }

      const { data: productRow } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id)
        .single();

      if (productRow) {
        const row = productRow as {
          id: string;
          name?: string | null;
          description?: string | null;
          price?: number | null;
          original_price?: number | null;
          category_id?: string | null;
          average_rating?: number | null;
          review_count?: number | null;
          is_featured?: boolean | null;
          tags?: string[] | null;
          stock_quantity?: number | null;
          discount_percent?: number | null;
          active_discount_percent?: number | null;
          discount_active?: boolean | null;
          discount_end_date?: string | null;
          image_url?: string | null;
          images?: string[] | null;
          category_name?: string | null;
          categories?: { name?: string | null } | null;
        };

        const mapped: ProductDetail = {
          id: row.id,
          name: row.name ?? "Product",
          description: row.description ?? "Handmade crochet product.",
          price: row.price ?? 0,
          original_price: row.original_price ?? undefined,
          category_id: row.category_id ?? undefined,
          category_name: row.category_name ?? row.categories?.name ?? "Uncategorised",
          discount_percent: row.discount_percent ?? row.active_discount_percent ?? undefined,
          discount_active: row.discount_active ?? false,
          discount_end_date: row.discount_end_date ?? undefined,
          average_rating: row.average_rating ?? 0,
          review_count: row.review_count ?? 0,
          is_featured: row.is_featured ?? false,
          tags: row.tags ?? [],
          images: row.images?.length ? row.images : (row.image_url ? [row.image_url] : []),
          stock_quantity: row.stock_quantity ?? 0,
        };

        setProduct(mapped);
      }

      setPageLoading(false);
    };

    void loadProduct();

    // Fetch reviews (works with and without reviews.admin_reply column)
    const loadReviews = async () => {
      const hiddenReviewIds = await getHiddenReviewIdSet();

      type ReviewRow = {
        id: string;
        product_id: string;
        user_id?: string | null;
        user_name: string;
        rating: number;
        comment: string;
        admin_reply?: string | null;
        created_at: string;
      };

      let dataWithModeration: ReviewRow[] | null = null;

      const withModeration: { data: ReviewRow[] | null; error: { message: string } | null } = await supabase
        .from("reviews")
        .select("id, product_id, user_id, user_name, rating, comment, admin_reply, created_at")
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      if (!withModeration.error) {
        dataWithModeration = withModeration.data ?? [];
      } else {
        const legacy: {
          data: Array<Omit<ReviewRow, "admin_reply">> | null;
          error: { message: string } | null;
        } = await supabase
          .from("reviews")
          .select("id, product_id, user_id, user_name, rating, comment, created_at")
          .eq("product_id", id)
          .order("created_at", { ascending: false });

        if (!legacy.error) {
          dataWithModeration = (legacy.data ?? []).map((r) => ({
            ...(r as {
              id: string;
              product_id: string;
              user_id?: string | null;
              user_name: string;
              rating: number;
              comment: string;
              created_at: string;
            }),
            admin_reply: null,
          }));
        }
      }

      if (!dataWithModeration) return;

      const mappedReviews = dataWithModeration
        .map((r) => ({
          id: r.id,
          product_id: r.product_id,
          user_id: r.user_id ?? null,
          user_name: r.user_name,
          avatar_emoji: "🌸",
          rating: r.rating,
          comment: r.comment,
          admin_reply: r.admin_reply ?? undefined,
          created_at: r.created_at,
          date: new Date(r.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }),
        }))
        .filter((r) => !isReviewHiddenByModeration(r.id, r.admin_reply, hiddenReviewIds));

      setReviews(mappedReviews);

      const count = mappedReviews.length;
      const sum = mappedReviews.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;

      setProduct((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          average_rating: avg,
          review_count: count,
        };
      });
    };

    void loadReviews();
  }, [params.id]);

  useEffect(() => {
    const mineOnly = searchParams.get("mine") === "1";
    setShowMyReviewsOnly(mineOnly);
  }, [searchParams]);

  useEffect(() => {
    const targetReviewId = searchParams.get("review");
    if (!targetReviewId || reviews.length === 0) return;

    const target = document.getElementById(`review-${targetReviewId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [searchParams, reviews]);

  // Loading state
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-caramel border-t-transparent animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!product) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blush/30 to-mauve/20 flex items-center justify-center">
            <Package className="w-7 h-7 text-caramel/50" />
          </div>
          <p className="font-display text-xl text-ink-dark">Product not found</p>
          <p className="text-sm text-ink-light/55 font-sans">This product may have been removed or doesn&apos;t exist.</p>
          <Link href="/user/shop" className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-caramel to-rose text-white text-sm font-sans font-bold shadow-button btn-bubble">
            Browse shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Keep hook order stable: compute wishlist status only after product exists.
  const wishlisted_ctx = isWishlisted(product.id);
  const inCartQty = cartItems.find((i) => i.productId === product.id)?.quantity ?? 0;
  const remainingStock = Math.max(0, product.stock_quantity - inCartQty);
  const outOfStock = product.stock_quantity <= 0;

  const savings = product.original_price ? product.original_price - product.price : 0;

  const handleCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setCouponApplied(false);
      setCouponMessage("Enter a coupon code first.");
      return;
    }

    setCouponLoading(true);
    setCouponApplied(false);

    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          productId: product.id,
          categoryId: product.category_id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponApplied(false);
        setCouponMessage(data.message ?? "Invalid coupon code.");
        return;
      }

      if (remainingStock <= 0) {
        setCouponApplied(false);
        setCouponMessage("This product is out of stock.");
        return;
      }

      setAppliedCoupon({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        appliesTo: data.appliesTo,
        targetId: data.targetId ?? null,
      });

      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        category: product.category_name,
        category_id: product.category_id,
        emoji: "",
      }, Math.min(quantity, remainingStock));

      setCouponApplied(true);
      setCouponMessage(`${data.message ?? "Coupon applied."} Added to cart.`);
    } catch {
      setCouponApplied(false);
      setCouponMessage("Could not validate coupon right now. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!product) return;

    if (!isLoggedIn || !user) {
      setReviewMessage("Please log in to submit your review.");
      return;
    }

    const comment = reviewText.trim();
    if (!comment) {
      setReviewMessage("Please write a short comment before submitting.");
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage("");

    try {
      const reviewerName =
        displayName ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";

      type ReviewInsertPayload = {
        product_id: string;
        user_id: string;
        user_name: string;
        rating: number;
        comment: string;
      };

      type ReviewInsertResult = {
        id: string;
        user_name: string;
        rating: number;
        comment: string;
        created_at: string;
      };

      const reviewPayload: ReviewInsertPayload = {
        product_id: product.id,
        user_id: user.id,
        user_name: reviewerName,
        rating: reviewRating,
        comment,
      };

      const { data: inserted, error: insertError }: {
        data: ReviewInsertResult | null;
        error: { message: string } | null;
      } = await supabase
        .from("reviews")
        .insert(reviewPayload as unknown as never)
        .select("id, user_name, rating, comment, created_at")
        .single();

      if (insertError) {
        throw insertError;
      }

      if (inserted) {
        setReviews((prev) => [
          {
            id: inserted.id,
            product_id: product.id,
            user_id: user.id,
            user_name: inserted.user_name,
            avatar_emoji: "🌸",
            rating: inserted.rating,
            comment: inserted.comment,
            created_at: inserted.created_at,
            date: new Date(inserted.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }),
          },
          ...prev,
        ]);
      }

      const { data: updatedProduct }: {
        data: { average_rating: number | null; review_count: number | null } | null;
      } = await supabase
        .from("products")
        .select("average_rating, review_count")
        .eq("id", product.id)
        .maybeSingle();

      if (updatedProduct) {
        setProduct((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            average_rating: updatedProduct.average_rating ?? prev.average_rating,
            review_count: updatedProduct.review_count ?? prev.review_count,
          };
        });
      }

      setReviewText("");
      setReviewRating(5);
      setReviewMessage("Review submitted successfully.");
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : "Could not submit review right now.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    const ok = window.confirm("Delete this review?");
    if (!ok) return;

    setDeletingReviewId(reviewId);
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;

      setReviews((prev) => {
        const nextReviews = prev.filter((r) => r.id !== reviewId);
        const count = nextReviews.length;
        const sum = nextReviews.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
        const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;

        setProduct((existing) => {
          if (!existing) return existing;
          return { ...existing, average_rating: avg, review_count: count };
        });

        return nextReviews;
      });
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : "Could not delete review.");
    } finally {
      setDeletingReviewId(null);
    }
  };

  const displayedReviews = reviews
    .filter((r) => !showMyReviewsOnly || (user && r.user_id === user.id))
    .sort((a, b) => {
      if (reviewSort === "lowest") return a.rating - b.rating;
      if (reviewSort === "highest") return b.rating - a.rating;
      const at = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bt - at;
    });

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-sans text-ink-light/50 mb-8">
          <Link href="/" className="hover:text-caramel transition-colors">Home</Link>
          <span>/</span>
          <Link href="/user/shop" className="hover:text-caramel transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-caramel font-semibold truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* ── Gallery ── */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <ImageGallery images={product.images} productName={product.name} />
          </motion.div>

          {/* ── Info ── */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5">

            {/* Category + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-sans font-semibold text-caramel bg-caramel/10 px-3 py-1 rounded-full border border-caramel/20">
                {product.category_name}
              </span>
              {product.is_featured && (
                <span className="text-xs font-sans font-semibold text-white bg-gradient-to-r from-mauve to-blush px-3 py-1 rounded-full">
                  ✦ Featured
                </span>
              )}
              {product.discount_active && product.discount_percent && (
                <span className="text-xs font-sans font-bold text-white bg-gradient-to-r from-caramel to-rose px-3 py-1 rounded-full shadow-button">
                  -{product.discount_percent}% OFF
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-dark leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((i) => <Star key={i} className={cn("w-4 h-4", i <= Math.round(product.average_rating) ? "fill-caramel text-caramel" : "text-caramel/15")} />)}
              </div>
              <span className="text-sm font-sans font-semibold text-ink">{product.average_rating}</span>
              <a href="#reviews" className="text-sm text-caramel hover:text-ink transition-colors font-sans">({product.review_count} reviews)</a>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="font-display text-3xl font-semibold text-ink-dark">PKR {product.price.toLocaleString()}</span>
              {product.original_price && product.original_price > product.price && (
                <div className="flex flex-col">
                  <span className="text-sm text-ink-light/40 line-through">PKR {product.original_price.toLocaleString()}</span>
                  <span className="text-xs text-caramel font-sans font-semibold">Save PKR {savings.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Discount end date */}
            {product.discount_active && product.discount_end_date && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-caramel/8 border border-caramel/20">
                <Tag className="w-3.5 h-3.5 text-caramel" />
                <span className="text-xs font-sans text-caramel">Sale ends <strong>{new Date(product.discount_end_date).toLocaleDateString("en-PK", { month: "long", day: "numeric" })}</strong></span>
              </div>
            )}

            {/* Tags */}
            {product.tags && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((t) => (
                  <span key={t} className="text-xs bg-blush/12 text-caramel font-sans font-semibold px-2.5 py-1 rounded-full border border-blush/20">#{t}</span>
                ))}
              </div>
            )}

            {/* Short description */}
            <p className="text-sm text-ink-light/75 font-sans leading-relaxed">{product.description.split("\n\n")[0]}</p>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-sans font-semibold text-ink-light/60 uppercase tracking-wider">Quantity</span>
              <div className="flex items-center gap-2 rounded-xl border border-caramel/20 bg-white/80">
                <button disabled={outOfStock} onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-ink-light hover:text-caramel transition-colors btn-bubble">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-sans font-bold text-ink">{outOfStock ? 0 : quantity}</span>
                <button disabled={outOfStock || quantity >= remainingStock} onClick={() => setQuantity((q) => Math.min(remainingStock, q + 1))}
                  className="p-2.5 text-ink-light hover:text-caramel transition-colors btn-bubble">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className={cn("text-xs font-sans", outOfStock ? "text-red-500" : "text-ink-light/40")}>
                {outOfStock ? "Out of stock" : `${remainingStock} in stock`}
              </span>
            </div>

            {/* Coupon */}
            <div className="flex gap-2">
              <div className="flex-1 relative flex items-center rounded-xl border border-caramel/20 bg-white/80 focus-within:border-blush focus-within:shadow-[0_0_0_3px_rgba(244,184,193,0.18)] transition-all">
                <Tag className="w-4 h-4 text-caramel/50 ml-3 flex-shrink-0" />
                <input type="text" value={coupon} onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponApplied(false); }}
                  placeholder="Coupon code"
                  className="flex-1 bg-transparent px-2.5 py-2.5 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none" />
                {couponApplied && <Check className="w-4 h-4 text-green-500 mr-3" />}
              </div>
              <button onClick={handleCoupon} disabled={couponLoading || outOfStock}
                className="px-4 py-2.5 rounded-xl bg-caramel/10 border border-caramel/25 text-caramel text-sm font-sans font-bold hover:bg-caramel/20 transition-all btn-bubble">
                {couponLoading ? "Applying..." : "Apply"}
              </button>
            </div>
            {couponMessage && (
              <p className={cn(
                "text-xs font-sans -mt-2 flex items-center gap-1",
                couponApplied ? "text-green-600" : "text-red-500"
              )}>
                <Check className="w-3.5 h-3.5" /> {couponMessage}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setShowOrder(true)} disabled={outOfStock}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl",
                  "bg-gradient-to-r from-caramel via-rose to-blush text-white",
                  "text-sm font-sans font-bold shadow-button hover:shadow-button-hover hover:-translate-y-0.5",
                  "transition-all duration-300 btn-bubble relative overflow-hidden group",
                  outOfStock && "opacity-60 cursor-not-allowed"
                )}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <ShoppingBag className="w-4 h-4" /> {outOfStock ? "Out of Stock" : "Buy Now"}
              </button>
              <AddToCartButton
                onClick={() => addToCart({
                  productId: product.id, name: product.name,
                  price: product.price, original_price: product.original_price,
                  category: product.category_name, category_id: product.category_id, emoji: "",
                }, Math.min(quantity, remainingStock))}
                disabled={outOfStock || remainingStock <= 0}
              />
              <button
                onClick={() => wishlisted_ctx ? removeFromWishlist(product.id) : addToWishlist({
                  productId: product.id, name: product.name, price: product.price,
                  original_price: product.original_price, category: product.category_name, category_id: product.category_id,
                  average_rating: product.average_rating, review_count: product.review_count,
                  discount_percent: product.discount_percent, is_featured: product.is_featured, emoji: "",
                })}
                className={cn("p-3.5 rounded-2xl border transition-all duration-300 btn-bubble",
                  wishlisted_ctx ? "border-blush/50 bg-blush/10 text-blush shadow-glow-blush" : "border-caramel/20 bg-white/70 text-ink-light hover:border-blush/40")}>
                <Heart className={cn("w-5 h-5 transition-all duration-300", wishlisted_ctx && "fill-blush")} />
              </button>
            </div>

            {/* WhatsApp chat */}
            <a href={`https://wa.me/923159202186?text=${encodeURIComponent(`Hi! I have a question about "${product.name}"`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/25 text-[#1a8f47] hover:bg-[#25D366]/18 transition-all duration-200 btn-bubble">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.86L.057 23.999l6.305-1.654A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.799 9.799 0 0 1-5.003-1.374l-.358-.213-3.742.981.999-3.648-.235-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
              <span className="text-sm font-sans font-semibold">Chat on WhatsApp</span>
            </a>
          </motion.div>
        </div>

        {/* Full description */}
        <div className="mb-16">
          <div className="yarn-divider mb-8" />
          <h2 className="font-display text-xl font-semibold text-ink-dark mb-4">Product Details</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="glass rounded-3xl border border-blush/20 p-6">
              <div className="space-y-3">
                {product.description.split("\n\n").slice(1).filter(Boolean).map((para, i) => (
                  <p key={i} className="text-sm text-ink-light/75 font-sans leading-relaxed">{para.trim()}</p>
                ))}
              </div>
            </div>
            <div className="glass rounded-3xl border border-blush/20 p-6 space-y-3">
              <h3 className="font-display text-base font-semibold text-ink-dark">Order Info</h3>
              {[
                { icon: "📦", label: "Made to Order", val: "7–10 days production" },
                { icon: "🎨", label: "Custom Colours", val: "Mention in WhatsApp" },
                { icon: "📏", label: "Sizes", val: "XS / S / M / L / XL" },
                { icon: "🚚", label: "Delivery", val: "Via courier, Pakistan-wide" },
                { icon: "💝", label: "Packaging", val: "Gift-wrapped with care" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-xs font-sans font-semibold text-ink-light/60">{item.label}</p>
                    <p className="text-sm font-sans text-ink">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── You May Also Like ── */}
        <div className="mb-12">
          <div className="yarn-divider mb-8" />
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-ink-dark">You May Also Like</h2>
            <Link href="/user/shop" className="text-sm font-sans font-semibold text-caramel hover:text-ink transition-colors flex items-center gap-1 group">
              View all <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {MORE_PRODUCTS.filter(p => p.id !== product.id).slice(0, 6).map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Link href={`/user/shop/${p.id}`}
                  className="block rounded-2xl border border-blush/20 bg-white/80 hover:border-caramel/35 hover:-translate-y-1 hover:shadow-card transition-all duration-300 overflow-hidden group">
                  {/* Card image area */}
                  <div className="relative h-28 overflow-hidden">
                    {/* Texture strip */}
                    <img
                      src={i % 4 === 0 ? "/images/bg-hands-knitting.jpg"
                        : i % 4 === 1 ? "/images/bg-yarn-table.jpg"
                        : i % 4 === 2 ? "/images/bg-crochet-pink.jpg"
                        : "/images/bg-crochet-items.jpg"}
                      alt="" aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover opacity-[0.10]"
                    />
                    <div className={cn("absolute inset-0 bg-gradient-to-br", p.gradient, "opacity-80")} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/60 border border-white/80 flex items-center justify-center shadow-soft transition-transform duration-300 group-hover:scale-110">
                        <span className="font-display text-xl font-semibold text-caramel/80">{p.initial}</span>
                      </div>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-[9px] font-sans font-semibold text-ink-light/45 uppercase tracking-wider mb-0.5">{p.category}</p>
                    <p className="font-display text-xs font-semibold text-ink-dark group-hover:text-caramel transition-colors line-clamp-2 leading-snug">{p.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs font-bold font-sans text-ink-dark">PKR {p.price.toLocaleString()}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => <Star key={s} className={cn("w-2.5 h-2.5", s <= Math.round(p.rating) ? "fill-caramel text-caramel" : "text-caramel/15")} />)}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div id="reviews" className="mb-16">
          <div className="yarn-divider mb-8" />
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-display text-xl font-semibold text-ink-dark">Customer Reviews</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewSort((s) => (s === "lowest" ? "highest" : "lowest"))}
                  className="px-3 py-1.5 rounded-xl border border-caramel/25 bg-white/80 text-xs font-sans font-semibold text-caramel hover:bg-caramel/10 transition-all btn-bubble"
                >
                  {reviewSort === "lowest" ? "Lowest → Highest" : "Highest → Lowest"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMyReviewsOnly((v) => !v)}
                  disabled={!isLoggedIn}
                  className={cn(
                    "px-3 py-1.5 rounded-xl border text-xs font-sans font-semibold transition-all btn-bubble",
                    showMyReviewsOnly
                      ? "border-caramel/40 bg-caramel/12 text-caramel"
                      : "border-caramel/25 bg-white/80 text-ink-light hover:text-caramel",
                    !isLoggedIn && "opacity-50 cursor-not-allowed"
                  )}
                >
                  My Reviews
                </button>
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((i) => <Star key={i} className={cn("w-4 h-4", i <= Math.round(product.average_rating) ? "fill-caramel text-caramel" : "text-caramel/15")} />)}
              </div>
              <span className="text-sm font-sans font-semibold text-ink">{product.average_rating} · {product.review_count} reviews</span>
            </div>
          </div>

          {/* Review cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {displayedReviews.map((r) => (
              <div id={`review-${r.id}`} key={r.id} className={cn(
                "glass rounded-2xl border border-blush/20 p-4 space-y-3",
                searchParams.get("review") === r.id && "ring-2 ring-caramel/35"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blush/30 to-mauve/20 flex items-center justify-center text-lg">{r.avatar_emoji}</div>
                    <div>
                      <p className="text-xs font-sans font-semibold text-ink-dark">{r.user_name}</p>
                      <p className="text-[10px] text-ink-light/40">{r.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => <Star key={i} className={cn("w-3 h-3", i <= r.rating ? "fill-caramel text-caramel" : "text-caramel/15")} />)}
                  </div>
                </div>
                <p className="text-sm text-ink/80 font-sans leading-relaxed">{r.comment}</p>
                {isLoggedIn && user && r.user_id === user.id && (
                  <button
                    type="button"
                    onClick={() => { void handleDeleteReview(r.id); }}
                    disabled={deletingReviewId === r.id}
                    className="px-3 py-1.5 rounded-xl border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 text-xs font-sans font-bold transition-all btn-bubble disabled:opacity-60"
                  >
                    {deletingReviewId === r.id ? "Deleting..." : "Delete"}
                  </button>
                )}
                {r.admin_reply && (
                  <div className="bg-caramel/8 border border-caramel/15 rounded-xl px-3 py-2">
                    <p className="text-[10px] font-sans font-bold text-caramel mb-0.5">Crochet Masterpiece replied:</p>
                    <p className="text-xs text-ink-light/70 font-sans">{r.admin_reply}</p>
                  </div>
                )}
              </div>
            ))}
            {displayedReviews.length === 0 && (
              <div className="sm:col-span-2 rounded-2xl border border-caramel/15 bg-white/70 p-6 text-center">
                <p className="text-sm font-sans text-ink-light/60">No reviews found for this filter.</p>
              </div>
            )}
          </div>

          {/* Write review */}
          <div className="glass rounded-3xl border border-blush/25 p-6">
            <h3 className="font-display text-base font-semibold text-ink-dark mb-4">Write a Review</h3>
            {!isLoggedIn && (
              <p className="text-xs font-sans text-ink-light/60 mb-3">
                Please <Link href="/user/login" className="text-caramel font-semibold hover:text-ink transition-colors">log in</Link> to submit a review.
              </p>
            )}
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map((i) => (
                <button key={i} type="button" onClick={() => setReviewRating(i)}>
                  <Star className={cn("w-6 h-6 transition-all duration-200", i <= reviewRating ? "fill-caramel text-caramel scale-110" : "text-caramel/20 hover:text-caramel/50")} />
                </button>
              ))}
            </div>
            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-caramel/20 bg-cream-50/80 text-sm font-sans text-ink placeholder:text-ink-light/40 outline-none focus:border-blush focus:bg-white focus:shadow-[0_0_0_3px_rgba(244,184,193,0.18)] transition-all resize-none mb-3" />
            {reviewMessage && (
              <p className={cn("text-xs font-sans mb-3", reviewMessage.toLowerCase().includes("success") ? "text-green-600" : "text-red-500")}>
                {reviewMessage}
              </p>
            )}
            <button
              type="button"
              onClick={() => { void handleSubmitReview(); }}
              disabled={!isLoggedIn || reviewSubmitting || !reviewText.trim()}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-sans font-bold shadow-button transition-all btn-bubble",
                !isLoggedIn || reviewSubmitting || !reviewText.trim()
                  ? "bg-ink-light/40 cursor-not-allowed"
                  : "bg-gradient-to-r from-caramel to-rose hover:shadow-button-hover hover:-translate-y-0.5"
              )}
            >
              {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isLoggedIn ? (reviewSubmitting ? "Submitting..." : "Submit Review") : "Login To Submit"}
            </button>
          </div>
        </div>
      </main>

      <Footer />

      {/* Order popup */}
      <AnimatePresence>
        {showOrder && (
          <OrderPopup product={product} quantity={quantity} coupon={coupon} onClose={() => setShowOrder(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
