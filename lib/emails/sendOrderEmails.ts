import { sendBrevoEmail } from "@/lib/brevo";
import {
  buildAdminNewOrderEmail,
  buildOrderConfirmationEmail,
  type OrderEmailPayload,
} from "@/lib/emails/orderConfirmation";

export function isBrevoConfigured() {
  const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  return Boolean(apiKey?.trim() && senderEmail?.trim());
}

export async function sendOrderConfirmationToCustomer(payload: OrderEmailPayload) {
  const { subject, htmlContent, textContent } = buildOrderConfirmationEmail(payload);
  await sendBrevoEmail({
    to: [{ email: payload.customerEmail, name: payload.customerName }],
    subject,
    htmlContent,
    textContent,
  });
}

export async function sendNewOrderAlertToAdmin(payload: OrderEmailPayload) {
  const adminEmail =
    process.env.ADMIN_ORDER_EMAIL?.trim() ||
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    "";

  if (!adminEmail) {
    console.warn("[sendOrderEmails] ADMIN_ORDER_EMAIL / BREVO_SENDER_EMAIL not set; skipping admin email.");
    return;
  }

  const { subject, htmlContent, textContent } = buildAdminNewOrderEmail(payload);
  await sendBrevoEmail({
    to: [{ email: adminEmail, name: "Admin" }],
    subject,
    htmlContent,
    textContent,
  });
}

export async function sendOrderEmails(payload: OrderEmailPayload) {
  await sendOrderConfirmationToCustomer(payload);
  await sendNewOrderAlertToAdmin(payload).catch((err) => {
    console.error("[sendOrderEmails] Admin alert email failed:", err);
  });
}
