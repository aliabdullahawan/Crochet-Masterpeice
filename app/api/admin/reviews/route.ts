import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const HIDDEN_REVIEW_MARKER = "[HIDDEN_BY_ADMIN]";
const HIDDEN_REVIEW_IDS_KEY = "hidden_review_ids";

async function readHiddenReviewIds(service: ReturnType<typeof createServiceClient>) {
  const { data } = await service
    .from("site_settings")
    .select("value")
    .eq("key", HIDDEN_REVIEW_IDS_KEY)
    .maybeSingle();

  try {
    const parsed = JSON.parse((data as { value?: string } | null)?.value ?? "[]");
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0));
  } catch {
    return new Set<string>();
  }
}

async function writeHiddenReviewIds(service: ReturnType<typeof createServiceClient>, ids: Set<string>) {
  const payload = JSON.stringify(Array.from(ids));
  const { error } = await service
    .from("site_settings")
    .upsert({ key: HIDDEN_REVIEW_IDS_KEY, value: payload } as never, { onConflict: "key" });

  return error;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeHidden = searchParams.get("includeHidden") === "true";

    const service = createServiceClient();
    const hiddenReviewIds = await readHiddenReviewIds(service);

    const withModeration = await service
      .from("reviews")
      .select("id, product_id, user_id, user_name, rating, comment, admin_reply, created_at")
      .order("created_at", { ascending: false });

    let data: Array<{
      id: string;
      product_id: string;
      user_id: string | null;
      user_name: string;
      rating: number;
      comment: string;
      admin_reply?: string | null;
      created_at: string;
    }> = [];

    if (!withModeration.error) {
      data = (withModeration.data ?? []) as typeof data;
    } else {
      const legacy = await service
        .from("reviews")
        .select("id, product_id, user_id, user_name, rating, comment, created_at")
        .order("created_at", { ascending: false });

      if (legacy.error) {
        return NextResponse.json({ error: legacy.error.message }, { status: 500 });
      }

      data = ((legacy.data ?? []) as Array<{
        id: string;
        product_id: string;
        user_id: string | null;
        user_name: string;
        rating: number;
        comment: string;
        created_at: string;
      }>).map((r) => ({ ...r, admin_reply: null }));
    }

    const rows = (data ?? []) as Array<{
      id: string;
      product_id: string;
      user_id: string | null;
      user_name: string;
      rating: number;
      comment: string;
      admin_reply?: string | null;
      created_at: string;
    }>;

    const productIds = Array.from(new Set(rows.map((r) => r.product_id)));
    const { data: products } = await service
      .from("products")
      .select("id, name")
      .in("id", productIds);

    const productMap = new Map<string, string>(
      ((products ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name])
    );

    const mapped = rows
      .map((r) => {
        const isHidden = (r.admin_reply ?? "") === HIDDEN_REVIEW_MARKER || hiddenReviewIds.has(r.id);
        return {
          ...r,
          product_name: productMap.get(r.product_id) ?? "Product",
          is_hidden: isHidden,
        };
      })
      .filter((r) => (includeHidden ? true : !r.is_hidden));

    return NextResponse.json({ reviews: mapped });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as { reviewId?: string; hide?: boolean };
    const reviewId = String(body.reviewId ?? "").trim();
    const hide = body.hide !== false;

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const service = createServiceClient();
    const { error } = await service
      .from("reviews")
      .update({ admin_reply: hide ? HIDDEN_REVIEW_MARKER : null } as never)
      .eq("id", reviewId);

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("admin_reply") || msg.includes("column")) {
        const hiddenIds = await readHiddenReviewIds(service);
        if (hide) hiddenIds.add(reviewId);
        else hiddenIds.delete(reviewId);

        const writeError = await writeHiddenReviewIds(service, hiddenIds);
        if (writeError) {
          return NextResponse.json({ error: writeError.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, fallback: "site_settings" });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const hiddenIds = await readHiddenReviewIds(service);
    if (hide) hiddenIds.delete(reviewId);
    else hiddenIds.delete(reviewId);
    await writeHiddenReviewIds(service, hiddenIds);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { reviewId?: string };
    const reviewId = String(body.reviewId ?? "").trim();

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const service = createServiceClient();
    const { error } = await service.from("reviews").delete().eq("id", reviewId);

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
