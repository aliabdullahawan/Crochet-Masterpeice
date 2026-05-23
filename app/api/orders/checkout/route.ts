import { NextResponse } from "next/server";
import { createServiceClient, getServiceRoleSupabase } from "@/lib/supabase";
import { accountExistsForEmail, createMagicLoginLink } from "@/lib/auth/accountByEmail";
import { isBrevoConfigured, sendOrderEmails } from "@/lib/emails/sendOrderEmails";
import type { OrderEmailPayload } from "@/lib/emails/orderConfirmation";
import { validateCustomerEmail } from "@/lib/validateEmail";

type CheckoutItem = {
  productId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
};

type CheckoutBody = {
  userId?: string | null;
  source?: "website" | "whatsapp" | "custom";
  items?: CheckoutItem[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  notes?: string;
  mapLat?: number | null;
  mapLng?: number | null;
  mapUrl?: string | null;
  rememberMe?: boolean;
  emailOptIn?: boolean;
  customOrder?: {
    category?: string;
    description?: string;
    timeframe?: string;
    estimatedPrice?: string;
  };
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const makeTempPassword = () => {
  const seed = Math.random().toString(36).slice(2, 8);
  return `Cm@${seed}${Date.now().toString().slice(-4)}`;
};

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

async function rollbackOrder(service: ReturnType<typeof createServiceClient>, orderId: string) {
  await service.from("order_status_history").delete().eq("order_id", orderId);
  await service.from("order_items").delete().eq("order_id", orderId);
  await service.from("orders").delete().eq("id", orderId);
}

async function notifyAdminPanel(
  orderId: string,
  customerName: string,
  customerEmail: string,
  isCustomOrder: boolean,
  totalAmount: number
) {
  const adminDb = getServiceRoleSupabase();
  if (!adminDb) return;

  const readableOrder = `#${orderId.slice(0, 6).toUpperCase()}`;
  const title = isCustomOrder ? `New custom order ${readableOrder}` : `New order ${readableOrder}`;
  const message = `${customerName} (${customerEmail}) submitted a ${isCustomOrder ? "custom" : "shop"} order — PKR ${totalAmount.toLocaleString()}. Review in admin.`;

  const { error } = await adminDb.from("admin_notifications").insert({
    type: "order",
    title,
    message,
    link: "/admin/orders",
    meta: orderId,
  });

  if (error) {
    console.error("[checkout] admin_notifications insert failed:", error.message, {
      orderId,
      hint: "Ensure ADD_ADMIN_NOTIFICATIONS.sql ran and SUPABASE_SERVICE_ROLE_KEY is set on the server.",
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutBody;
    const service = createServiceClient();

    const customerName = String(body.customerName ?? "").trim();
    const customerPhone = String(body.customerPhone ?? "").trim();
    const city = String(body.city ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim();
    const address = String(body.address ?? "").trim();
    const notes = String(body.notes ?? "").trim();
    const rememberMe = Boolean(body.rememberMe);
    const emailOptIn = Boolean(body.emailOptIn);
    const source = body.source === "custom" ? "custom" : "website";
    const mapLat = typeof body.mapLat === "number" ? body.mapLat : null;
    const mapLng = typeof body.mapLng === "number" ? body.mapLng : null;
    const mapUrl = String(body.mapUrl ?? "").trim();
    const mapLink = mapUrl || (mapLat !== null && mapLng !== null ? `https://maps.google.com/?q=${mapLat},${mapLng}` : "");

    const emailCheck = validateCustomerEmail(String(body.customerEmail ?? ""));
    if (!emailCheck.ok) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }
    const customerEmail = emailCheck.normalized;

    if (!customerName || !customerPhone || !city || !postalCode || !address) {
      return NextResponse.json({ error: "Missing required checkout fields." }, { status: 400 });
    }

    if (!isBrevoConfigured()) {
      return NextResponse.json(
        {
          error:
            "Order email service is not configured. Please contact support or try again later. (Admin: set BREVO_API_KEY and BREVO_SENDER_EMAIL.)",
        },
        { status: 503 }
      );
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const safeItems = rawItems
      .map((item) => ({
        productId:
          typeof item.productId === "string" && item.productId && isUuid(item.productId) ? item.productId : null,
        name: String(item.name ?? "").trim(),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        unitPrice: Math.max(0, Number(item.unitPrice ?? 0)),
      }))
      .filter((item) => item.name.length > 0);

    const customOrder = body.customOrder ?? null;
    const isCustomOrder = source === "custom";
    if (!safeItems.length && !isCustomOrder) {
      return NextResponse.json({ error: "No order items found." }, { status: 400 });
    }

    const subtotal = safeItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalAmount = isCustomOrder ? 0 : Math.max(0, subtotal);

    let linkedUserId: string | null =
      typeof body.userId === "string" && isUuid(body.userId) ? body.userId : null;
    let tempPassword: string | null = null;
    const hadAccountBefore = await accountExistsForEmail(service, customerEmail);

    if (!linkedUserId && rememberMe) {
      const { data: existingUser } = await service.from("users").select("id").eq("email", customerEmail).maybeSingle();
      linkedUserId = (existingUser as { id: string } | null)?.id ?? null;
    }

    if (rememberMe && !linkedUserId) {
      tempPassword = makeTempPassword();
      const created = await service.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: customerName,
          full_name: customerName,
          phone: customerPhone,
          city,
          postalCode,
          address,
        },
      });
      if (!created.error && created.data.user) {
        linkedUserId = created.data.user.id;
      }
    }

    if (linkedUserId) {
      const withExtendedCols = await service.from("users").upsert(
        {
          id: linkedUserId,
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          address,
          city,
          postal_code: postalCode,
          email_subscribed: emailOptIn,
        } as unknown as never,
        { onConflict: "id" }
      );
      if (withExtendedCols.error) {
        await service.from("users").upsert(
          {
            id: linkedUserId,
            email: customerEmail,
            name: customerName,
            phone: customerPhone,
            address,
          } as unknown as never,
          { onConflict: "id" }
        );
      }
    }

    const noteParts: string[] = [];
    if (city) noteParts.push(`City: ${city}`);
    if (postalCode) noteParts.push(`Postal: ${postalCode}`);
    if (notes) noteParts.push(`Notes: ${notes}`);
    if (mapLink) noteParts.push(`Map: ${mapLink}`);
    if (isCustomOrder && customOrder) {
      noteParts.push(`Custom category: ${String(customOrder.category ?? "").trim()}`);
      noteParts.push(`Custom description: ${String(customOrder.description ?? "").trim()}`);
      if (customOrder.timeframe) noteParts.push(`Custom timeline: ${customOrder.timeframe}`);
      if (customOrder.estimatedPrice) noteParts.push(`Custom estimate: ${customOrder.estimatedPrice}`);
    }

    const { data: orderInsert, error: orderError } = await service
      .from("orders")
      .insert({
        user_id: linkedUserId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        address,
        source,
        status: "pending",
        total_amount: totalAmount,
        discount_amount: 0,
        note: noteParts.join("\n"),
      })
      .select("id")
      .single();

    if (orderError || !orderInsert) {
      return NextResponse.json({ error: orderError?.message ?? "Could not create order." }, { status: 500 });
    }

    const orderId = (orderInsert as { id: string }).id;
    const readableOrder = `#${orderId.slice(0, 6).toUpperCase()}`;

    if (safeItems.length) {
      const { error: itemsError } = await service.from("order_items").insert(
        safeItems.map((item) => ({
          order_id: orderId,
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        }))
      );
      if (itemsError) {
        await rollbackOrder(service, orderId);
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    } else if (isCustomOrder && customOrder) {
      const categoryLabel = String(customOrder.category ?? "Custom").trim() || "Custom";
      const { error: itemsError } = await service.from("order_items").insert({
        order_id: orderId,
        product_id: null,
        product_name: `Custom order: ${categoryLabel}`,
        quantity: 1,
        unit_price: 0,
      });
      if (itemsError) {
        await rollbackOrder(service, orderId);
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }

      const { error: customError } = await service.from("custom_orders").insert({
        linked_order_id: orderId,
        user_id: linkedUserId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        category: categoryLabel,
        custom_category: categoryLabel === "other" ? String(customOrder.description ?? "").slice(0, 200) : null,
        description: String(customOrder.description ?? "").trim(),
        timeframe: customOrder.timeframe ? String(customOrder.timeframe) : null,
        status: "pending",
        pricing_status: "awaiting_quote",
        quoted_price: null,
      } as never);

      if (customError) {
        console.warn("[checkout] custom_orders insert:", customError.message);
      }
    }

    await service.from("order_status_history").insert({
      order_id: orderId,
      from_status: null,
      to_status: "pending",
      changed_by: "system",
    } as unknown as never);

    const accountExists = hadAccountBefore || Boolean(linkedUserId);
    let magicLoginLink: string | null = null;
    if (accountExists) {
      magicLoginLink = await createMagicLoginLink(service, customerEmail, `/user/orders/${orderId}`);
    }

    const emailPayload: OrderEmailPayload = {
      customerName,
      customerEmail,
      orderRef: readableOrder,
      orderId,
      isCustomOrder,
      items:
        isCustomOrder && customOrder
          ? [
              {
                name: `Custom: ${String(customOrder.category ?? "Request")}`,
                quantity: 1,
                lineTotal: 0,
              },
            ]
          : safeItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              lineTotal: item.quantity * item.unitPrice,
            })),
      totalAmount,
      city,
      postalCode,
      address,
      phone: customerPhone,
      notes: notes || undefined,
      mapLink: mapLink || undefined,
      customCategory: customOrder?.category,
      customDescription: customOrder?.description,
      customTimeframe: customOrder?.timeframe,
      magicLoginLink,
      siteUrl: siteUrl(),
    };

    try {
      await sendOrderEmails(emailPayload);
    } catch (emailError) {
      await rollbackOrder(service, orderId);
      const message =
        emailError instanceof Error ? emailError.message : "Could not send order confirmation email.";
      return NextResponse.json(
        {
          error: `Order could not be completed: ${message} Please check your email address and try again.`,
        },
        { status: 502 }
      );
    }

    if (linkedUserId) {
      try {
        await service.from("notifications").insert({
          user_id: linkedUserId,
          type: "order_update",
          title: "Order pending",
          message: `Your order ${readableOrder} is pending. We will update you soon.`,
          link: `/user/orders/${orderId}`,
          meta: readableOrder,
        } as never);
      } catch (notifyError) {
        console.warn("[checkout] user notification failed:", notifyError);
      }
    }

    await notifyAdminPanel(orderId, customerName, customerEmail, isCustomOrder, totalAmount);

    const [{ data: settingRow }] = await Promise.all([
      service.from("site_settings").select("value").eq("key", "whatsapp_number").maybeSingle(),
    ]);
    const adminPhone =
      String(
        (settingRow as { value?: string } | null)?.value ??
          process.env.ADMIN_WHATSAPP_NUMBER ??
          process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
          "923159202186"
      )
        .replace(/\D/g, "")
        .trim() || "923159202186";

    const lines: string[] = [
      "NEW ORDER RECEIVED",
      "----------------------------",
      `Order ID: ${readableOrder}`,
      `Name: ${customerName}`,
      `Email: ${customerEmail}`,
      `Phone: ${customerPhone}`,
      `City: ${city}`,
      `Postal Code: ${postalCode}`,
      `Address: ${address}`,
      mapLink ? `Map: ${mapLink}` : "",
      "----------------------------",
      isCustomOrder ? "CUSTOM ORDER DETAILS:" : "ORDER ITEMS:",
    ];

    if (isCustomOrder && customOrder) {
      lines.push(`Category: ${String(customOrder.category ?? "").trim()}`);
      lines.push(`Description: ${String(customOrder.description ?? "").trim()}`);
      if (customOrder.timeframe) lines.push(`Timeline: ${customOrder.timeframe}`);
      if (customOrder.estimatedPrice) lines.push(`Estimated Price: ${customOrder.estimatedPrice}`);
    } else {
      safeItems.forEach((item) => {
        lines.push(`${item.name} x${item.quantity} - PKR ${(item.unitPrice * item.quantity).toLocaleString()}`);
      });
      lines.push("----------------------------");
      lines.push(`TOTAL: PKR ${totalAmount.toLocaleString()}`);
    }

    if (notes) {
      lines.push("----------------------------");
      lines.push(`Notes: ${notes}`);
    }
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(lines.join("\n"))}`;

    return NextResponse.json({
      ok: true,
      orderId,
      orderRef: readableOrder,
      whatsappUrl,
      emailSent: true,
      accountCreated: Boolean(tempPassword),
      accountExists,
      magicLinkIncluded: Boolean(magicLoginLink),
      awaitingCustomQuote: isCustomOrder,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected checkout error." },
      { status: 500 }
    );
  }
}
