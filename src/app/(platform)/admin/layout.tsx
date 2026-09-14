import type { ReactNode } from "react";
import { AdminNav } from "@/components/layout/AdminNav";

/**
 * Admin routes: shared secondary navigation + slightly tighter vertical rhythm
 * via group + data-density (see PageShell / PageHeader).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="group min-w-0" data-app-area="admin" data-density="compact">
      <AdminNav />
      {children}
    </div>
  );
}
