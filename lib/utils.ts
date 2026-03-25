import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price to Pakistani Rupee display
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with commas (e.g., 1000 -> 1,000)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a WhatsApp order message
 */
export function buildWhatsAppOrderMessage(params: {
  productName: string;
  quantity: number;
  price: number;
  userName?: string;
  userPhone?: string;
  couponCode?: string;
  notes?: string;
}): string {
  const lines = [
    `🧶 *New Order — Crochet Masterpiece*`,
    ``,
    `📦 *Product:* ${params.productName}`,
    `🔢 *Quantity:* ${params.quantity}`,
    `💰 *Price:* PKR ${params.price.toLocaleString()}`,
  ];

  if (params.userName) lines.push(`👤 *Name:* ${params.userName}`);
  if (params.userPhone) lines.push(`📞 *Phone:* ${params.userPhone}`);
  if (params.couponCode) lines.push(`🎟 *Coupon Code:* ${params.couponCode}`);
  if (params.notes) lines.push(`📝 *Notes:* ${params.notes}`);

  lines.push(``, `_Sent from Crochet Masterpiece website_ ✨`);
  return encodeURIComponent(lines.join("\n"));
}

export const WHATSAPP_NUMBER = "923159202186"; // Replace with actual number
export const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbBXbGv9WtC90s3UER04";
export const INSTAGRAM_URL = "https://www.instagram.com/croch_etmasterpiece";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61579353555271";
export const TIKTOK_URL = "https://www.tiktok.com/@croch_et.masterpiece";
