export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  category_id?: string;
  stock_quantity?: number;
  quantity: number;
  emoji: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  category_id?: string;
  average_rating: number;
  review_count: number;
  discount_percent?: number;
  is_featured?: boolean;
  emoji: string;
}

export interface AppliedCoupon {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  appliesTo: "all" | "product" | "category" | "cart";
  targetId?: string | null;
}
