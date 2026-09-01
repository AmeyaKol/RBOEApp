import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Server-side Supabase helpers for API route handlers.
 *
 * - `routeClient()` — request-scoped client bound to the caller's cookie
 *   session. RLS applies as that user. Use for normal reads/writes.
 * - `serviceClient()` — service-role client that bypasses RLS and can call
 *   `auth.admin.*`. Use only after you have verified the caller is an admin.
 * - `requireAdmin()` — 401 if unauthenticated, 403 if not an ADMIN; otherwise
 *   returns the caller + both clients.
 */
export function routeClient() {
  return createRouteHandlerClient({ cookies });
}

export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
  toResponse() {
    return NextResponse.json({ error: this.message }, { status: this.status });
  }
}

/**
 * Verifies the caller is an authenticated ADMIN. Throws HttpError otherwise —
 * catch it in the route and return `err.toResponse()`.
 */
export async function requireAdmin() {
  const supabase = routeClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new HttpError(401, "Unauthorized");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .single();
  if (profileError || profile?.role !== "ADMIN") {
    throw new HttpError(403, "Forbidden - Admin access required");
  }
  return { user, profile, supabase, service: serviceClient() };
}

/** Like requireAdmin but only needs an authenticated user of any role. */
export async function requireUser() {
  const supabase = routeClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new HttpError(401, "Unauthorized");
  return { user, supabase };
}
