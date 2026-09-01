import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

type Action = "create_account" | "send_form" | "nudge" | "complete";

function emailRecord(subject: string, template: string) {
  return { subject, template, sent_at: new Date().toISOString(), note: "recorded only — not delivered" };
}

/**
 * POST /api/admin/onboarding/[id]  { action }
 *
 *   create_account — provisions the student's auth account (email pre-confirmed)
 *                    and profile, links it to the task, returns a temp password.
 *   send_form      — marks the intake form as sent, generates its token.
 *   nudge          — appends a follow-up record (no delivery).
 *   complete       — closes onboarding; student profile becomes ACTIVE.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase, service } = await requireAdmin();
    const { id } = await params;
    const { action } = (await request.json()) as { action: Action };

    const { data: task, error: taskErr } = await supabase
      .from("onboarding_tasks")
      .select("*")
      .eq("id", id)
      .single();
    if (taskErr || !task) {
      return NextResponse.json({ error: "Onboarding task not found" }, { status: 404 });
    }

    const emailsLog = Array.isArray(task.emails_log) ? task.emails_log : [];

    // ---------------------------------------------------------------- create_account
    if (action === "create_account") {
      if (task.student_id) {
        return NextResponse.json({ error: "Account already created" }, { status: 409 });
      }

      const tempPassword = `Rboe-${randomBytes(4).toString("hex")}!`;
      const { data: created, error: createErr } = await service.auth.admin.createUser({
        email: task.prospect_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: task.prospect_name, role: "STUDENT" },
      });
      if (createErr || !created?.user) {
        console.error("create_account:", createErr);
        return NextResponse.json(
          { error: createErr?.message || "Failed to create the student account" },
          { status: 500 }
        );
      }

      const studentId = created.user.id;
      // handle_new_user trigger is unreliable via admin.createUser — upsert the profile.
      const { error: profErr } = await service.from("profiles").upsert(
        {
          user_id: studentId,
          full_name: task.prospect_name,
          role: "STUDENT",
          phone: task.phone,
          assigned_admin_id: task.assigned_admin_id || user.id,
          onboarding_stage: "ACCOUNT_CREATED",
        },
        { onConflict: "user_id" }
      );
      if (profErr) {
        console.error("create_account profile upsert:", profErr);
        return NextResponse.json({ error: "Account created but profile setup failed" }, { status: 500 });
      }

      const loginLink = `${APP_URL}/login?email=${encodeURIComponent(task.prospect_email)}`;
      const { data: updated, error: updErr } = await supabase
        .from("onboarding_tasks")
        .update({
          student_id: studentId,
          status: "ACCOUNT_CREATED",
          login_link: loginLink,
          last_contact_at: new Date().toISOString(),
          emails_log: [...emailsLog, emailRecord("Welcome to RBOE — your account is ready", "welcome")],
        })
        .eq("id", id)
        .select()
        .single();
      if (updErr) console.error("create_account task update:", updErr);

      return NextResponse.json({ task: updated, tempPassword, loginLink, email: task.prospect_email });
    }

    // ---------------------------------------------------------------- send_form
    if (action === "send_form") {
      if (!task.student_id) {
        return NextResponse.json({ error: "Create the account first" }, { status: 400 });
      }
      const intakeToken = randomBytes(12).toString("hex");
      const { data: updated, error: updErr } = await supabase
        .from("onboarding_tasks")
        .update({
          status: "FORM_SENT",
          intake_token: intakeToken,
          last_contact_at: new Date().toISOString(),
          next_follow_up: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10),
          emails_log: [...emailsLog, emailRecord("Complete your RBOE profile", "intake_form")],
        })
        .eq("id", id)
        .select()
        .single();
      if (updErr) {
        console.error("send_form:", updErr);
        return NextResponse.json({ error: "Failed to send the intake form" }, { status: 500 });
      }
      await supabase
        .from("profiles")
        .update({ onboarding_stage: "FORM_SENT" })
        .eq("user_id", task.student_id);

      return NextResponse.json({ task: updated, intakeLink: `${APP_URL}/student/onboarding` });
    }

    // ---------------------------------------------------------------- nudge
    if (action === "nudge") {
      const { data: updated, error: updErr } = await supabase
        .from("onboarding_tasks")
        .update({
          last_contact_at: new Date().toISOString(),
          emails_log: [...emailsLog, emailRecord("Reminder: finish your RBOE profile", "reminder")],
        })
        .eq("id", id)
        .select()
        .single();
      if (updErr) {
        console.error("nudge:", updErr);
        return NextResponse.json({ error: "Failed to record the nudge" }, { status: 500 });
      }
      return NextResponse.json({ task: updated });
    }

    // ---------------------------------------------------------------- complete
    if (action === "complete") {
      if (!task.student_id) {
        return NextResponse.json({ error: "No student account to activate" }, { status: 400 });
      }
      const { data: updated, error: updErr } = await supabase
        .from("onboarding_tasks")
        .update({ status: "COMPLETED", last_contact_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (updErr) {
        console.error("complete:", updErr);
        return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
      }
      await supabase
        .from("profiles")
        .update({ onboarding_stage: "ACTIVE" })
        .eq("user_id", task.student_id);

      return NextResponse.json({ task: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("onboarding action:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
