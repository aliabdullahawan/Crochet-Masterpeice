import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { accountExistsForEmail } from "@/lib/auth/accountByEmail";
import { validateCustomerEmail } from "@/lib/validateEmail";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const validated = validateCustomerEmail(String(body.email ?? ""));
    if (!validated.ok) {
      return NextResponse.json({ exists: false, valid: false, error: validated.error });
    }

    const service = createServiceClient();
    const exists = await accountExistsForEmail(service, validated.normalized);

    return NextResponse.json({
      valid: true,
      exists,
      email: validated.normalized,
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, exists: false, error: error instanceof Error ? error.message : "Check failed." },
      { status: 500 }
    );
  }
}
