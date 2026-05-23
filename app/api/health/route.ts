import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

/** Quick check for Netlify/debug: Supabase env + DB reachability. */
export async function GET() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

  if (!hasUrl || !hasAnon) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY on the server.",
      },
      { status: 503 }
    );
  }

  try {
    const service = createServiceClient();
    const { error } = await service.from("products").select("id", { count: "exact", head: true }).limit(1);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message, hasService }, { status: 503 });
    }
    return NextResponse.json({ ok: true, hasService });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error", hasService },
      { status: 503 }
    );
  }
}
