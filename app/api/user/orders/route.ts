import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

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
  note: string | null;
  address: string | null;
};

type ItemRow = {
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
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

export async function GET(req: Request) {
  try {
    const auth = await getRequestUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error ?? "Unauthorized" }, { status: 401 });
    }

    const service = createServiceClient();
    const normalizedEmail = String(auth.user.email ?? "").trim().toLowerCase();

    // Backfill legacy rows where user_id was not linked but customer_email matches.
    if (normalizedEmail) {
      await service
        .from("orders")
        .update({ user_id: auth.user.id })
        .is("user_id", null)
        .ilike("customer_email", normalizedEmail);
    }

    const { data: ordersData, error: ordersError } = await service
      .from("orders")
      .select("id, user_id, customer_name, customer_email, customer_phone, total_amount, status, source, created_at, note, address")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const orders = (ordersData ?? []) as OrderRow[];
    const orderIds = orders.map((order) => order.id);

    const itemsByOrder = new Map<string, ItemRow[]>();
    if (orderIds.length) {
      const { data: itemsData, error: itemsError } = await service
        .from("order_items")
        .select("order_id, product_id, product_name, quantity, unit_price")
        .in("order_id", orderIds);

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }

      (itemsData ?? []).forEach((row) => {
        const item = row as ItemRow;
        const list = itemsByOrder.get(item.order_id) ?? [];
        list.push(item);
        itemsByOrder.set(item.order_id, list);
      });
    }

    const payload = orders.map((order) => ({
      id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email ?? "",
      customer_phone: order.customer_phone,
      total_amount: order.total_amount,
      status: order.status,
      source: order.source,
      created_at: order.created_at,
      note: order.note ?? "",
      address: order.address ?? "",
      items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    }));

    return NextResponse.json({ orders: payload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getRequestUser(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error ?? "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = String(searchParams.get("id") ?? "").trim();

    if (!orderId) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 });
    }

    const shortOrderId = `#${orderId.slice(0, 6).toUpperCase()}`;
    const service = createServiceClient();

    const { data: candidates, error: queryError } = await service
      .from("notifications")
      .select("id, meta")
      .eq("user_id", auth.user.id)
      .eq("type", "order_update");

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    const idsToDelete = (candidates ?? [])
      .filter((row) => {
        const meta = String((row as { meta: string | null }).meta ?? "");
        return meta.includes(shortOrderId) || meta.includes(orderId);
      })
      .map((row) => (row as { id: string }).id);

    if (idsToDelete.length) {
      const { error: deleteError } = await service
        .from("notifications")
        .delete()
        .in("id", idsToDelete)
        .eq("user_id", auth.user.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, deletedNotifications: idsToDelete.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
