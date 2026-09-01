import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  /** Vertical padding for main page content; compact density (admin) tightens via group-data */
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "py-6",
  md: "py-8 group-data-[density=compact]:py-6",
  lg: "py-10 group-data-[density=compact]:py-8",
};

/**
 * Consistent max-width, horizontal padding, and vertical rhythm for platform pages.
 * Pair with a parent that sets `data-density="compact"` (admin) for tighter rhythm.
 */
export function PageShell({ children, className, padding = "md" }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8",
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
