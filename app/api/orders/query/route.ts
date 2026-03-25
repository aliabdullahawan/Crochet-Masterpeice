import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

type QueryItem = {
  productId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
};

type Body = {
  userId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  source?: "website" | "whatsapp" | "custom";
  items?: QueryItem[];
  totalAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  note?: string | null;
};

const formatOrderId = (id: string) => `#${id.slice(0, 6).toUpperCase()}`;
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json({ error: "No items provided." }, { status: 400 });
    }

    const safeItems = items
      .map((item) => ({
        productId: typeof item.productId === "string" && item.productId && isUuid(item.productId) ? item.productId : null,
        name: String(item.name ?? "").trim(),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        unitPrice: Math.max(0, Number(item.unitPrice ?? 0)),
      }))
      .filter((item) => item.name.length > 0);

    if (!safeItems.length) {
      return NextResponse.json({ error: "Items are invalid." }, { status: 400 });
    }

    const userId = typeof body.userId === "string" && body.userId ? body.userId : null;
    const customerName = String(body.customerName ?? "Guest").trim() || "Guest";
    const customerEmail = String(body.customerEmail ?? "").trim();
    const customerPhone = String(body.customerPhone ?? "").trim();
    const source = body.source ?? "website";
    const discountAmount = Math.max(0, Number(body.discountAmount ?? 0));
    const computedTotal = safeItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalAmount = Math.max(0, Number(body.totalAmount ?? computedTotal));
    const couponCode = String(body.couponCode ?? "").trim().toUpperCase() || null;
    const note = String(body.note ?? "Customer sent a website order query.").trim();

    const service = createServiceClient();

    const insertPayloadBase = {
      user_id: userId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      source,
      status: "pending",
      discount_amount: discountAmount,
      total_amount: totalAmount,
      note,
    };

    let createdOrder: { id: string } | null = null;

    // Backward-compatible insert for schemas with/without coupon_code column.
    {
      const withCoupon = await service
        .from("orders")
        .insert({ ...insertPayloadBase, coupon_code: couponCode })
        .select("id")
        .single();

      if (!withCoupon.error && withCoupon.data) {
        createdOrder = withCoupon.data as { id: string };
      } else {
        const fallback = await service
          .from("orders")
          .insert(insertPayloadBase)
          .select("id")
          .single();

        if (fallback.error || !fallback.data) {
          return NextResponse.json(
            { error: fallback.error?.message ?? withCoupon.error?.message ?? "Order create failed." },
            { status: 500 }
          );
        }

        createdOrder = fallback.data as { id: string };
      }
    }

    const orderId = createdOrder.id;

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
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Reduce stock only when query is successfully created.
    const qtyByProduct = new Map<string, number>();
    safeItems.forEach((item) => {
      if (!item.productId) return;
      const prev = qtyByProduct.get(item.productId) ?? 0;
      qtyByProduct.set(item.productId, prev + item.quantity);
    });

    if (qtyByProduct.size > 0) {
      const productIds = Array.from(qtyByProduct.keys());
      const { data: products } = await service
        .from("products")
        .select("id, stock_quantity")
        .in("id", productIds);

      if (products?.length) {
        await Promise.all(
          (products as { id: string; stock_quantity: number | null }[]).map((product) => {
            const orderedQty = qtyByProduct.get(product.id) ?? 0;
            const nextStock = Math.max(0, Number(product.stock_quantity ?? 0) - orderedQty);
            return service.from("products").update({ stock_quantity: nextStock }).eq("id", product.id);
          })
        );
      }
    }

    // Reduce coupon usage only when query is successfully created.
    if (couponCode) {
      const { data: discount } = await service
        .from("discounts")
        .select("id, uses_count, max_uses")
        .eq("code", couponCode)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (discount?.id) {
        const uses = Number(discount.uses_count ?? 0);
        const max = discount.max_uses === null ? null : Number(discount.max_uses);
        if (max === null || uses < max) {
          await service.from("discounts").update({ uses_count: uses + 1 }).eq("id", discount.id);
        }
      }
    }

    if (userId) {
      await service.from("notifications").insert({
        user_id: userId,
        type: "order_update",
        title: "Order query sent",
        message: `Your order query ${formatOrderId(orderId)} has been sent to admin. We will update you soon.`,
        link: "/user/profile",
        meta: formatOrderId(orderId),
      });
    }

    return NextResponse.json({ ok: true, orderId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 }
    );
  }
}
