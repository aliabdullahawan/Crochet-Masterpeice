import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CouponScope = "all" | "product" | "category" | "cart";
type CouponType = "percent" | "flat";

interface DiscountRow {
  code: string | null;
  discount_type: CouponType | null;
  discount_value: number | null;
  active: boolean | null;
  start_date: string | null;
  end_date: string | null;
  max_uses: number | null;
  uses_count: number | null;
  applies_to?: CouponScope | null;
  target_id?: string | null;
  product_id?: string | null;
}

const toDate = (value: string | null) => (value ? new Date(value) : null);
const toIdArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!serviceRole && !anonKey)) {
    return NextResponse.json({
      valid: false,
      message: "Coupon service is not configured.",
    }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const rawCode = typeof body.code === "string" ? body.code : "";
  const productId = typeof body.productId === "string" ? body.productId : null;
  const categoryId = typeof body.categoryId === "string" ? body.categoryId : null;
  const productIds = Array.from(new Set([
    ...toIdArray(body.productIds),
    ...(productId ? [productId] : []),
  ]));
  const categoryIds = Array.from(new Set([
    ...toIdArray(body.categoryIds),
    ...(categoryId ? [categoryId] : []),
  ]));

  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false, message: "Enter a coupon code." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRole ?? anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const modernResult = await supabase
    .from("discounts")
    .select("code, discount_type, discount_value, active, start_date, end_date, max_uses, uses_count, applies_to, target_id")
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1);

  let data = modernResult.data as DiscountRow[] | null;
  let queryError = modernResult.error;

  if (queryError) {
    const legacyResult = await supabase
      .from("discounts")
      .select("code, discount_type, discount_value, active, start_date, end_date, max_uses, uses_count, product_id")
      .eq("code", code)
      .order("created_at", { ascending: false })
      .limit(1);

    data = legacyResult.data as DiscountRow[] | null;
    queryError = legacyResult.error;
  }

  if (queryError) {
    return NextResponse.json({ valid: false, message: "Unable to validate coupon. Please check discount table setup." }, { status: 500 });
  }

  const row = (data?.[0] ?? null) as DiscountRow | null;
  if (!row) {
    return NextResponse.json({ valid: false, message: "Invalid coupon code." });
  }

  const now = new Date();
  const start = toDate(row.start_date);
  const end = toDate(row.end_date);

  if (row.active === false) {
    return NextResponse.json({ valid: false, message: "This coupon is inactive." });
  }
  if (start && start > now) {
    return NextResponse.json({ valid: false, message: "This coupon is not active yet." });
  }
  if (end && end < now) {
    return NextResponse.json({ valid: false, message: "This coupon has expired." });
  }
  if (row.max_uses !== null && row.uses_count !== null && row.uses_count >= row.max_uses) {
    return NextResponse.json({ valid: false, message: "This coupon has reached its usage limit." });
  }

  const appliesTo: CouponScope = row.applies_to ?? (row.product_id ? "product" : "all");
  const targetId = row.target_id ?? row.product_id ?? null;

  const applicable = appliesTo === "all"
    || appliesTo === "cart"
    || (appliesTo === "product" && !!targetId && productIds.includes(targetId))
    || (appliesTo === "category" && !!targetId && categoryIds.includes(targetId));

  if ((productIds.length || categoryIds.length) && !applicable) {
    return NextResponse.json({ valid: false, message: "This coupon is not valid for this product." });
  }

  const discountType: CouponType = row.discount_type ?? "percent";
  const discountValue = Math.max(0, Number(row.discount_value ?? 0));

  if (!discountValue) {
    return NextResponse.json({ valid: false, message: "This coupon has no discount value." });
  }

  return NextResponse.json({
    valid: true,
    code,
    discountType,
    discountValue,
    appliesTo,
    targetId,
    message: discountType === "percent"
      ? `${discountValue}% discount applied.`
      : `PKR ${discountValue.toLocaleString()} discount applied.`,
  });
}
