"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { Menu, X, GraduationCap, Shield, LogOut, User } from "lucide-react";

/**
 * Header: navigation, auth-aware links, optional admin context strip.
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isAdmin = user?.profile?.role === "ADMIN";

  return (
    <>
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                  RBOE
                </span>
              </Link>
            </div>

            <nav className="hidden items-center gap-6 md:flex">
              {!loading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {isAdmin ? (
                          <Shield className="h-4 w-4 shrink-0" />
                        ) : (
                          <GraduationCap className="h-4 w-4 shrink-0" />
                        )}
                        <span className="max-w-[200px] truncate">
                          {user.profile?.full_name || user.email}
                        </span>
                      </div>

                      <Link
                        href={
                          isAdmin ? "/admin/dashboard" : "/student/dashboard"
                        }
                      >
                        <Button variant="outline" size="sm">
                          Dashboard
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link href="/#services">
                        <Button variant="ghost" size="sm">
                          Services
                        </Button>
                      </Link>
                      <Link href="/#testimonials">
                        <Button variant="ghost" size="sm">
                          Testimonials
                        </Button>
                      </Link>
                      <Link href="/#contact">
                        <Button variant="ghost" size="sm">
                          Contact
                        </Button>
                      </Link>
                      <Link href="/login">
                        <Button size="sm">
                          <User className="mr-2 h-4 w-4" />
                          Login
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </nav>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden">
              <div className="space-y-1 border-t border-border px-2 pb-3 pt-2">
                {!loading && (
                  <>
                    {user ? (
                      <div className="space-y-2">
                        <div className="border-b border-border px-3 py-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {isAdmin ? (
                              <Shield className="h-4 w-4" />
                            ) : (
                              <GraduationCap className="h-4 w-4" />
                            )}
                            <span className="break-all">
                              {user.profile?.full_name || user.email}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={
                            isAdmin ? "/admin/dashboard" : "/student/dashboard"
                          }
                        >
                          <Button variant="outline" className="w-full justify-start">
                            Dashboard
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link href="/#services">
                          <Button variant="ghost" className="w-full justify-start">
                            Services
                          </Button>
                        </Link>
                        <Link href="/#testimonials">
                          <Button variant="ghost" className="w-full justify-start">
                            Testimonials
                          </Button>
                        </Link>
                        <Link href="/#contact">
                          <Button variant="ghost" className="w-full justify-start">
                            Contact
                          </Button>
                        </Link>
                        <Link href="/login">
                          <Button className="w-full justify-start">
                            <User className="mr-2 h-4 w-4" />
                            Login
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
