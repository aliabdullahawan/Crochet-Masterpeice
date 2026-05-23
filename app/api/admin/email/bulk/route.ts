import { NextResponse } from "next/server";
import { createServiceClient, getServiceRoleSupabase } from "@/lib/supabase";
import { sendBulkBrevoEmail } from "@/lib/brevo";

type Body = {
  subject?: string;
  html?: string;
  onlySubscribed?: boolean;
};

type UserRow = {
  email: string | null;
  name: string | null;
  email_subscribed?: boolean | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const subject = String(body.subject ?? "").trim();
    const html = String(body.html ?? "").trim();
    const onlySubscribed = Boolean(body.onlySubscribed);

    if (!subject) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }
    if (!html) {
      return NextResponse.json({ error: "Email body is required." }, { status: 400 });
    }

    const service = getServiceRoleSupabase() ?? createServiceClient();

    let users: UserRow[] = [];
    if (onlySubscribed) {
      const preferred = await service
        .from("users")
        .select("email, name, email_subscribed")
        .eq("is_active", true)
        .eq("email_subscribed", true);
      if (preferred.error) {
        const fallback = await service.from("users").select("email, name").eq("is_active", true);
        if (fallback.error) {
          return NextResponse.json({ error: fallback.error.message }, { status: 500 });
        }
        users = (fallback.data ?? []) as UserRow[];
      } else {
        users = (preferred.data ?? []) as UserRow[];
      }
    } else {
      const allUsers = await service.from("users").select("email, name").eq("is_active", true);
      if (allUsers.error) {
        return NextResponse.json({ error: allUsers.error.message }, { status: 500 });
      }
      users = (allUsers.data ?? []) as UserRow[];
    }

    const recipients = users
      .map((user) => ({
        email: String(user.email ?? "").trim(),
        name: String(user.name ?? "").trim() || undefined,
      }))
      .filter((recipient) => recipient.email.length > 3 && recipient.email.includes("@"));

    if (!recipients.length) {
      return NextResponse.json({ error: "No recipients found." }, { status: 400 });
    }

    const result = await sendBulkBrevoEmail(recipients, subject, html);

    return NextResponse.json({
      ok: true,
      sent: result.sent,
      recipients: recipients.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 }
    );
  }
}

