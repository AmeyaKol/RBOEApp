import type { ReactNode } from "react";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="group min-w-0" data-app-area="student" data-density="comfortable">
      {children}
    </div>
  );
}
