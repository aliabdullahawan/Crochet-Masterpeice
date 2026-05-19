"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useShop } from "@/lib/ShopContext";
import { useAuth } from "@/lib/AuthContext";
import { CheckoutSuccessModal } from "@/components/checkout/CheckoutSuccessModal";
import type { LatLngLiteral } from "leaflet";

const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function validateEmailClient(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email) return "Email is required to place an order.";
  if (!EMAIL_PATTERN.test(email)) return "Please enter a valid email address.";
  return null;
}

const CheckoutMapClient = dynamic(
  () => import("./CheckoutMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center text-xs text-ink-light/60">
        Loading map...
      </div>
    ),
  }
);

type DraftItem = {
  productId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
};

type CustomDraft = {
  category?: string;
  description?: string;
  timeframe?: string;
  estimatedPrice?: string;
};

const decodeJson = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return parsed as T;
  } catch {
    return null;
  }
};

const DEFAULT_CENTER: LatLngLiteral = { lat: 31.5204, lng: 74.3587 };

const formatCoord = (value: number) => Number(value.toFixed(6));

const buildMapUrl = (lat: number, lng: number) => `https://maps.google.com/?q=${lat},${lng}`;

const parseMapUrl = (value: string): LatLngLiteral | null => {
  const cleaned = value.trim();
  if (!cleaned) return null;

  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
};

function CheckoutPageContent() {
  const params = useSearchParams();
  const { cartItems, placeOrder } = useShop();
  const { user } = useAuth();

  const sourceParam = String(params.get("source") ?? "website").toLowerCase();
  const source = sourceParam === "custom" ? "custom" : "website";

  const itemsFromQuery = decodeJson<DraftItem[]>(params.get("items"));
  const customDraft = decodeJson<CustomDraft>(params.get("custom"));

  const items = useMemo(() => {
    if (Array.isArray(itemsFromQuery) && itemsFromQuery.length > 0) return itemsFromQuery;
    return cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
    }));
  }, [itemsFromQuery, cartItems]);

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "",
    email: user?.email ?? "",
    phone: user?.user_metadata?.phone ?? "",
    city: "",
    postalCode: "",
    address: "",
    notes: "",
    mapLat: "",
    mapLng: "",
    mapUrl: "",
    rememberMe: false,
    emailOptIn: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [successModal, setSuccessModal] = useState<{
    orderRef: string;
    email: string;
    accountExists: boolean;
    magicLinkIncluded: boolean;
    whatsappUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (user?.id) return;
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("cm_checkout_profile");
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as Partial<typeof form>;
      const parsed = parseMapUrl(String(saved.mapUrl ?? ""));
      setForm((prev) => ({
        ...prev,
        name: prev.name || saved.name || "",
        email: prev.email || saved.email || "",
        phone: prev.phone || saved.phone || "",
        city: prev.city || saved.city || "",
        postalCode: prev.postalCode || saved.postalCode || "",
        address: prev.address || saved.address || "",
        mapLat: prev.mapLat || saved.mapLat || (parsed ? String(formatCoord(parsed.lat)) : ""),
        mapLng: prev.mapLng || saved.mapLng || (parsed ? String(formatCoord(parsed.lng)) : ""),
        mapUrl: prev.mapUrl || saved.mapUrl || "",
      }));
    } catch {
      // Ignore malformed saved data
    }
  }, [user?.id]);

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const mapCoords = useMemo<LatLngLiteral | null>(() => {
    const latValue = form.mapLat.trim();
    const lngValue = form.mapLng.trim();
    if (!latValue || !lngValue) return null;
    const lat = Number(latValue);
    const lng = Number(lngValue);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, [form.mapLat, form.mapLng]);

  const applyCoords = (coords: LatLngLiteral) => {
    const lat = formatCoord(coords.lat);
    const lng = formatCoord(coords.lng);
    setForm((prev) => ({
      ...prev,
      mapLat: String(lat),
      mapLng: String(lng),
      mapUrl: buildMapUrl(lat, lng),
    }));
  };

  const handleMapUrlChange = (value: string) => {
    if (!value.trim()) {
      setForm((prev) => ({ ...prev, mapUrl: "", mapLat: "", mapLng: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, mapUrl: value }));
    const parsed = parseMapUrl(value);
    if (parsed) applyCoords(parsed);
  };

  const handleUseLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setError("Could not access your location. Please allow location access or paste a map link.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClearMap = () => {
    setForm((prev) => ({ ...prev, mapLat: "", mapLng: "", mapUrl: "" }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setEmailError("");

    const emailValidation = validateEmailClient(form.email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }

    if (!form.name.trim() || !form.phone.trim() || !form.city.trim() || !form.postalCode.trim() || !form.address.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    if (source !== "custom" && items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSaving(true);
    try {
      const mapUrl = form.mapUrl.trim();
      const mapLat = form.mapLat.trim().length > 0 ? Number(form.mapLat) : NaN;
      const mapLng = form.mapLng.trim().length > 0 ? Number(form.mapLng) : NaN;
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id ?? null,
          source,
          items,
          customerName: form.name.trim(),
          customerEmail: form.email.trim().toLowerCase(),
          customerPhone: form.phone.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
          mapLat: Number.isFinite(mapLat) ? mapLat : null,
          mapLng: Number.isFinite(mapLng) ? mapLng : null,
          mapUrl: mapUrl.length > 0 ? mapUrl : null,
          rememberMe: form.rememberMe,
          emailOptIn: form.emailOptIn,
          customOrder: source === "custom" ? customDraft : undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof body?.error === "string" ? body.error : "Could not confirm order.");
        return;
      }

      if (source !== "custom") placeOrder();

      if (typeof window !== "undefined") {
        if (form.rememberMe) {
          localStorage.setItem(
            "cm_checkout_profile",
            JSON.stringify({
              name: form.name.trim(),
              email: form.email.trim().toLowerCase(),
              phone: form.phone.trim(),
              city: form.city.trim(),
              postalCode: form.postalCode.trim(),
              address: form.address.trim(),
              mapLat: form.mapLat.trim(),
              mapLng: form.mapLng.trim(),
              mapUrl: form.mapUrl.trim(),
            })
          );
        } else {
          localStorage.removeItem("cm_checkout_profile");
        }
      }

      setSuccessModal({
        orderRef: String(body?.orderRef ?? `#${String(body?.orderId ?? "").slice(0, 6).toUpperCase()}`),
        email: form.email.trim().toLowerCase(),
        accountExists: Boolean(body?.accountExists),
        magicLinkIncluded: Boolean(body?.magicLinkIncluded),
        whatsappUrl: body?.whatsappUrl ? String(body.whatsappUrl) : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-ink-dark">Confirm Order</h1>
          <p className="text-sm text-ink-light/60 font-sans">
            Complete your details. We will email you a confirmation — a valid email address is required.
          </p>
        </div>

        <div className="glass rounded-3xl border border-caramel/20 p-5 sm:p-6 mb-5">
          {source === "custom" ? (
            <div className="text-sm font-sans text-ink-light/70">
              <p className="font-semibold text-ink-dark mb-1">Custom order details</p>
              <p>Category: {customDraft?.category || "-"}</p>
              <p>Description: {customDraft?.description || "-"}</p>
              <p>Timeframe: {customDraft?.timeframe || "-"}</p>
              <p>Estimate: {customDraft?.estimatedPrice || "-"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between text-sm font-sans">
                  <span className="text-ink-dark">{item.name} x{item.quantity}</span>
                  <span className="font-semibold text-caramel">PKR {(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-caramel/15 flex items-center justify-between">
                <span className="font-semibold text-ink-dark">Total</span>
                <span className="font-bold text-caramel">PKR {total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="glass rounded-3xl border border-caramel/20 p-5 sm:p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full Name *" className="px-3 py-2.5 rounded-xl border border-caramel/20 bg-white/80 outline-none focus:border-caramel" />
            <div className="sm:col-span-1">
              <input
                value={form.email}
                onChange={(e) => {
                  set("email", e.target.value);
                  if (emailError) setEmailError("");
                }}
                onBlur={() => {
                  const msg = validateEmailClient(form.email);
                  if (msg) setEmailError(msg);
                }}
                placeholder="Email *"
                type="email"
                autoComplete="email"
                className={`w-full px-3 py-2.5 rounded-xl border bg-white/80 outline-none focus:border-caramel ${emailError ? "border-red-400" : "border-caramel/20"}`}
              />
              {emailError && <p className="text-[11px] text-red-500 mt-1 font-sans">{emailError}</p>}
            </div>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone (+92...) *" className="px-3 py-2.5 rounded-xl border border-caramel/20 bg-white/80 outline-none focus:border-caramel" />
            <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City *" className="px-3 py-2.5 rounded-xl border border-caramel/20 bg-white/80 outline-none focus:border-caramel" />
            <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="Postal Code *" className="px-3 py-2.5 rounded-xl border border-caramel/20 bg-white/80 outline-none focus:border-caramel" />
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Full Address *" className="px-3 py-2.5 rounded-xl border border-caramel/20 bg-white/80 outline-none focus:border-caramel" />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink-dark">Pin your location (optional)</p>
                <p className="text-xs text-ink-light/60">Click on the map or paste a Google Maps link.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  className="px-3 py-2 rounded-xl border border-caramel/20 text-xs font-semibold text-ink-dark bg-white/70 hover:bg-white transition"
                >
                  Use my location
                </button>
                {mapCoords && (
                  <button
                    type="button"
                    onClick={handleClearMap}
                    className="px-3 py-2 rounded-xl border border-caramel/20 text-xs font-semibold text-ink-dark bg-white/70 hover:bg-white transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="h-56 rounded-2xl overflow-hidden border border-caramel/20 bg-white/80">
              <CheckoutMapClient
                defaultCenter={DEFAULT_CENTER}
                markerPosition={mapCoords}
                onSelect={applyCoords}
              />
            </div>

            <div className="space-y-2">
              <input
                value={form.mapUrl}
                onChange={(e) => handleMapUrlChange(e.target.value)}
                placeholder="Google Maps link (optional)"
                className="w-full px-3 py-2.5 rounded-xl border border-caramel/20 bg-white/80 outline-none focus:border-caramel"
              />
              {form.mapUrl.trim().length > 0 && (
                <a
                  href={form.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-caramel font-semibold inline-flex items-center gap-1"
                >
                  Open in Google Maps
                  <span aria-hidden>↗</span>
                </a>
              )}
            </div>
          </div>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Additional notes (optional)" rows={3} className="w-full px-3 py-2.5 rounded-xl border border-caramel/20 bg-white/80 outline-none focus:border-caramel resize-none" />

          <label className="flex items-center gap-2 text-sm text-ink-light/75 font-sans">
            <input type="checkbox" checked={form.rememberMe} onChange={(e) => set("rememberMe", e.target.checked)} />
            Save my information for next time
          </label>
          <p className="text-[11px] text-ink-light/55 font-sans -mt-2">
            We will create an account so you can use Magic Link / OTP on your next visit.
          </p>
          <label className="flex items-center gap-2 text-sm text-ink-light/75 font-sans">
            <input type="checkbox" checked={form.emailOptIn} onChange={(e) => set("emailOptIn", e.target.checked)} />
            Yes, send me updates about discounts and new products
          </label>

          {error && <p className="text-sm text-red-500 font-sans">{error}</p>}

          <button
            disabled={saving}
            type="submit"
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-caramel to-rose text-white font-semibold disabled:opacity-60 shadow-button"
          >
            {saving ? "Sending order..." : "Confirm order & send confirmation"}
          </button>
        </form>
      </main>

      <CheckoutSuccessModal
        open={successModal !== null}
        orderRef={successModal?.orderRef ?? ""}
        email={successModal?.email ?? ""}
        accountExists={successModal?.accountExists ?? false}
        magicLinkIncluded={successModal?.magicLinkIncluded ?? false}
        whatsappUrl={successModal?.whatsappUrl}
        onClose={() => setSuccessModal(null)}
      />

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream-100">
          <Navbar />
          <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
            <p className="text-sm text-ink-light/60 font-sans">Loading checkout…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}