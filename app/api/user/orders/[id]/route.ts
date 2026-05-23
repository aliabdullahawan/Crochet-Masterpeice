import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { canCustomerCancel, normalizeOrderStatus } from "@/lib/orderTracking";

type OrderRow = {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  total_amount: number;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  note: string | null;
  address: string | null;
  return_status: string | null;
};

const getBearerToken = (req: Request) => {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
};

async function getRequestUser(req: Request) {
  const token = getBearerToken(req);
  if (!token) return { user: null, error: "Missing authorization token" };

  const service = createServiceClient();
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) return { user: null, error: "Unauthorized" };

  return { user: data.user, error: null };
}

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(req: Request, context: RouteContext) {
  try {
    const auth = await getRequestUser(req);
    if (!auth.user) return NextResponse.json({ error: auth.error ?? "Unauthorized" }, { status: 401 });

    const params = await Promise.resolve(context.params);
    const orderId = String(params.id ?? "").trim();
    if (!orderId) return NextResponse.json({ error: "Order id is required" }, { status: 400 });

    const service = createServiceClient();

    const { data: orderData, error: orderError } = await service
      .from("orders")
      .select(
        "id, user_id, customer_name, customer_email, customer_phone, total_amount, status, source, created_at, updated_at, note, address, return_status"
      )
      .eq("id", orderId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
    if (!orderData) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const order = orderData as OrderRow;

    const { data: itemsData, error: itemsError } = await service
      .from("order_items")
      .select("order_id, product_id, product_name, quantity, unit_price")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

    let history: Array<{ to_status: string; changed_at: string | null }> = [];
    const { data: historyData } = await service
      .from("order_status_history")
      .select("to_status, changed_at")
      .eq("order_id", orderId)
      .order("changed_at", { ascending: true });
    if (Array.isArray(historyData)) {
      history = historyData as Array<{ to_status: string; changed_at: string | null }>;
    }

    return NextResponse.json({
      order: {
        id: order.id,
        displayId: `#${order.id.slice(0, 6).toUpperCase()}`,
        customer_name: order.customer_name,
        customer_email: order.customer_email ?? "",
        customer_phone: order.customer_phone,
        total_amount: order.total_amount,
        status: normalizeOrderStatus(order.status),
        source: order.source,
        created_at: order.created_at,
        updated_at: order.updated_at,
        note: order.note ?? "",
        address: order.address ?? "",
        return_status: order.return_status ?? "none",
        items: (itemsData ?? []).map((item) => ({
          product_id: (item as { product_id: string | null }).product_id,
          product_name: (item as { product_name: string }).product_name,
          quantity: Number((item as { quantity: number }).quantity),
          unit_price: Number((item as { unit_price: number }).unit_price),
        })),
        history,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const auth = await getRequestUser(req);
    if (!auth.user) return NextResponse.json({ error: auth.error ?? "Unauthorized" }, { status: 401 });

    const params = await Promise.resolve(context.params);
    const orderId = String(params.id ?? "").trim();
    if (!orderId) return NextResponse.json({ error: "Order id is required" }, { status: 400 });

    const body = (await req.json()) as { action?: string; reason?: string };
    if (body.action !== "cancel") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: currentOrder, error: currentError } = await service
      .from("orders")
      .select("id, status, note")
      .eq("id", orderId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
    if (!currentOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!canCustomerCancel((currentOrder as { status: string }).status)) {
      return NextResponse.json({ error: "Order can only be cancelled before shipping." }, { status: 400 });
    }

    const reason = String(body.reason ?? "").trim();
    const existingNote = String((currentOrder as { note?: string | null }).note ?? "").trim();
    const mergedNote = reason
      ? [existingNote, `Cancelled by customer: ${reason}`].filter(Boolean).join("\n")
      : existingNote;

    const { error: updateError } = await service
      .from("orders")
      .update({
        status: "cancelled",
        note: mergedNote,
        cancelled_at: new Date().toISOString(),
        cancelled_by: "customer",
        cancellation_reason: reason || null,
      } as never)
      .eq("id", orderId)
      .eq("user_id", auth.user.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await service.from("order_status_history").insert({
      order_id: orderId,
      from_status: (currentOrder as { status: string }).status,
      to_status: "cancelled",
      changed_by: "customer",
      notes: reason || null,
    } as unknown as never);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

