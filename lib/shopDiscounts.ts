export type ShopDiscount = {
  id: string;
  code: string;
  percent: number;
  discountType?: "percent" | "flat";
  label: string;
  endsAt?: string;
  appliesTo: "all" | "product" | "category" | "cart";
  targetId?: string | null;
  targetName?: string | null;
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
  product: { id: string; category_id?: string | null; discount_code?: string | null },
  selectedCodes: string[],
  discounts: ShopDiscount[]
) {
  if (!selectedCodes.length) return true;

  const normalizedSelected = selectedCodes.map((c) => normalizeDiscountCode(c));
  const discountByCode = new Map(
    discounts.map((d) => [normalizeDiscountCode(d.code), d])
  );
  const productCode = normalizeDiscountCode(String(product.discount_code ?? ""));

  for (const code of normalizedSelected) {
    const discount = discountByCode.get(code);
    if (!discount) {
      if (productCode && productCode === code) return true;
      continue;
    }

    if (discount.appliesTo === "cart") return true;
    if (discount.appliesTo === "all") return true;
    if (discount.appliesTo === "product" && discount.targetId && product.id === discount.targetId) return true;
    if (discount.appliesTo === "category" && discount.targetId && product.category_id === discount.targetId) return true;
  }

  return false;
}
