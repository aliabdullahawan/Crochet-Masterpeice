import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase";

const ALLOWED_KEYS = new Set([
  "instagram_count_manual",
  "facebook_count_manual",
  "tiktok_count_manual",
  "whatsapp_count_manual",
]);

type Payload = {
  platform?: string;
  value?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const platform = String(body.platform || "").toLowerCase();
    const safeValue = Math.max(0, Number(body.value) || 0);
    const key = `${platform}_count_manual`;

    if (!ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const service = createServiceClient();
    const { error } = await service
      .from("site_settings")
      .upsert({ key, value: String(safeValue) }, { onConflict: "key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/");
    revalidatePath("/user/home");
    revalidatePath("/api/social-counts");

    return NextResponse.json({ ok: true, key, value: safeValue });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
