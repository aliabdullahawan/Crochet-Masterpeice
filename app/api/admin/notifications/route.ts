import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

type Payload = {
  userId?: string;
  type?: "order_update" | "review_reply" | "admin_message" | "discount" | "promo";
  title?: string;
  message?: string;
  link?: string;
  meta?: string;
};

const ALLOWED_TYPES = new Set(["order_update", "review_reply", "admin_message", "discount", "promo"]);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const userId = String(body.userId || "").trim();
    const title = String(body.title || "").trim();
    const message = String(body.message || "").trim();
    const rawType = String(body.type || "admin_message");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(rawType)) {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }
    const type = rawType as "order_update" | "review_reply" | "admin_message" | "discount" | "promo";

    const service = createServiceClient();
    const { error } = await service.from("notifications").insert({
      user_id: userId,
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
