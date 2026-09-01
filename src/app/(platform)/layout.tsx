import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";

/**
 * Layout for Platform Pages (Authenticated Users)
 * 
 * This layout wraps all platform-related pages (student dashboard, admin dashboard, etc.)
 * and provides a consistent structure for authenticated users.
 * 
 * TODO: Add authentication check and redirect logic
 * TODO: Add sidebar navigation
 * TODO: Add user profile and logout functionality
 */
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
