import type { ReactNode } from "react";

/**
 * Admin routes: slightly tighter vertical rhythm via group + data-density (see PageShell / PageHeader).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="group min-w-0" data-app-area="admin" data-density="compact">
      {children}
    </div>
  );
}
