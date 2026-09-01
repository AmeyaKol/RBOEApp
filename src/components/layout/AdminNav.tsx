"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  MessageSquare,
  Plane,
  GraduationCap,
  Network,
  CalendarDays,
  Wallet,
  Megaphone,
  BarChart3,
  Sparkles,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** frontend-only preview area */
  preview?: boolean;
};

const CORE: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/onboarding", label: "Onboarding", icon: UserPlus },
  { href: "/admin/requests", label: "Requests", icon: MessageSquare },
  { href: "/admin/visa-scheduling", label: "Visa", icon: Plane },
  { href: "/admin/university-research", label: "University Research", icon: GraduationCap },
  { href: "/admin/alumni-outreach", label: "Alumni", icon: Network },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
];

const BUSINESS: NavItem[] = [
  { href: "/admin/payroll", label: "Payroll", icon: Wallet, preview: true },
  { href: "/admin/partnerships", label: "Partnerships", icon: Megaphone, preview: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, preview: true },
  { href: "/admin/ai-lab", label: "AI Lab", icon: Sparkles, preview: true },
];

/**
 * Secondary navigation for the admin workspace. Rendered once in the admin
 * layout so every admin page is reachable without going through the dashboard.
 */
export function AdminNav() {
  const pathname = usePathname();

  const renderLink = ({ href, label, icon: Icon, preview }: NavItem) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
          active
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
        {preview && (
          <span
            className={cn(
              "rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              active ? "bg-background/20 text-background" : "bg-amber-100 text-amber-700"
            )}
          >
            Preview
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {CORE.map(renderLink)}
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
        {BUSINESS.map(renderLink)}
      </nav>
    </div>
  );
}
