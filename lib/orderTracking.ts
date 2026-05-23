export const ORDER_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

export type OrderFlowStatus = (typeof ORDER_FLOW)[number];
export type ExtendedOrderStatus = OrderFlowStatus | "cancelled";

export const ORDER_STATUS_LABEL: Record<ExtendedOrderStatus, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const normalizeOrderStatus = (value: string | null | undefined): ExtendedOrderStatus => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "cancelled" || raw === "canceled") return "cancelled";
  if (raw === "processing") return "processing";
  if (raw === "confirmed") return "confirmed";
  if (raw === "shipped") return "shipped";
  if (raw === "delivered") return "delivered";
  return "pending";
};

export const canCustomerCancel = (status: string | null | undefined) => {
  const normalized = normalizeOrderStatus(status);
  return normalized === "pending" || normalized === "confirmed" || normalized === "processing";
};

