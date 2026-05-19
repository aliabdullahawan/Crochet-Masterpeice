import { NextResponse } from "next/server";
import { createServiceClient, getServiceRoleSupabase } from "@/lib/supabase";

type CustomRow = {
  id: string;
  linked_order_id: string | null;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  category: string;
  custom_category: string | null;
  description: string;
  price_min: number | null;
  price_max: number | null;
  timeframe: string | null;
  quoted_price: number | null;
  pricing_status: string | null;
  status: string | null;
  created_at: string;
};

export async function GET() {
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from("custom_orders")
      .select(
        "id, linked_order_id, user_id, customer_name, customer_email, customer_phone, category, custom_category, description, price_min, price_max, timeframe, quoted_price, pricing_status, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as CustomRow[];
    const awaiting = rows.filter(
      (r) => (r.pricing_status ?? "awaiting_quote") === "awaiting_quote" || !r.quoted_price
    );

    return NextResponse.json({ customOrders: rows, awaitingCount: awaiting.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      quotedPrice?: number;
      action?: "quote" | "reject";
    };

    const id = String(body.id ?? "").trim();
    const action = body.action ?? "quote";
    const quotedPrice = Math.max(0, Math.round(Number(body.quotedPrice ?? 0)));

    if (!id) {
      return NextResponse.json({ error: "Custom order id is required" }, { status: 400 });
    }

    const service = createServiceClient();

    const { data: customRow, error: fetchError } = await service
      .from("custom_orders")
      .select("id, linked_order_id, user_id, customer_name, category, description")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    if (!customRow) {
      return NextResponse.json({ error: "Custom order not found" }, { status: 404 });
    }

    const row = customRow as CustomRow;

    if (action === "reject") {
      await service
        .from("custom_orders")
        .update({ pricing_status: "rejected", status: "rejected" } as never)
        .eq("id", id);

      if (row.linked_order_id) {
        await service
          .from("orders")
          .update({ status: "cancelled", cancellation_reason: "Custom order rejected by admin" } as never)
          .eq("id", row.linked_order_id);
      }

      return NextResponse.json({ ok: true, rejected: true });
    }

    if (!quotedPrice) {
      return NextResponse.json({ error: "Quoted price must be greater than 0" }, { status: 400 });
    }

    await service
      .from("custom_orders")
      .update({ quoted_price: quotedPrice, pricing_status: "quoted", status: "quoted" } as never)
      .eq("id", id);

    if (row.linked_order_id) {
      await service
        .from("orders")
        .update({ total_amount: quotedPrice } as never)
        .eq("id", row.linked_order_id);

      await service
        .from("order_items")
        .update({ unit_price: quotedPrice } as never)
        .eq("order_id", row.linked_order_id);
    }

    const orderRef = row.linked_order_id ? `#${row.linked_order_id.slice(0, 6).toUpperCase()}` : "";
    const notifyUserId = row.user_id;

    if (notifyUserId && row.linked_order_id) {
      await service.from("notifications").insert({
        user_id: notifyUserId,
        type: "order_update",
        title: "Your custom order price is ready",
        message: `We quoted PKR ${quotedPrice.toLocaleString()} for your custom request (${row.category}). Order ${orderRef}.`,
        link: `/user/orders/${row.linked_order_id}`,
        meta: orderRef,
      } as never);
    }

    const adminDb = getServiceRoleSupabase();
    if (adminDb) {
      await adminDb.from("admin_notifications").insert({
        type: "order",
        title: `Custom order quoted ${orderRef}`,
        message: `${row.customer_name} — PKR ${quotedPrice.toLocaleString()} set for ${row.category}.`,
        link: "/admin/orders",
        meta: row.linked_order_id ?? id,
      });
    }

    return NextResponse.json({ ok: true, quotedPrice, orderId: row.linked_order_id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
