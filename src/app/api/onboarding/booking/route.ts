import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase-server";

/**
 * POST /api/onboarding/booking — public lead capture from the landing page.
 * Creates an INVITED onboarding task (source = booking) that shows up in the
 * admin onboarding queue. Uses the service-role client since the caller is
 * unauthenticated; it only ever inserts a lead row.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      targetYear?: string;
      message?: string;
    };

    if (!body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const service = serviceClient();
    const note = [body.targetYear ? `Target: ${body.targetYear}` : null, body.message?.trim() || null]
      .filter(Boolean)
      .join(" — ");

    const { error } = await service.from("onboarding_tasks").insert({
      prospect_name: body.name.trim(),
      prospect_email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      source: "booking",
      status: "INVITED",
      invite_note: note || null,
      next_follow_up: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
    });
    if (error) {
      console.error("booking insert:", error);
      return NextResponse.json({ error: "Could not submit your request" }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("booking POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
