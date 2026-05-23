import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase";

type ProductRow = {
  id: string;
  name: string;
  stock_quantity: number | null;
  low_stock_notified_at: string | null;
  out_of_stock_notified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const getTimestampMs = (value: string | null) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const shouldNotify = (updatedAtMs: number, notifiedAtMs: number) => {
  if (!notifiedAtMs) return true;
  return updatedAtMs > notifiedAtMs;
};

export async function POST(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const header = req.headers.get("x-cron-secret") || "";
      if (header !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const service = getServiceRoleSupabase();
    if (!service) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason:
          "SUPABASE_SERVICE_ROLE_KEY is not set; low-stock scan and admin notifications insert are skipped.",
      });
    }

    const { data, error } = await service
      .from("products")
      .select("id, name, stock_quantity, low_stock_notified_at, out_of_stock_notified_at, created_at, updated_at")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const products = (data ?? []) as ProductRow[];
    const nowIso = new Date().toISOString();

    const notifications: Array<{
      type: string;
      title: string;
      message: string;
      link: string;
      meta: string;
    }> = [];

    const updates: Array<{ id: string; patch: Record<string, string | null> }> = [];

    products.forEach((product) => {
      const stock = Math.max(0, Number(product.stock_quantity ?? 0));
      const updatedAtMs = getTimestampMs(product.updated_at);
      const createdAtMs = getTimestampMs(product.created_at);
      const hasUpdatedSinceCreate = createdAtMs ? updatedAtMs > createdAtMs : true;
      const lowNotifiedMs = getTimestampMs(product.low_stock_notified_at);
      const outNotifiedMs = getTimestampMs(product.out_of_stock_notified_at);

      if (stock > 1) {
        if (product.low_stock_notified_at || product.out_of_stock_notified_at) {
          updates.push({
            id: product.id,
            patch: {
              low_stock_notified_at: null,
              out_of_stock_notified_at: null,
            },
          });
        }
        return;
      }

      if (stock === 1 && hasUpdatedSinceCreate && shouldNotify(updatedAtMs, lowNotifiedMs)) {
        notifications.push({
          type: "low_stock",
          title: `Low stock: ${product.name}`,
          message: `${product.name} is down to 1 item left in stock.`,
          link: "/admin/products",
          meta: product.name,
        });
        updates.push({
          id: product.id,
          patch: { low_stock_notified_at: nowIso },
        });
        return;
      }

      if (stock === 0 && hasUpdatedSinceCreate && shouldNotify(updatedAtMs, outNotifiedMs)) {
        notifications.push({
          type: "out_of_stock",
          title: `Out of stock: ${product.name}`,
          message: `${product.name} is now out of stock.`,
          link: "/admin/products",
          meta: product.name,
        });
        updates.push({
          id: product.id,
          patch: { out_of_stock_notified_at: nowIso },
        });
      }
    });

    if (notifications.length > 0) {
      const { error: notifError } = await service
        .from("admin_notifications")
        .insert(notifications);

      if (notifError) {
        return NextResponse.json({ error: notifError.message }, { status: 500 });
      }
    }

    if (updates.length > 0) {
      await Promise.all(
        updates.map((update) =>
          service.from("products").update(update.patch as never).eq("id", update.id)
        )
      );
    }

    return NextResponse.json({
      ok: true,
      notified: notifications.length,
      updated: updates.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
