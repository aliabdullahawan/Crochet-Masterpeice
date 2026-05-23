import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isCountableSale } from "@/lib/analyticsFromOrders";
import { netOrderRevenue } from "@/lib/returns";

export async function GET() {
  try {
    const service = createServiceClient();

    const [{ data: users, error: usersError }, { data: orders, error: ordersError }] =
      await Promise.all([
        service
          .from("users")
          .select("id, email, name, phone, created_at, is_active")
          .order("created_at", { ascending: false }),
        service
          .from("orders")
          .select("user_id, customer_email, total_amount, return_status, status, created_at")
          .neq("status", "cancelled"),
      ]);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const orderStats = new Map<string, { total_orders: number; total_spent: number; last_order?: string }>();

    (orders ?? []).forEach(
      (o: {
        user_id: string | null;
        customer_email: string | null;
        total_amount: number;
        return_status?: string | null;
        status: string;
        created_at: string;
      }) => {
        if (!isCountableSale(o.status)) return;
        const keys = [
          o.user_id ? `id:${o.user_id}` : null,
          o.customer_email ? `email:${o.customer_email.trim().toLowerCase()}` : null,
        ].filter(Boolean) as string[];

        keys.forEach((key) => {
          const cur = orderStats.get(key) ?? { total_orders: 0, total_spent: 0 };
          cur.total_orders += 1;
          cur.total_spent += netOrderRevenue(o.total_amount, o.return_status);
          if (!cur.last_order || o.created_at > cur.last_order) {
            cur.last_order = o.created_at;
          }
          orderStats.set(key, cur);
        });
      },
    );

    const customers = (users ?? []).map(
      (u: {
        id: string;
        email: string;
        name: string;
        phone: string | null;
        created_at: string;
        is_active: boolean;
      }) => {
        const byId = orderStats.get(`id:${u.id}`);
        const byEmail = orderStats.get(`email:${u.email.trim().toLowerCase()}`);
        const stats = byId ?? byEmail ?? { total_orders: 0, total_spent: 0 };

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone ?? undefined,
          joined: new Date(u.created_at).toISOString().split("T")[0],
          total_orders: stats.total_orders,
          total_spent: stats.total_spent,
          last_order: stats.last_order,
          is_active: u.is_active,
        };
      },
    );

    return NextResponse.json({ customers });
  } catch (e) {
    console.error("[admin/customers]", e);
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 });
  }
}
