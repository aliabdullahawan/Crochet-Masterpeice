export type ShopDiscount = {
  id: string;
  code: string;
  percent: number;
  label: string;
  endsAt?: string;
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
  product: { discount_code?: string | null; discount_active?: boolean },
  selectedCodes: string[]
) {
  if (!selectedCodes.length) return true;
  const productCode = normalizeDiscountCode(String(product.discount_code ?? ""));
  if (!productCode) return false;
  return selectedCodes.some((c) => normalizeDiscountCode(c) === productCode);
}
