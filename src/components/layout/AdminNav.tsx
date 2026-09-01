"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, LayoutDashboard, Shield } from "lucide-react";
import {
  ADMIN_NAV_GROUPS,
  matchAdminNavItem,
} from "@/components/layout/admin-nav-items";

/**
 * Admin workspace chrome: a single slim bar carrying the workspace label, a
 * "Dashboard" shortcut, and a "Switch workspace" dropdown that expands to the
 * full, grouped list of admin areas. Rendered once in the admin layout.
 *
 * On the dashboard itself the switcher is hidden — the dashboard card grid is
 * the navigation there.
 */
export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = matchAdminNavItem(pathname);
  const onDashboard = pathname === "/admin/dashboard";

  // AdminNav lives in the layout and does not unmount on navigation, so the menu
  // must be closed explicitly whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        ref={rootRef}
        className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8"
      >
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Shield className="h-4 w-4 shrink-0 text-primary" />
          <span className="hidden shrink-0 font-medium text-foreground sm:inline">
            Admin workspace
          </span>
          {current && !onDashboard && (
            <>
              <span className="text-muted-foreground" aria-hidden>
                /
              </span>
              <span className="truncate font-medium text-foreground">
                {current.label}
              </span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!onDashboard && (
            <Link
              href="/admin/dashboard"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm transition-colors",
                open
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span>Switch workspace</span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
              />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 z-40 mt-2 max-h-[70vh] w-[19rem] overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg"
              >
                {ADMIN_NAV_GROUPS.map((group) => (
                  <div key={group.id} className="mb-1 last:mb-0">
                    <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    {group.items.map(({ href, label, description, icon: Icon, preview }) => {
                      const active =
                        pathname === href || pathname.startsWith(href + "/");
                      return (
                        <Link
                          key={href}
                          href={href}
                          role="menuitem"
                          aria-current={active ? "page" : undefined}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-start gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                            active
                              ? "bg-muted"
                              : "hover:bg-muted"
                          )}
                        >
                          <Icon
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              active ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">{label}</span>
                              {preview && (
                                <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                                  Preview
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {description}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
