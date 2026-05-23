const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function orderStatusUserNotification(status: string, orderRef: string) {
  const label = ORDER_STATUS_LABEL[status] ?? status;
  const titles: Record<string, string> = {
    pending: "Order received",
    confirmed: "Order confirmed",
    processing: "Order in progress",
    shipped: "Order shipped",
    delivered: "Order delivered",
    cancelled: "Order cancelled",
  };
  const messages: Record<string, string> = {
    pending: `We received your order ${orderRef}. We will confirm it shortly.`,
    confirmed: `Great news — your order ${orderRef} is confirmed and we're preparing it.`,
    processing: `Your order ${orderRef} is being made. We'll notify you when it ships.`,
    shipped: `Your order ${orderRef} is on the way!`,
    delivered: `Your order ${orderRef} was delivered. Thank you for shopping with us!`,
    cancelled: `Your order ${orderRef} was cancelled. Reply on WhatsApp if you need help.`,
  };

  return {
    title: titles[status] ?? `Order ${label}`,
    message: messages[status] ?? `Your order ${orderRef} is now ${label.toLowerCase()}.`,
  };
}
