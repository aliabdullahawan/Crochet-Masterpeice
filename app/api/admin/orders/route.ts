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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get("limit") ?? "0");
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 0;

    const service = createServiceClient();

    let ordersQuery = service
      .from("orders")
      .select("id, user_id, customer_name, customer_email, customer_phone, total_amount, status, source, created_at, note, address")
      .order("created_at", { ascending: false });

    if (limit > 0) {
      ordersQuery = ordersQuery.limit(limit);
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;
    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const orders = (ordersData ?? []) as OrderRow[];
    const orderIds = orders.map((order) => order.id);

    let itemsByOrder = new Map<string, ItemRow[]>();
    if (orderIds.length) {
      const { data: itemsData, error: itemsError } = await service
        .from("order_items")
        .select("order_id, product_id, product_name, quantity, unit_price")
        .in("order_id", orderIds);

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }

      const rows = (itemsData ?? []) as ItemRow[];
      rows.forEach((row) => {
        const list = itemsByOrder.get(row.order_id) ?? [];
        list.push(row);
        itemsByOrder.set(row.order_id, list);
      });
    }

    const payload = orders.map((order) => ({
      id: order.id,
      user_id: order.user_id,
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
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") ?? "").trim();

    if (!id) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 });
    }

    const service = createServiceClient();
    const { error } = await service.from("orders").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
