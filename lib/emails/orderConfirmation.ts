type OrderLine = { name: string; quantity: number; lineTotal: number };

export type OrderEmailPayload = {
  customerName: string;
  customerEmail: string;
  orderRef: string;
  orderId: string;
  isCustomOrder: boolean;
  items: OrderLine[];
  totalAmount: number;
  city: string;
  postalCode: string;
  address: string;
  phone: string;
  notes?: string;
  mapLink?: string;
  customCategory?: string;
  customDescription?: string;
  customTimeframe?: string;
  magicLoginLink?: string | null;
  siteUrl: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildOrderConfirmationEmail(payload: OrderEmailPayload) {
  const {
    customerName,
    orderRef,
    isCustomOrder,
    items,
    totalAmount,
    city,
    postalCode,
    address,
    phone,
    notes,
    mapLink,
    customCategory,
    customDescription,
    customTimeframe,
    magicLoginLink,
    siteUrl,
  } = payload;

  const firstName = escapeHtml(customerName.split(" ")[0] || customerName);
  const trackUrl = `${siteUrl}/user/orders`;

  const itemsHtml = isCustomOrder
    ? `
      <tr><td style="padding:8px 0;color:#5c4a3a;"><strong>Custom order</strong></td></tr>
      <tr><td style="padding:4px 0;color:#5c4a3a;">Category: ${escapeHtml(customCategory || "—")}</td></tr>
      <tr><td style="padding:4px 0;color:#5c4a3a;">Details: ${escapeHtml(customDescription || "—")}</td></tr>
      ${customTimeframe ? `<tr><td style="padding:4px 0;color:#5c4a3a;">Timeline: ${escapeHtml(customTimeframe)}</td></tr>` : ""}
    `
    : items
        .map(
          (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0e6d8;color:#3d2f24;">
          ${escapeHtml(item.name)} × ${item.quantity}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0e6d8;text-align:right;font-weight:600;color:#b8860b;">
          PKR ${item.lineTotal.toLocaleString()}
        </td>
      </tr>`
        )
        .join("");

  const magicBlock = magicLoginLink
    ? `
    <div style="margin:24px 0;padding:16px;background:#fff8f0;border-radius:12px;border:1px solid #e8d4b8;">
      <p style="margin:0 0 12px;font-size:14px;color:#3d2f24;">
        You already have an account — sign in instantly with this secure link (no password needed):
      </p>
      <a href="${escapeHtml(magicLoginLink)}"
         style="display:inline-block;padding:12px 20px;background:linear-gradient(135deg,#c9a06c,#e8a0b0);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
        Sign in with Magic Link
      </a>
    </div>`
    : "";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff8ed;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8ed;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(61,47,36,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f4d4c1 0%,#e8c4a8 50%,#d4a574 100%);padding:32px 28px;text-align:center;">
            <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#5c4a3a;opacity:0.9;">Crochet Masterpiece</p>
            <h1 style="margin:8px 0 0;font-size:26px;color:#3d2f24;font-weight:600;">Order confirmation</h1>
            <p style="margin:8px 0 0;font-size:15px;color:#5c4a3a;">Thanks, ${firstName}! Your order is confirmed and pending review.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5c4a3a;">
              We're so happy you chose us. Our team will review your order shortly and keep you updated by email.
            </p>
            <p style="margin:0 0 20px;font-size:14px;color:#8b7355;">
              <strong>Order reference:</strong> ${escapeHtml(orderRef)}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              ${itemsHtml}
              ${
                !isCustomOrder
                  ? `<tr>
                <td style="padding:14px 0;font-size:16px;font-weight:700;color:#3d2f24;">Total</td>
                <td style="padding:14px 0;text-align:right;font-size:18px;font-weight:700;color:#b8860b;">PKR ${totalAmount.toLocaleString()}</td>
              </tr>`
                  : ""
              }
            </table>
            <div style="background:#faf6f0;border-radius:12px;padding:16px;margin-bottom:20px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#3d2f24;">Delivery details</p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#5c4a3a;">
                ${escapeHtml(address)}<br/>
                ${escapeHtml(city)}, ${escapeHtml(postalCode)}<br/>
                Phone: ${escapeHtml(phone)}
                ${mapLink ? `<br/><a href="${escapeHtml(mapLink)}" style="color:#b8860b;">View map location</a>` : ""}
              </p>
              ${notes ? `<p style="margin:12px 0 0;font-size:13px;color:#5c4a3a;"><em>Notes: ${escapeHtml(notes)}</em></p>` : ""}
            </div>
            ${magicBlock}
            <p style="margin:24px 0 0;font-size:13px;color:#8b7355;text-align:center;">
              Track your order anytime from your account.
            </p>
            <p style="margin:16px 0 0;text-align:center;">
              <a href="${escapeHtml(trackUrl)}"
                 style="display:inline-block;padding:12px 24px;background:#3d2f24;color:#fff8ed;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
                View My Orders
              </a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;background:#faf6f0;text-align:center;border-top:1px solid #f0e6d8;">
            <p style="margin:0;font-size:12px;color:#8b7355;">
              With love from Crochet Masterpiece · Handmade with heart
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textLines = [
    `Order confirmation`,
    ``,
    `Thanks, ${customerName}! Your order ${orderRef} is confirmed and pending review.`,
    isCustomOrder
      ? `Custom order: ${customCategory || ""} — ${customDescription || ""}`
      : items.map((i) => `${i.name} x${i.quantity} — PKR ${i.lineTotal.toLocaleString()}`).join("\n"),
    !isCustomOrder ? `Total: PKR ${totalAmount.toLocaleString()}` : "",
    ``,
    `Delivery: ${address}, ${city} ${postalCode}`,
    `Phone: ${phone}`,
    magicLoginLink ? `Sign in: ${magicLoginLink}` : "",
    `Track orders: ${trackUrl}`,
  ].filter(Boolean);

  return {
    subject: `Order confirmation — ${orderRef} | Crochet Masterpiece`,
    htmlContent,
    textContent: textLines.join("\n"),
  };
}

export function buildAdminNewOrderEmail(payload: OrderEmailPayload) {
  const orderRef = payload.orderRef;
  const htmlContent = `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f5f5f5;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border-left:4px solid #c9a06c;">
    <h2 style="margin:0 0 12px;color:#333;">New order — ${escapeHtml(orderRef)}</h2>
    <p style="color:#555;line-height:1.5;">
      <strong>${escapeHtml(payload.customerName)}</strong> submitted a new order via the website.
      Review it in the admin panel.
    </p>
    <p style="font-size:14px;color:#666;">
      Email: ${escapeHtml(payload.customerEmail)}<br/>
      Phone: ${escapeHtml(payload.phone)}<br/>
      Total: PKR ${payload.totalAmount.toLocaleString()}
    </p>
    <a href="${escapeHtml(payload.siteUrl)}/admin/orders"
       style="display:inline-block;margin-top:16px;padding:10px 18px;background:#c9a06c;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
      Open Admin Orders
    </a>
  </div>
</body></html>`;

  return {
    subject: `[Admin] New order ${orderRef} — ${payload.customerName}`,
    htmlContent,
    textContent: `New order ${orderRef} from ${payload.customerName} (${payload.customerEmail}). Open admin: ${payload.siteUrl}/admin/orders`,
  };
}
