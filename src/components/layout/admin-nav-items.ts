import {
  LayoutDashboard,
  Users,
  UserPlus,
  MessageSquare,
  Plane,
  GraduationCap,
  Network,
  CalendarDays,
  Clock,
  Wallet,
  Megaphone,
  BarChart3,
  Sparkles,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  /** one-line summary, shown on the dashboard cards and in the nav dropdown */
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** frontend-only preview area (no persistence) */
  preview?: boolean;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

/**
 * Single source of truth for admin navigation. Consumed by both the dashboard
 * card grid (`admin/dashboard`) and the workspace switcher dropdown (`AdminNav`).
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        description: "Portfolio overview — pending work, deadlines, and recent activity.",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/students",
        label: "Students",
        description: "Every assigned student, their applications, documents, and progress.",
        icon: Users,
      },
      {
        href: "/admin/onboarding",
        label: "Onboarding",
        description: "Prospect queue — create accounts, send intake forms, complete setup.",
        icon: UserPlus,
      },
      {
        href: "/admin/requests",
        label: "Requests",
        description: "Urgency-ranked student requests: chat, document edits, college lists.",
        icon: MessageSquare,
      },
      {
        href: "/admin/visa-scheduling",
        label: "Visa scheduling",
        description: "Mock interview requests, scheduling, and post-session feedback.",
        icon: Plane,
      },
      {
        href: "/admin/university-research",
        label: "University research",
        description: "Verified cost, program, and deadline research shared with students.",
        icon: GraduationCap,
      },
      {
        href: "/admin/alumni-outreach",
        label: "Alumni outreach",
        description: "Alumni directory and outreach log (records only — nothing is sent).",
        icon: Network,
      },
      {
        href: "/admin/calendar",
        label: "Calendar",
        description: "Application deadlines and visa mock slots across all your students.",
        icon: CalendarDays,
      },
      {
        href: "/admin/activity-log",
        label: "Activity log",
        description: "Reverse-chronological feed of request, document, and application changes.",
        icon: Clock,
      },
    ],
  },
  {
    id: "business",
    label: "Business & AI (Preview)",
    items: [
      {
        href: "/admin/payroll",
        label: "Payroll",
        description: "Staff roster, monthly run, and payslip preview.",
        icon: Wallet,
        preview: true,
      },
      {
        href: "/admin/partnerships",
        label: "Partnerships",
        description: "Referral coupons, sponsor list, and campaign funnels.",
        icon: Megaphone,
        preview: true,
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        description: "Admissions funnel, acceptance rates, request load, and revenue.",
        icon: BarChart3,
        preview: true,
      },
      {
        href: "/admin/ai-lab",
        label: "AI Lab",
        description: "College prediction and SOP/LOR assistant (simulated).",
        icon: Sparkles,
        preview: true,
      },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

/**
 * Resolve the nav item that best matches a pathname, by longest href prefix, so
 * `/admin/students/<id>` still resolves to the Students entry.
 */
export function matchAdminNavItem(pathname: string): AdminNavItem | undefined {
  let best: AdminNavItem | undefined;
  for (const item of ADMIN_NAV_ITEMS) {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best;
}
