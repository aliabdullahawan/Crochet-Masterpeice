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
  return_status?: string | null;
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
      .select("id, user_id, customer_name, customer_email, customer_phone, total_amount, status, source, created_at, note, address, return_status")
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
      return_status: order.return_status ?? "none",
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

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      return_status?: string;
      return_reason?: string;
    };

    const id = String(body.id ?? "").trim();
    const returnStatus = String(body.return_status ?? "").trim().toLowerCase();

    if (!id) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 });
    }
    if (!["none", "pending", "confirmed"].includes(returnStatus)) {
      return NextResponse.json({ error: "Invalid return_status" }, { status: 400 });
    }

    const service = createServiceClient();
    const patch: Record<string, string | null> = { return_status: returnStatus };

    if (returnStatus === "pending") {
      patch.return_requested_at = new Date().toISOString();
      if (body.return_reason) patch.return_reason = String(body.return_reason).trim();
    }
    if (returnStatus === "confirmed") {
      patch.return_confirmed_at = new Date().toISOString();
    }
    if (returnStatus === "none") {
      patch.return_reason = null;
    }

    const { data: orderRow, error } = await service
      .from("orders")
      .update(patch as never)
      .eq("id", id)
      .select("id, user_id, customer_email, return_status")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const order = orderRow as { id: string; user_id: string | null; return_status: string } | null;
    if (order?.user_id) {
      const title =
        returnStatus === "pending"
          ? "Return request recorded"
          : returnStatus === "confirmed"
            ? "Return confirmed"
            : "Return cleared";
      const message =
        returnStatus === "pending"
          ? `Your return request for order #${id.slice(0, 6).toUpperCase()} is pending review.`
          : returnStatus === "confirmed"
            ? `Return confirmed for order #${id.slice(0, 6).toUpperCase()}.`
            : `Return status updated for order #${id.slice(0, 6).toUpperCase()}.`;

      await service.from("notifications").insert({
        user_id: order.user_id,
        type: "order_update",
        title,
        message,
        link: `/user/orders/${id}`,
        meta: `#${id.slice(0, 6).toUpperCase()}`,
      } as never);
    }

    return NextResponse.json({ ok: true, return_status: order?.return_status ?? returnStatus });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
