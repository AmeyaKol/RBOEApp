import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  /** Extra top margin when stacked */
  spaced?: boolean;
}

/**
 * Titled block for marketing sections or grouped admin content.
 */
export function Section({ children, title, description, className, spaced }: SectionProps) {
  return (
    <section
      className={cn(spaced && "mt-12 sm:mt-16", className)}
    >
      {(title || description) && (
        <div className="mb-6 sm:mb-8">
          {title ? (
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}
