/**
 * Run: npx tsx scripts/test-order-email.mts [recipient@email.com]
 * Loads .env.local and sends a sample order confirmation via Brevo.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const { isBrevoConfigured, sendOrderConfirmationToCustomer } = await import("../lib/emails/sendOrderEmails.ts");

const to = process.argv[2] || process.env.BREVO_SENDER_EMAIL || "";
if (!to) {
  console.error("Usage: npx tsx scripts/test-order-email.mts you@example.com");
  process.exit(1);
}

if (!isBrevoConfigured()) {
  console.error("Brevo not configured (BREVO_API_KEY + BREVO_SENDER_EMAIL).");
  process.exit(1);
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

try {
  await sendOrderConfirmationToCustomer({
    customerName: "Test Customer",
    customerEmail: to,
    orderRef: "#TEST01",
    orderId: "00000000-0000-0000-0000-000000000001",
    isCustomOrder: false,
    items: [{ name: "Sample Crochet Bag", quantity: 1, lineTotal: 2500 }],
    totalAmount: 2500,
    city: "Lahore",
    postalCode: "54000",
    address: "123 Test Street",
    phone: "+92 300 0000000",
    notes: "Automated test email from scripts/test-order-email.mts",
    siteUrl,
  });
  console.log("OK: confirmation email sent to", to);
} catch (err) {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
}
