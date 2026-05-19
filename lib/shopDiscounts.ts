export type ShopDiscount = {
  id: string;
  code: string;
  percent: number;
  label: string;
  endsAt?: string;
  appliesTo?: "all" | "product" | "category" | "cart";
  targetId?: string | null;
  productId?: string | null;
};

export function parseDiscountCodesFromSearch(params: {
  discount?: string | null;
  discounts?: string | null;
}): string[] {
  const raw = [params.discount, params.discounts].filter(Boolean).join(",");
  if (!raw.trim()) return [];
  return [...new Set(raw.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean))];
}

export function shopUrlWithDiscount(code: string, extra?: Record<string, string>) {
  const q = new URLSearchParams({ discount: code.trim().toUpperCase(), ...extra });
  return `/user/shop?${q.toString()}`;
}

export function normalizeDiscountCode(code: string) {
  return code.trim().toUpperCase();
}

export function productMatchesDiscountCodes(
  product: { id?: string | null; category_id?: string | null; discount_code?: string | null; discount_active?: boolean },
  selectedCodes: string[],
  discounts: ShopDiscount[] = []
) {
  if (!selectedCodes.length) return true;
  const discountByCode = new Map(discounts.map((d) => [normalizeDiscountCode(d.code), d]));
  const productId = String(product.id ?? "");
  const productCategoryId = String(product.category_id ?? "");
  const productCode = normalizeDiscountCode(String(product.discount_code ?? ""));
  return selectedCodes.some((c) => {
    const normalizedCode = normalizeDiscountCode(c);
    const discount = discountByCode.get(normalizedCode);
    if (discount) {
      if (discount.appliesTo === "all") return true;
      if (discount.appliesTo === "product" && discount.targetId && discount.targetId === productId) return true;
      if (discount.appliesTo === "category" && discount.targetId && discount.targetId === productCategoryId) return true;
      if (discount.appliesTo === "cart") return false;
    }
    return productCode && normalizedCode === productCode;
  });
}
