import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Auth pages: split layout with brand panel and form column.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container relative grid min-h-screen max-w-none flex-col items-center justify-center lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col justify-between border-r border-border bg-primary p-10 text-primary-foreground lg:flex">
          <div className="relative z-10 flex items-center gap-2 text-lg font-semibold">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary-foreground/20 bg-primary-foreground/10">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="font-display tracking-tight">RBOE</span>
          </div>
          <div className="relative z-10 max-w-md space-y-4">
            <p className="font-display text-2xl font-semibold leading-snug">
              Graduate admissions guidance, built for clarity and outcomes.
            </p>
            <blockquote className="space-y-2 border-l-2 border-primary-foreground/30 pl-4 text-sm leading-relaxed text-primary-foreground/90">
              <p>
                &quot;The SOP process gave me a strong draft to refine with my
                counselor—I landed admits I was aiming for.&quot;
              </p>
              <footer className="text-xs text-primary-foreground/75">
                — Student testimonial
              </footer>
            </blockquote>
          </div>
        </div>
        <div className="flex w-full flex-col justify-center px-6 py-12 lg:p-10">
          <div className="mx-auto flex w-full max-w-[380px] flex-col justify-center space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
