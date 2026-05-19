import { NextResponse } from "next/server";
import { isBrevoConfigured, sendOrderConfirmationToCustomer } from "@/lib/emails/sendOrderEmails";
import { validateCustomerEmail } from "@/lib/validateEmail";

/**
 * Dev / ops test: POST { "email": "you@example.com", "secret": "..." }
 * Set TEST_EMAIL_SECRET in .env.local. Disabled in production unless secret matches.
 */
export async function POST(req: Request) {
  const secret = process.env.TEST_EMAIL_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "TEST_EMAIL_SECRET is not configured on the server." },
      { status: 503 }
    );
  }

  const body = (await req.json()) as { email?: string; secret?: string };
  if (body.secret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const validated = validateCustomerEmail(String(body.email ?? ""));
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  if (!isBrevoConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in .env.local",
      },
      { status: 503 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  try {
    await sendOrderConfirmationToCustomer({
      customerName: "Test Customer",
      customerEmail: validated.normalized,
      orderRef: "#TEST01",
      orderId: "00000000-0000-0000-0000-000000000001",
      isCustomOrder: false,
      items: [{ name: "Sample Crochet Bag", quantity: 1, lineTotal: 2500 }],
      totalAmount: 2500,
      city: "Lahore",
      postalCode: "54000",
      address: "123 Test Street",
      phone: "+92 300 0000000",
      notes: "This is a test order confirmation email.",
      siteUrl,
    });

    return NextResponse.json({
      ok: true,
      message: `Test confirmation email sent to ${validated.normalized}. Check inbox and spam.`,
      brevoConfigured: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Send failed",
      },
      { status: 500 }
    );
  }
}
