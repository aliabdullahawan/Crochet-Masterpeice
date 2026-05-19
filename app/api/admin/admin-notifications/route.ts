import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

function isMissingTableError(message: string, code?: string) {
  const m = message.toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    m.includes("does not exist") ||
    m.includes("schema cache")
  );
}

type AdminNotificationPayload = {
  type?: string;
  title?: string;
  message?: string;
  link?: string;
  meta?: string;
};

type PatchPayload = {
  action?: "mark_read" | "mark_all_read" | "clear_all";
  id?: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get("limit") ?? "0");
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 0;
    const unreadOnly = searchParams.get("unread") === "1";

    const service = getServiceRoleSupabase();
    if (!service) {
      return NextResponse.json({
        notifications: [],
        setup_hint:
          "Set SUPABASE_SERVICE_ROLE_KEY in your server environment. The anon key cannot read admin_notifications.",
      });
    }

    let query = service
      .from("admin_notifications")
      .select("id, type, title, message, link, meta, is_read, created_at")
      .order("created_at", { ascending: false });

    if (unreadOnly) query = query.eq("is_read", false);
    if (limit > 0) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      const code = "code" in error ? String((error as { code?: string }).code ?? "") : "";
      if (isMissingTableError(error.message, code)) {
        return NextResponse.json({
          notifications: [],
          setup_hint:
            "Table admin_notifications is missing or not exposed. Run the admin_notifications section of DATABASE.sql in the Supabase SQL editor.",
        });
      }
      console.error("[admin-notifications GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AdminNotificationPayload;
    const title = String(body.title ?? "").trim();
    const message = String(body.message ?? "").trim();
    const type = String(body.type ?? "system").trim() || "system";

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const service = getServiceRoleSupabase();
    if (!service) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY is required to create admin notifications." },
        { status: 503 }
      );
    }

    const { error } = await service.from("admin_notifications").insert({
      type,
      title,
      message,
      link: body.link || null,
      meta: body.meta || null,
    });

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
    const body = (await req.json()) as PatchPayload;
    const action = body.action ?? "";

    const service = getServiceRoleSupabase();
    if (!service) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY is required to update admin notifications." },
        { status: 503 }
      );
    }

    if (action === "mark_read") {
      const id = String(body.id ?? "").trim();
      if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
      }
      const { error } = await service
        .from("admin_notifications")
        .update({ is_read: true } as never)
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "mark_all_read") {
      const { error } = await service
        .from("admin_notifications")
        .update({ is_read: true } as never)
        .eq("is_read", false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "clear_all") {
      // PostgREST requires a filter on delete; delete all rows with a real UUID id.
      const { error } = await service.from("admin_notifications").delete().neq("id", NIL_UUID);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
