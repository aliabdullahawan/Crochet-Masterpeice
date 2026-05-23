import type { AppliedCoupon, CartItem, WishlistItem } from "@/lib/shopTypes";

export const GUEST_STORAGE_OWNER = "guest";

export function getShopStorageKeys(ownerId: string) {
  return {
    cart: `cm_cart_${ownerId}`,
    wishlist: `cm_wishlist_${ownerId}`,
    coupon: `cm_coupon_${ownerId}`,
  };
}

function readJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Guest session cart/wishlist/coupon from localStorage. */
export function readGuestShopState() {
  if (typeof window === "undefined") {
    return { cart: [] as CartItem[], wishlist: [] as WishlistItem[], coupon: null as AppliedCoupon | null };
  }
  const keys = getShopStorageKeys(GUEST_STORAGE_OWNER);
  return {
    cart: readJson<CartItem[]>(localStorage.getItem(keys.cart), []),
    wishlist: readJson<WishlistItem[]>(localStorage.getItem(keys.wishlist), []),
    coupon: readJson<AppliedCoupon | null>(localStorage.getItem(keys.coupon), null),
  };
}

/**
 * When a visitor logs in or signs up, keep their guest cart.
 * If the guest cart has items, it replaces any saved cart on that account.
 */
export function adoptGuestShopStateForUser(userId: string) {
  if (typeof window === "undefined") {
    return { cart: [] as CartItem[], wishlist: [] as WishlistItem[], coupon: null as AppliedCoupon | null, adopted: false };
  }

  const guest = readGuestShopState();
  const userKeys = getShopStorageKeys(userId);
  const savedCart = readJson<CartItem[]>(localStorage.getItem(userKeys.cart), []);
  const savedWish = readJson<WishlistItem[]>(localStorage.getItem(userKeys.wishlist), []);
  const savedCoupon = readJson<AppliedCoupon | null>(localStorage.getItem(userKeys.coupon), null);

  const cart = guest.cart.length > 0 ? guest.cart : savedCart;
  const wishlist = guest.wishlist.length > 0 ? guest.wishlist : savedWish;
  const coupon = guest.coupon ?? savedCoupon;

  const adopted = guest.cart.length > 0 || guest.wishlist.length > 0 || Boolean(guest.coupon);

  localStorage.setItem(userKeys.cart, JSON.stringify(cart));
  localStorage.setItem(userKeys.wishlist, JSON.stringify(wishlist));
  localStorage.setItem(userKeys.coupon, JSON.stringify(coupon));

  if (adopted) {
    const guestKeys = getShopStorageKeys(GUEST_STORAGE_OWNER);
    localStorage.removeItem(guestKeys.cart);
    localStorage.removeItem(guestKeys.wishlist);
    localStorage.removeItem(guestKeys.coupon);
  }

  return { cart, wishlist, coupon, adopted };
}
