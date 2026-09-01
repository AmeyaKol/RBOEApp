import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

/**
 * Login Page Component
 *
 * This page provides authentication for both students and admins
 * using a tabbed interface for role-based login.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
