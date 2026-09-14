import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

/**
 * Admin-only helper: mark a user's email as confirmed so they can sign in
 * without the confirmation mail (useful in the demo environment).
 *
 * Requires an authenticated ADMIN caller. Uses the service-role client for the
 * privileged auth.admin call.
 */
export async function POST(request: NextRequest) {
  try {
    const { service } = await requireAdmin();

    const { email } = (await request.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data, error: listError } = await service.auth.admin.listUsers();
    if (listError) {
      console.error("confirm-user: listUsers failed", listError);
      return NextResponse.json({ error: "Failed to access user data" }, { status: 500 });
    }

    const target = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: updateError } = await service.auth.admin.updateUserById(target.id, {
      email_confirm: true,
    });
    if (updateError) {
      console.error("confirm-user: updateUserById failed", updateError);
      return NextResponse.json({ error: "Failed to confirm user" }, { status: 500 });
    }

    return NextResponse.json({ message: "User confirmed" });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("confirm-user: unexpected error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
